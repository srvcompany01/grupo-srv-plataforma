import * as z from 'zod'
import { descricaoParaTexto, textoParaDescricao } from '@/dominio/descricao'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { CATALOGO_CAMPOS, TIPOS_CAMPO, type TipoCampoPersonalizado } from '@/dominio/personalizacao'
import { PRIORIDADES } from '@/dominio/tarefas'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { definirPaginaMeta, listarClientes, marcasDeTrabalhoDesde } from '@/servicos/clientes-plataforma'
import { lerPaginaMeta, urlBibliotecaAnuncios } from '@/dominio/biblioteca-anuncios'
import { lerContaAnuncios, referencias, ROTULO_PAPEL, taxasDoAnuncio, totaisAnuncios } from '@/dominio/anuncios-meta'
import { diasDoPeriodo, rankingDeTrabalho } from '@/dominio/trabalho-clientes'
import { dataLocal, horaLocal, instante, lerCompromisso, ocorrencias, paraEntrada, semanaDe, somarDias, type EntradaCompromisso } from '@/dominio/agenda'
import * as agenda from '@/servicos/agenda'
import * as chat from '@/servicos/chat'
import * as conteudoSvc from '@/servicos/conteudo'
import { extrairMencoes, segmentarTexto } from '@/dominio/mencoes'
import { listaDeProjetos, painelDoEscopo } from '@/servicos/painel-projetos'
import { formatarDuracao } from '@/dominio/painel-projetos'
import { lerCollabs } from '@/dominio/publicacao'
import { totaisCampanhas } from '@/dominio/google'
import { analisarCombinado, analisarOrganico, analisarPago, engajamentoOrganico, porFormato } from '@/dominio/insights'
import { lerPeriodo } from '@/dominio/periodo-anuncios'

/** Período das ferramentas de anúncios: de/ate (AAAA-MM-DD) ou os últimos 7/30 dias até ontem. */
const periodoDaIA = (a: { dias?: 7 | 30; de?: string; ate?: string }) => lerPeriodo({ dias: String(a.dias ?? 7), de: a.de, ate: a.ate }, dataDeHoje(new Date()))
import { ROTULO_STATUS_TIME, STATUS_TIME, duracao, minutosDesde, situacao } from '@/dominio/time'
import * as time from '@/servicos/time'
import * as campos from '@/servicos/campos-personalizados'
import { criarComentario } from '@/servicos/comentarios'
import { listarArvore } from '@/servicos/espacos'
import * as estrutura from '@/servicos/estrutura'
import { buscarLista } from '@/servicos/listas'
import * as status from '@/servicos/status'
import * as tarefas from '@/servicos/tarefas'
import * as documentos from '@/servicos/documentos'
import { anexarTexto, conteudoAtual } from '@/servicos/documentos-yjs'
import { arvoreDePaginas } from '@/dominio/documentos'
import { listarEquipe } from '@/servicos/usuarios'
import * as financeiro from '@/servicos/financeiro'
import * as telas from '@/servicos/telas'
import { CATEGORIAS, TIPOS_LANCAMENTO, lerMes, limitesDoMes, resumir } from '@/dominio/financeiro'
import { calcularFunil, lerDadosFunil } from '@/dominio/funil'
import type { NoEspaco, NoPasta, ItemLista } from '@/dominio/arvore-espacos'

/**
 * Catálogo ÚNICO das ferramentas MCP da plataforma. Toda funcionalidade nova da plataforma que a IA deva usar
 * entra aqui (uma entrada = uma ferramenta). `escrita: true` só fica disponível para tokens com escopo de escrita.
 */
export type Contexto = { sb: Supabase; userId: string; nome: string; papel: string; escopo: 'read' | 'write' }

export type Ferramenta = {
  nome: string
  descricao: string
  escrita: boolean
  entrada: z.ZodRawShape
  executar: (ctx: Contexto, args: never) => Promise<unknown>
}

function definir<S extends z.ZodRawShape>(f: {
  nome: string
  descricao: string
  escrita: boolean
  entrada: S
  executar: (ctx: Contexto, args: z.infer<z.ZodObject<S>>) => Promise<unknown>
}): Ferramenta {
  return f as unknown as Ferramenta
}

const id = (descricao: string) => z.string().uuid().describe(descricao)
const data = (descricao: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe(`${descricao} (AAAA-MM-DD)`)
const valorCampo = z
  .union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()])
  .describe('Valor do campo: texto, número, true/false, lista de textos (rótulos) ou null para limpar. Datas em AAAA-MM-DD; lista suspensa = o texto de uma das opções.')

const resumoLista = (l: ItemLista) => ({ id: l.id, nome: l.nome, cliente: l.clienteNome, mes: l.mes })
const resumoPasta = (p: NoPasta) => ({ id: p.id, nome: p.nome, listas: p.listas.map(resumoLista) })
const resumoEspaco = (e: NoEspaco): unknown => ({
  id: e.id,
  nome: e.nome,
  subareas: e.filhos.map(resumoEspaco),
  pastas: e.pastas.map(resumoPasta),
  listas: e.listas.map(resumoLista),
})

const STATUS_CATEGORIAS = ['todo', 'in_progress', 'done'] as const

// Carregado na hora: o serviço do Google é server-only (usa a chave mestra).
const googleAgenda = () => import('@/servicos/google-agenda')

const hora = (descricao: string) => z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).describe(`${descricao} (HH:MM, fuso de Belém)`)
const entradaCompromisso = {
  titulo: z.string().min(1).max(120).describe('Título'),
  descricao: z.string().max(2000).optional().describe('Descrição (texto simples)'),
  data: data('Dia do compromisso (o primeiro, se for fixo)'),
  horaInicio: hora('Início').optional(),
  horaFim: hora('Fim').optional(),
  diaInteiro: z.boolean().optional().describe('Dia inteiro (ignora as horas)'),
  visibilidade: z.enum(['privado', 'equipe', 'selecionados']).optional().describe('privado (padrão), equipe ou selecionados'),
  pessoas: z.array(z.string().uuid()).max(50).optional().describe('Com visibilidade selecionados: ids de listar_equipe'),
  repetir: z.enum(['nunca', 'diario', 'semanal', 'mensal']).optional().describe('nunca (padrão), diario, semanal ou mensal'),
  repetirAte: data('Último dia da repetição').nullable().optional(),
  clienteId: id('Cliente vinculado (id de listar_clientes); null tira o vínculo').nullable().optional(),
  tags: z.array(z.string().uuid()).max(20).optional().describe('Tags do compromisso (ids de listar_tags_agenda); a lista substitui as atuais'),
  categoriaId: id('Categoria (id de listar_categorias_agenda); null deixa sem categoria').nullable().optional(),
}

/** Campos de artigo do blog aceitos pelo MCP (criar exige título e conteúdo; atualizar aceita qualquer subconjunto). */
const CAMPOS_POST_MCP = (criando: boolean) => ({
  titulo: criando ? z.string().min(1).max(160) : z.string().min(1).max(160).optional(),
  conteudo: (criando ? z.string().min(1).max(200000) : z.string().max(200000).optional()).describe('Markdown do artigo, sem "# " (o título é o H1)'),
  subtitulo: z.string().max(200).optional(),
  slug: z.string().max(90).optional(),
  palavraChave: z.string().max(80).optional(),
  palavrasSecundarias: z.array(z.string().max(80)).max(15).optional(),
  tema: z.string().max(300).optional(),
  publico: z.string().max(200).optional().describe('Para quem é o artigo'),
  descricao: z.string().max(300).optional().describe('Meta description / resumo (120 a 160 caracteres)'),
  seoTitulo: z.string().max(80).optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
  entidades: z.array(z.string().max(80)).max(20).optional(),
  breadcrumb: z.string().max(60).optional(),
  canonical: z.string().url().optional(),
  indexar: z.boolean().optional(),
  ogTitulo: z.string().max(100).optional(),
  ogDescricao: z.string().max(300).optional(),
  capaAlt: z.string().max(200).optional(),
  capaLegenda: z.string().max(200).optional(),
  capaCredito: z.string().max(120).optional(),
  ctaLabel: z.string().max(80).optional(),
  ctaUrl: z.string().max(300).optional().describe('/maquinadevendas ou https://…'),
  ctaContexto: z.string().max(300).optional(),
  cta2Label: z.string().max(80).optional(),
  cta2Url: z.string().max(300).optional(),
  ctaPosicao: z.enum(['meio', 'final', 'ambos']).optional(),
  relacionadosIds: z.array(z.string().uuid()).max(4).optional(),
  aviso: z.string().max(300).optional().describe('Aviso editorial (uso de IA, parceria)'),
  notaAtualizacao: z.string().max(300).optional(),
  revisarEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  categoriaId: id('Categoria (de contexto_blog)').optional(),
  autorId: id('Autor (de contexto_blog)').optional(),
  guiaCompleto: z.boolean().optional(),
  briefing: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional().describe('Campos do briefing (chaves de contexto_blog.camposDoBriefing)'),
})
type EntradaPostMcp = { [K in keyof ReturnType<typeof CAMPOS_POST_MCP>]?: unknown } & Record<string, unknown>

/** Junta o que veio do MCP com o artigo atual (na atualização, o que não veio continua igual). */
function camposDoMcp(a: EntradaPostMcp, atual: import('@/servicos/blog').PostEquipe | null): import('@/servicos/blog').CamposPost {
  const v = <T,>(k: string, padrao: T): T => (a[k] === undefined ? padrao : (a[k] as T))
  return {
    titulo: v('titulo', atual?.titulo ?? ''), slug: v('slug', atual?.slug ?? ''), seoTitulo: v('seoTitulo', atual?.seoTitulo ?? ''), resumo: v('descricao', atual?.resumo ?? ''),
    palavraChave: v('palavraChave', atual?.palavraChave ?? ''), publico: v('publico', atual?.publico ?? ''), tema: v('tema', atual?.tema ?? ''), palavrasSecundarias: v('palavrasSecundarias', atual?.palavrasSecundarias ?? []),
    conteudo: v('conteudo', atual?.conteudo ?? ''), capaChave: atual?.capaChave ?? null, capaAlt: v('capaAlt', atual?.capaAlt === atual?.titulo ? '' : (atual?.capaAlt ?? '')),
    categoriaId: v('categoriaId', atual?.categoriaId ?? null), autorId: v('autorId', atual?.autorId ?? null), pilar: v('guiaCompleto', atual?.pilar ?? false),
    subtitulo: v('subtitulo', atual?.subtitulo ?? ''), tags: v('tags', atual?.tags ?? []), breadcrumb: v('breadcrumb', atual?.breadcrumb ?? ''), canonical: v('canonical', atual?.canonical ?? ''),
    indexar: v('indexar', atual?.indexar ?? true), ogTitulo: v('ogTitulo', atual?.ogTitulo ?? ''), ogDescricao: v('ogDescricao', atual?.ogDescricao ?? ''),
    capaLegenda: v('capaLegenda', atual?.capaLegenda ?? ''), capaCredito: v('capaCredito', atual?.capaCredito ?? ''),
    cta: { label: v('ctaLabel', atual?.cta.label ?? ''), url: v('ctaUrl', atual?.cta.url ?? ''), contexto: v('ctaContexto', atual?.cta.contexto ?? ''), label2: v('cta2Label', atual?.cta.label2 ?? ''), url2: v('cta2Url', atual?.cta.url2 ?? ''), posicao: v('ctaPosicao', atual?.cta.posicao ?? 'ambos') },
    relacionadosIds: v('relacionadosIds', atual?.relacionadosIds ?? []), entidades: v('entidades', atual?.entidades ?? []),
    briefing: { ...(atual?.briefing ?? {}), ...((a.briefing as Record<string, string | string[]>) ?? {}) }, aviso: v('aviso', atual?.aviso ?? ''), notaAtualizacao: v('notaAtualizacao', atual?.notaAtualizacao ?? ''),
    revisarEm: v('revisarEm', atual?.revisarEm ?? null),
  }
}

/** Commit em produção (Vercel); 'local' fora dela. */
export const VERSAO = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'

export const FERRAMENTAS: Ferramenta[] = [
  definir({
    nome: 'descrever_plataforma',
    descricao: 'COMECE POR AQUI. Explica como a plataforma da Grupo SRV é organizada, as regras, os tipos de campo e as ferramentas disponíveis.',
    escrita: false,
    entrada: {},
    executar: async (ctx) => ({
      voce: { nome: ctx.nome, papel: ctx.papel, permissao: ctx.escopo === 'write' ? 'leitura e escrita' : 'somente leitura' },
      versao: { servidor: VERSAO, aviso: 'Se um parâmetro citado aqui não aparecer no schema das ferramentas, o app está com a lista antiga em cache: reconecte o conector e abra uma conversa nova.' },
      hierarquia: 'Espaço › (Subárea) › Pasta › Lista › Tarefa › Subtarefa. Pastas e listas também podem ficar soltas na raiz. A lista não precisa de cliente; o cliente é uma tag opcional de cada tarefa (a lista pode ter um cliente padrão).',
      regras: [
        'Você age com as permissões da pessoa dona do token: o banco recusa o que ela não pode fazer (por exemplo, só gestor do espaço cria pasta, lista e campo).',
        'Toda tarefa precisa de pelo menos um responsável (se você não informar, usa a pessoa dona do token).',
        'Subtarefa é uma tarefa com paiId. Ela herda a lista e o cliente da tarefa mãe.',
        'Status são por lista, em 3 categorias: todo (a fazer), in_progress (em andamento), done (concluído). Uma lista nova já vem com status padrão.',
        'Campos personalizados pertencem a um espaço e são ligados a listas; o valor de cada tarefa vai em definir_valor_campo (ou em valoresCampos ao criar em lote).',
        'Descrições e comentários são texto simples; use quebras de linha para parágrafos.',
        'Financeiro (só o admin): lançamentos de entrada e despesa (equipe, tráfego pago, ferramentas…) com valor em reais, data, categoria, cliente opcional e situação paga/pendente. Use listar_lancamentos e resumir_financeiro; criar_lancamento grava um lançamento (repetirMeses repete todo mês). Não há exclusão por aqui.',
        'Funis: desenhos de funil (tráfego → página → lead → venda) com taxa de conversão em cada ligação. calcular_funil devolve visitantes por etapa, leads, vendas, receita, custo por lead/venda e ROAS. Quadros brancos são desenhados só na tela (listar_quadros mostra os nomes).',
        'Agenda: cada pessoa vê os próprios compromissos, os da equipe toda e os em que foi selecionada. visibilidade: privado (só quem criou), equipe (todos) ou selecionados (quem criou + pessoas, ids de listar_equipe); só admin e gestor criam para outras pessoas. Compromisso fixo = repetir diario/semanal/mensal (repetirAte opcional). Horários no fuso de Belém (HH:MM). Compromisso pode ter uma categoria (listar_categorias_agenda / criar_categoria_agenda; a cor dela pinta o compromisso), um cliente (clienteId) e tags da equipe (listar_tags_agenda / criar_tag_agenda). Quem conectou o Google Agenda recebe os compromissos lá automaticamente. Não há exclusão por aqui.',
        'Projetos: uma lista (solta) marcada como "de projetos"; cada tarefa principal dela é um projeto (normalmente um cliente) e as subtarefas são as entregas. relatorio_projetos traz o foco (tempo lançado nas tarefas pelo cronômetro ou à mão), o andamento de cada projeto e o listaId da lista. Para criar um projeto, crie uma tarefa nessa lista (criar_tarefa ou criar_tarefas_em_lote com as entregas como subtarefas).',
        'Conteúdo (posts): nas listas de conteúdo (ex.: Máquina de Conteúdo), a tarefa-mãe é o tema/campanha e TODA subtarefa é um post (criar uma subtarefa já cria o post em rascunho, formato feed). Cada post tem versões, mídias e aprovação do cliente pelo portal. agendar_post agenda no Instagram/Facebook (com aprovação do cliente ou direto) e situacao_publicacao_post mostra como está; a plataforma publica sozinha no horário. Collab: até 3 @ do Instagram convidados como coautores (feed, Reels e carrossel; Stories não); o convidado aceita no app. Destino google = Google Meu Negócio do cliente (post Novidade com o texto, até 1.500 caracteres, e a primeira foto; vídeo e Stories não vão).',
        'Anúncios e Google: a aba Anúncios junta o investimento de todos os clientes (Meta e Google Ads). Por cliente: anuncios_meta_cliente (Meta, pela conta act_ do cadastro), campanhas_google_ads_cliente (Google Ads, pela conta de 10 dígitos do cadastro, via MCC da agência) e metricas_google_meu_negocio (perfil do Meu Negócio ligado na página do cliente). O Google usa UMA conta Google da agência, conectada pelo admin na aba Anúncios. A aba Anúncios tem o panorama de todos os clientes e um seletor para ver um cliente só, com insights e recomendações.',
        'Blog (www.gruposrv.com.br/blog): blog público da agência para atrair clientes pelo Google, em 4 categorias (tráfego pago, redes sociais e conteúdo, vendas e marketing, Google e presença local), cada uma com um guia completo (pilar). Todo artigo leva para a landing /maquinadevendas. A equipe escreve na aba Blog (com checklist de SEO e rascunho pela IA). Fluxo do modelo mestre: contexto_blog (marca, categorias, autores, briefing, artigos) → criar_post_blog (sempre rascunho, com briefing, SEO, CTA, social e capa) → validar_post_blog (checklist e, no ar, validação técnica) → publicar_post_blog com revisao=true. A revisão humana é aprovada por uma pessoa na plataforma; só depois dá para publicar ou agendar. Não há exclusão por aqui.',
        'Performance (aba Performance): por cliente e mês, investimento e leads pagos (Meta: formulários e conversas no WhatsApp/Direct; Google Ads: conversões), orgânico do Instagram (cliques nos links do perfil e no link da bio da plataforma, www.gruposrv.com.br/l/<cliente>, que abre o WhatsApp do cliente com uma mensagem pronta), leads da bio confirmados pela equipe e o faturamento e as vendas lançados pela equipe; calcula CPL, ROAS, custo por venda, ticket médio e conversão. Use performance_cliente, registrar_resultado_mes e confirmar_lead_bio. Não há exclusão por aqui.',
        'Estratégia de tráfego da agência: há dois papéis de campanha. LEAD (conversas no WhatsApp/Direct, formulário): o resultado é a conversa/lead e se avalia pelo custo por resultado. MARCA (campanhas de tráfego/conteúdo para o Instagram, ex.: "CONTEÚDO / TRAF-INSTA", seguidores, reconhecimento): levam pessoas ao perfil, que viram lead depois; o objetivo primário NÃO é lead, então se avaliam pelo custo por clique no link, CTR no link e crescimento de seguidores — nunca as reprove nem as compare com as de lead por não gerarem conversas. anuncios_meta_cliente já traz o papel de cada anúncio e as referências de cada papel.',
        'Controle de anúncios: estrutura_anuncios_cliente mostra campanhas › conjuntos › anúncios (Meta) e campanhas (Google Ads) com ids, status, orçamento, gasto e leads, mais os pedidos pendentes e o histórico. pausar_anuncio pausa na hora (só admin e gestor). Ativar e mudar orçamento NUNCA são diretos: propor_alteracao_anuncio cria um pedido que admin ou gestor aprova na aba Anúncios (avisa no sino). Para criar na Meta: o criativo precisa estar na biblioteca do cliente (a equipe sobe na aba Anúncios → Criativos; veja listar_criativos_cliente); monte o público com buscar_locais_meta e buscar_interesses_meta; para formulário de cadastro use listar_formularios_meta; então criar_campanha_meta (campanha + conjunto + anúncios) ou adicionar_anuncio_meta (criativo novo num conjunto existente). Tudo nasce PAUSADO; para ir ao ar, proponha ativar. No Google Ads: buscar_locais_google e ideias_palavras_google (volume de buscas e lance) ajudam a montar criar_campanha_google_pesquisa (orçamento, locais, palavras com correspondência, negativas e anúncio responsivo com 3 a 15 títulos de até 30 caracteres e 2 a 4 descrições de até 90), que nasce PAUSADA. Sempre confirme com a pessoa o cliente, o objetivo, o orçamento, o público e os textos antes de criar. Não há exclusão por aqui.',
        'Arquivos (ciclo de renovação): todo dia a plataforma apaga os arquivos vencidos e marca o registro como arquivado: mídias de post publicado 90 dias depois da publicação (não publicado: 180 dias sem versão nova), anexos de tarefas e do chat em 12 meses, criativos já enviados à Meta em 90 dias e gravações de reunião logo depois da ata. Blog e capas de cliente nunca saem. Mídia arquivada não pode ser publicada nem usada em anúncio: peça para subir de novo.',
        'Posts e métricas: a aba Posts mostra os posts em lista, Kanban e calendário, com as métricas do Instagram de cada publicado (atualizadas a cada 5 minutos). posts_publicados lista os publicados com métricas e nota; insight_post traz as métricas, a comparação com a mediana do perfil (nota bom, mediano ou ruim) e a última análise; analisar_post faz a IA assistir o vídeo/imagem e explicar o que deu certo, o que não deu e o que replicar.',
        'Comentários das redes: na aba Insights, os comentários do Instagram e do Facebook dos clientes (posts e anúncios) chegam a cada 15 minutos, classificados pelo tom; negativos e agressivos geram aviso no sino para admin e gestor. Use listar_comentarios_redes, responder_comentario_rede e ocultar_comentario_rede (não há exclusão por aqui).',
        'Insights (orgânico): a aba Insights mostra o Instagram de todos os clientes (panorama) ou de um cliente (posts, melhor formato, alcance por dia, recomendações); TikTok, YouTube, Facebook e LinkedIn estão como em breve e o Google Meu Negócio aguarda a liberação do Google. Use insights_instagram_cliente. A página do cliente tem o relatório em três partes (pago, orgânico e os dois juntos), o mesmo de relatorio_cliente_pago_e_organico.',
        'Time: quem da equipe está ativo agora (site aberto e mexendo nos últimos 5 min), ocioso ou offline, há quanto tempo, e o status que cada um escolheu (disponível, reunião, intervalo, foco, gravando, externo, ausente; com prazo volta sozinho a disponível). ver_time mostra o quadro; definir_meu_status muda o status da pessoa dona do token; relatorio_time traz os minutos ativos por pessoa e dia (de todos só para admin e gestor; os demais veem só os próprios).',
        'Chat da equipe: canais (#geral e os que a equipe criar; privados só para membros), mensagens com respostas em tópico, @menções que avisam no sino. Use listar_canais_chat, ler_canal_chat e enviar_mensagem_chat. Não há exclusão por aqui.',
        'Reuniões (notetaker): a equipe grava a reunião na plataforma e a IA cria um documento "Ata — <assunto> — dd/mm" com as páginas Ata (resumo, participantes, tópicos, decisões, próximos passos) e Transcrição. Para ler, use listar_documentos / buscar_documento.',
        'Documentos: textos da equipe com páginas aninhadas, que podem ser vinculados a listas (visualização Documentos) e a um cliente. Escreva com criar_documento / atualizar_pagina_documento (só acrescenta texto). Nada é apagado por aqui: para tirar uma tarefa do caminho use arquivar_tarefa. A tag de cliente é da TAREFA (não só da lista): defina com clienteId ao criar ou com atualizar_tarefa, que troca a tag da tarefa-mãe e das subtarefas.',
      ],
      prioridades: PRIORIDADES,
      categoriasDeStatus: STATUS_CATEGORIAS,
      tiposDeCampo: CATALOGO_CAMPOS.map((c) => ({ tipo: c.tipo, nome: c.nome, descricao: c.descricao })),
      comoTrabalhar: 'listar_arvore → achar ou criar a lista (criar_lista) → criar_campo se precisar → criar_tarefas_em_lote (várias tarefas com subtarefas de uma vez).',
      ferramentas: FERRAMENTAS.map((f) => ({ nome: f.nome, escrita: f.escrita, descricao: f.descricao })),
    }),
  }),

  definir({
    nome: 'listar_arvore',
    descricao: 'Mostra espaços, pastas e listas visíveis para você, com ids. Use os ids nas outras ferramentas.',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => {
      const nav = await listarArvore(sb)
      return { espacos: nav.espacos.map(resumoEspaco), pastasSoltas: nav.pastasRaiz.map(resumoPasta), listasSoltas: nav.listasRaiz.map(resumoLista) }
    },
  }),

  definir({
    nome: 'listar_clientes',
    descricao: 'Clientes cadastrados (usados como tag opcional nas tarefas).',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => (await listarClientes(sb)).map((c) => ({ id: c.id, nome: c.nome, status: c.status, bibliotecaAnuncios: c.metaPaginaId ? urlBibliotecaAnuncios(c.metaPaginaId) : null })),
  }),

  definir({
    nome: 'definir_biblioteca_anuncios_cliente',
    descricao: 'Liga o cliente ao Meta. pagina: link da Biblioteca de Anúncios (com view_all_page_id=) ou ID da página do Facebook (link público dos anúncios). contaAnuncios: conta de anúncios (act_123… ou link do Gerenciador) para a galeria com os resultados. Informe só o que muda; vazio tira o vínculo. Só admin e gestor.',
    escrita: true,
    entrada: {
      clienteId: id('Cliente (id de listar_clientes)'),
      pagina: z.string().max(500).optional().describe('Link da Biblioteca de Anúncios ou ID da página; vazio tira'),
      contaAnuncios: z.string().max(500).optional().describe('Conta de anúncios act_123… ou link do Gerenciador; vazio tira'),
    },
    executar: async ({ sb }, a) => {
      const campos: { meta_page_id?: string | null; meta_ad_account_id?: string | null } = {}
      if (a.pagina !== undefined) {
        const p = lerPaginaMeta(a.pagina)
        if ('erro' in p) throw new Error(p.erro)
        campos.meta_page_id = p.id
      }
      if (a.contaAnuncios !== undefined) {
        const c = lerContaAnuncios(a.contaAnuncios)
        if ('erro' in c) throw new Error(c.erro)
        campos.meta_ad_account_id = c.id
      }
      if (!Object.keys(campos).length) throw new Error('Informe pagina e/ou contaAnuncios.')
      await definirPaginaMeta(sb, a.clienteId, campos)
      return { ok: true, bibliotecaAnuncios: campos.meta_page_id ? urlBibliotecaAnuncios(campos.meta_page_id) : undefined }
    },
  }),

  definir({
    nome: 'anuncios_meta_cliente',
    descricao: 'Anúncios ATIVOS do cliente no Meta (Facebook/Instagram) com os resultados de 7 ou 30 dias: campanha e conjunto de cada um, impressões, alcance, cliques, cliques no link, CTR, CPM, CPC, gasto, frequência, resultados (formulários + conversas no WhatsApp/Direct) e custo por resultado, o papel do anúncio (Geração de leads ou Marca, pelo objetivo da campanha), diagnóstico da Meta quando houver e a avaliação da plataforma (bom / médio / fraco / poucos dados): lead pelo custo por resultado; marca (tráfego/conteúdo para o Instagram) pelo custo por clique e CTR no link, comparando só anúncios do mesmo papel. O cliente precisa ter a conta de anúncios cadastrada.',
    escrita: false,
    entrada: { clienteId: id('Cliente (id de listar_clientes)'), dias: z.union([z.literal(7), z.literal(30)]).optional().describe('Últimos 7 ou 30 dias até ontem; padrão 7'), de: data('Início de um período escolhido (com ate; substitui dias)').optional(), ate: data('Fim do período escolhido').optional() },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      if (!cliente.metaContaId) throw new Error('Este cliente não tem conta de anúncios do Meta cadastrada.')
      const r = await (await import('@/servicos/meta-anuncios')).anunciosAtivos(cliente.metaContaId, periodoDaIA(a))
      if ('erro' in r) throw new Error(r.erro)
      // Sem a URL da imagem (longa e expira) e sem campos vazios: cabe inteiro na resposta.
      const anuncios = r.anuncios.map(({ imagem, texto, qualidade, engajamento, conversao, custoPorResultado, visualizacoesVideo, link, cliques, ...x }) => ({
        // ctr e cpc (como a Meta devolve) usam todos os cliques; ctrLink/cpcLink usam só os cliques no link.
        ...x, cliquesTodos: cliques, ...taxasDoAnuncio({ ...x, cliques }), papel: ROTULO_PAPEL[x.papel], temImagem: !!imagem, texto: texto.slice(0, 160), ...(custoPorResultado !== null ? { custoPorResultado: Math.round(custoPorResultado * 100) / 100 } : {}), ...(visualizacoesVideo ? { visualizacoesVideo } : {}), ...(link ? { link } : {}),
        ...(qualidade || engajamento || conversao ? { diagnosticoMeta: { qualidade, engajamento, conversao } } : {}),
      }))
      const ref = referencias(r.anuncios)
      const arred = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100)
      return {
        cliente: cliente.nome,
        periodo: periodoDaIA(a),
        totais: totaisAnuncios(r.anuncios),
        referencias: {
          comoCalcula: 'Média de cada papel = gasto ÷ resultados (lead) ou gasto ÷ cliques no link (marca), só com os anúncios de 500+ impressões no período; por isso pode diferir do total da conta.',
          lead: { ...ref.lead, custoPorResultado: arred(ref.lead.custoPorResultado), custoPorClique: arred(ref.lead.custoPorClique) },
          marca: { ...ref.marca, custoPorResultado: arred(ref.marca.custoPorResultado), custoPorClique: arred(ref.marca.custoPorClique) },
        },
        observacoes: ['cliquesTodos (todos os cliques) e cliquesLink (cliques no link) são contagens separadas da Meta e podem diferir ~1% para mais ou para menos; para tráfego use cliquesLink.', 'ctr e cpc (iguais a ctrTodos e cpcTodos) usam todos os cliques; a avaliação e as referências usam ctrLink e cpcLink.'],
        anuncios,
      }
    },
  }),

  definir({
    nome: 'campanhas_google_ads_cliente',
    descricao: 'Campanhas ATIVAS do cliente no Google Ads com os números de 7 ou 30 dias: investido, impressões, cliques, CTR, CPC, conversões e valor das conversões, mais os totais. O cliente precisa ter a conta do Google Ads no cadastro e a agência ter conectado o Google (aba Anúncios).',
    escrita: false,
    entrada: { clienteId: id('Cliente (id de listar_clientes)'), dias: z.union([z.literal(7), z.literal(30)]).optional().describe('Últimos 7 ou 30 dias até ontem; padrão 7'), de: data('Início de um período escolhido (com ate; substitui dias)').optional(), ate: data('Fim do período escolhido').optional() },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      if (!cliente.googleAdsId) throw new Error('Este cliente não tem conta do Google Ads cadastrada.')
      const r = await (await import('@/servicos/google-agencia')).campanhasGoogle(cliente.googleAdsId, periodoDaIA(a))
      if ('erro' in r) throw new Error(r.erro)
      return { cliente: cliente.nome, periodo: periodoDaIA(a), moeda: r.moeda, totais: totaisCampanhas(r.campanhas), campanhas: r.campanhas }
    },
  }),

  definir({
    nome: 'metricas_google_meu_negocio',
    descricao: 'Métricas do perfil do Google Meu Negócio do cliente nos últimos 7 ou 30 dias (até ontem): visualizações (na busca e no Maps), ligações, cliques no site, pedidos de rota, conversas e o detalhe por dia. O cliente precisa ter o perfil ligado na página dele.',
    escrita: false,
    entrada: { clienteId: id('Cliente (id de listar_clientes)'), dias: z.union([z.literal(7), z.literal(30)]).optional().describe('Últimos 7 ou 30 dias até ontem; padrão 7'), de: data('Início de um período escolhido (com ate; substitui dias)').optional(), ate: data('Fim do período escolhido').optional() },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      if (!cliente.googlePerfil) throw new Error('Este cliente não tem o perfil do Google Meu Negócio ligado.')
      const p = periodoDaIA(a)
      const r = await (await import('@/servicos/google-agencia')).metricasDoNegocio(cliente.googlePerfil, p.de, p.ate)
      if ('erro' in r) throw new Error(r.erro)
      return { cliente: cliente.nome, perfil: cliente.googlePerfilNome, periodo: p, ...r }
    },
  }),

  definir({
    nome: 'insights_instagram_cliente',
    descricao: 'Insights do Instagram do cliente no período: seguidores, alcance, visualizações, interações, engajamento, saldo de seguidores, alcance por dia, desempenho por formato, os posts com os números de cada um, e insights e recomendações para o orgânico. O cliente precisa ter a Página do Facebook (com o Instagram profissional ligado) no cadastro.',
    escrita: false,
    entrada: { clienteId: id('Cliente (id de listar_clientes)'), dias: z.union([z.literal(7), z.literal(30)]).optional().describe('Últimos 7 ou 30 dias até ontem; padrão 7'), de: data('Início de um período escolhido (com ate; substitui dias)').optional(), ate: data('Fim do período escolhido').optional() },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      if (!cliente.metaPaginaId) throw new Error('Este cliente não tem a Página do Facebook no cadastro.')
      const p = periodoDaIA(a)
      const ig = await (await import('@/servicos/insights-instagram')).instagramDoCliente(cliente.metaPaginaId, p, true)
      if ('erro' in ig) throw new Error(ig.erro)
      const dias = (Date.parse(p.ate) - Date.parse(p.de)) / 86_400_000 + 1
      const avisos = [
        'alcance, visualizações e interações da CONTA somam orgânico e anúncios (o Instagram não separa); o engajamento orgânico é o engajamentoPosts.',
        ...(ig.posts.length ? [] : ['Nenhum post de feed/Reels no período (Stories não entram nesta conta).']),
        ...(ig.alcancePorDia.length < dias ? ['O Instagram leva até 48 horas para fechar o dia: os últimos dias podem faltar em alcancePorDia.'] : []),
        ...(ig.cliquesPerfil === 0 ? ['cliquesPerfil = toques nos botões e links do perfil; 0 pode ser real ou a Meta não ter entregue a métrica.'] : []),
      ]
      return { cliente: cliente.nome, periodo: p, ...ig, posts: ig.posts.map((x) => ({ id: x.id, formato: x.formato, em: x.em, link: x.link, legenda: x.legenda.slice(0, 200), alcance: x.alcance, visualizacoes: x.visualizacoes, interacoes: x.interacoes, curtidas: x.curtidas, comentarios: x.comentarios, salvamentos: x.salvamentos, compartilhamentos: x.compartilhamentos })), engajamentoPosts: engajamentoOrganico(ig), porFormato: porFormato(ig.posts), analise: analisarOrganico(ig, dias), avisos }
    },
  }),

  definir({
    nome: 'relatorio_cliente_pago_e_organico',
    descricao: 'Relatório do cliente em três partes, com insights e recomendações: tráfego pago (Meta + Google Ads), orgânico (Instagram) e os dois juntos (investimento e alcance por dia, alcance nos dias com e sem anúncio, custo por seguidor). Mesmo relatório da página do cliente.',
    escrita: false,
    entrada: { clienteId: id('Cliente (id de listar_clientes)'), dias: z.union([z.literal(7), z.literal(30)]).optional().describe('Últimos 7 ou 30 dias até ontem; padrão 7'), de: data('Início de um período escolhido (com ate; substitui dias)').optional(), ate: data('Fim do período escolhido').optional() },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      const p = periodoDaIA(a)
      const google = await (await import('@/servicos/google-agencia')).situacaoGoogle()
      const d = await (await import('@/servicos/relatorio-cliente')).dadosDoCliente(cliente, p, google.conectado)
      const dias = (Date.parse(p.ate) - Date.parse(p.de)) / 86_400_000 + 1
      return {
        cliente: cliente.nome,
        periodo: p,
        avisos: d.erros,
        pago: { ...d.pago, analise: analisarPago(d.pago) },
        organico: d.ig ? { usuario: d.ig.usuario, seguidores: d.ig.seguidores, alcance: d.ig.alcance, interacoes: d.ig.interacoes, posts: d.ig.posts.length, analise: analisarOrganico(d.ig, dias) } : null,
        combinado: { pagoPorDia: d.pagoPorDia, alcanceInstagramPorDia: d.ig?.alcancePorDia ?? [], analise: analisarCombinado(d.ig, d.pagoPorDia, d.pago) },
      }
    },
  }),

  definir({
    nome: 'contexto_blog',
    descricao: 'Contexto para escrever no blog do Grupo SRV: contexto da marca (oferta, promessa, mecanismo, tom, o que nunca prometer), categorias (pilares), autores, os campos do briefing aceitos e os artigos existentes (para links internos e para não repetir palavra-chave). COMECE POR AQUI antes de criar um artigo.',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => {
      const b = await import('@/servicos/blog')
      const { CAMPOS_BRIEFING } = await import('@/dominio/blog')
      const [marca, cats, auts, posts, chaves] = await Promise.all([b.contextoMarca(), b.categorias(), b.autores(sb), b.postsDaEquipe(sb), b.palavrasChaveDosPosts(sb)])
      const chave = new Map(chaves.map((c) => [c.id, c.palavraChave]))
      return {
        marca,
        categorias: cats.map((c) => ({ id: c.id, nome: c.nome, slug: c.slug, descricao: c.descricao })),
        autores: auts.map((a) => ({ id: a.id, nome: a.nome, cargo: a.cargo })),
        camposDoBriefing: CAMPOS_BRIEFING.map((c) => ({ chave: c.chave, rotulo: c.rotulo, tipo: c.tipo, opcoes: c.opcoes })),
        artigos: posts.map((p) => ({ id: p.id, titulo: p.titulo, url: `/blog/${p.slug}`, palavraChave: chave.get(p.id) ?? '', status: p.status })),
        regras: ['Artigo novo entra sempre como rascunho; a revisão humana é aprovada por uma pessoa na plataforma.', 'Não use "# " no conteúdo (o título é o H1). Comece pela resposta direta de 40 a 80 palavras. Termine com "## Perguntas frequentes" e perguntas em "### ".', 'Nunca invente cases, números, garantias ou depoimentos; nada de marcadores como [inserir link].'],
      }
    },
  }),

  definir({
    nome: 'listar_posts_blog',
    descricao: 'Artigos do blog (www.gruposrv.com.br/blog): título, endereço, categoria, palavra-chave, situação (rascunho, em revisão, agendado, publicado), revisão humana, data, visitas e cliques no CTA dos últimos 90 dias.',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => {
      const b = await import('@/servicos/blog')
      const desde = somarDias(dataDeHoje(new Date()), -90)
      const [posts, numeros] = await Promise.all([b.postsDaEquipe(sb), b.desempenho(sb, desde)])
      const agora = Date.now()
      return posts.map((p) => ({
        id: p.id, titulo: p.titulo, url: `https://www.gruposrv.com.br/blog/${p.slug}`, categoria: p.categoria?.nome, palavraChave: p.palavraChave,
        situacao: p.status === 'publicado' && p.publicadoEmBruto && Date.parse(p.publicadoEmBruto) > agora ? 'agendado' : p.status, revisado: p.revisado, revisarEm: p.revisarEm,
        publicadoEm: p.publicadoEmBruto, visitas: p.visitas, desempenho90dias: numeros.get(p.id) ?? null, guiaCompleto: p.pilar,
      }))
    },
  }),

  definir({
    nome: 'criar_post_blog',
    descricao: 'Cadastra um artigo do blog como RASCUNHO, com todos os campos do modelo mestre: texto (Markdown, sem "# "), SEO, briefing, CTA, social, capa (textos) e relacionados. Depois use validar_post_blog e enviar o artigo para revisão (publicar_post_blog com revisao=true). Quem aprova a revisão é uma pessoa.',
    escrita: true,
    entrada: CAMPOS_POST_MCP(true),
    executar: async ({ sb }, a) => {
      const b = await import('@/servicos/blog')
      const novo = await b.salvarPost(sb, null, camposDoMcp(a as EntradaPostMcp, null))
      return { id: novo, situacao: 'rascunho', editar: `/editor-blog/${novo}` }
    },
  }),

  definir({
    nome: 'atualizar_post_blog',
    descricao: 'Atualiza campos de um artigo do blog (só os informados mudam). Mesmos campos de criar_post_blog. Não publica.',
    escrita: true,
    entrada: { postId: id('Artigo (de listar_posts_blog)'), ...CAMPOS_POST_MCP(false) },
    executar: async ({ sb }, a) => {
      const b = await import('@/servicos/blog')
      const atual = await b.postDaEquipe(sb, a.postId)
      if (!atual) throw new Error('Artigo não encontrado.')
      await b.salvarPost(sb, a.postId, camposDoMcp(a as EntradaPostMcp, atual))
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/blog', 'layout')
      return { ok: true, editar: `/editor-blog/${a.postId}` }
    },
  }),

  definir({
    nome: 'validar_post_blog',
    descricao: 'Checklist de qualidade do artigo (SEO, conteúdo, conversão, publicação: nota de 0 a 100 e o que bloqueia a publicação) e, se já estiver no ar, a validação técnica da página publicada (status 200, robots, canonical, H1, JSON-LD, og:image, sitemap, links internos), cada item como aprovado ou corrigir.',
    escrita: false,
    entrada: { postId: id('Artigo (de listar_posts_blog)') },
    executar: async ({ sb }, a) => {
      const b = await import('@/servicos/blog')
      const { bloqueiosDePublicacao, SITE } = await import('@/dominio/blog')
      const p = await b.postDaEquipe(sb, a.postId)
      if (!p) throw new Error('Artigo não encontrado.')
      const q = await b.qualidadeDoPost(sb, p)
      const noAr = p.status === 'publicado' && !!p.publicadoEmBruto && Date.parse(p.publicadoEmBruto) <= Date.now()
      const tecnica = noAr ? await (await import('@/servicos/blog-validacao')).validarPublicado(p.slug, p.canonical || `${SITE}/blog/${p.slug}`, p.indexar) : null
      return {
        nota: q.nota, bloqueiosParaPublicar: bloqueiosDePublicacao(q),
        checklist: q.itens.map((i) => ({ grupo: i.grupo, item: i.texto, situacao: i.ok ? 'aprovado' : 'corrigir', bloqueia: !!i.bloqueia })),
        validacaoTecnica: tecnica ?? 'não aplicável (o artigo ainda não está no ar)',
        revisaoHumana: p.revisadoEm ? { aprovadoPor: p.revisadoPor, em: p.revisadoEm } : 'pendente',
      }
    },
  }),

  definir({
    nome: 'publicar_post_blog',
    descricao: 'Envia o artigo para revisão (revisao=true), publica agora, agenda (quando = data e hora futuras, ISO) ou tira do ar (voltarParaRascunho). Publicar e agendar só funcionam depois da revisão humana aprovada na plataforma e sem bloqueios do checklist.',
    escrita: true,
    entrada: { postId: id('Artigo (de listar_posts_blog)'), revisao: z.boolean().optional().describe('Só enviar para revisão'), quando: z.string().datetime({ offset: true }).optional().describe('ISO 8601; vazio = agora'), voltarParaRascunho: z.boolean().optional() },
    executar: async ({ sb }, a) => {
      const b = await import('@/servicos/blog')
      const { bloqueiosDePublicacao } = await import('@/dominio/blog')
      const post = await b.postDaEquipe(sb, a.postId)
      if (!post) throw new Error('Artigo não encontrado.')
      if (a.voltarParaRascunho) await b.definirPublicacao(sb, a.postId, null)
      else if (a.revisao) await b.definirPublicacao(sb, a.postId, 'revisao')
      else {
        const bloqueios = bloqueiosDePublicacao(await b.qualidadeDoPost(sb, post))
        if (bloqueios.length) throw new Error(`Ainda não dá para publicar: ${bloqueios.join('; ')}.`)
        await b.definirPublicacao(sb, a.postId, a.quando ?? new Date().toISOString())
      }
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/blog', 'layout')
      return { ok: true, url: `https://www.gruposrv.com.br/blog/${post.slug}` }
    },
  }),

  definir({
    nome: 'listar_comentarios_redes',
    descricao: 'Comentários do Instagram e do Facebook dos clientes (posts orgânicos ou anúncios), já classificados pelo tom (positivo, neutro, negativo, agressivo), com as respostas. filtro: todos, sem_resposta, alerta (negativos e agressivos sem decisão), respondidos, ocultos. atualizar=true busca os novos na Meta antes.',
    escrita: false,
    entrada: {
      origem: z.enum(['organico', 'anuncio']).describe('Posts orgânicos ou anúncios'),
      clienteId: id('Cliente (de listar_clientes); vazio = todos').optional(),
      filtro: z.enum(['todos', 'sem_resposta', 'alerta', 'respondidos', 'ocultos']).optional(),
      atualizar: z.boolean().optional(),
    },
    executar: async ({ sb }, a) => {
      const c = await import('@/servicos/comentarios-redes')
      if (a.atualizar) await c.sincronizarComentarios(a.clienteId ? [a.clienteId] : undefined)
      const lista = await c.listarComentarios(sb, { origem: a.origem, clienteId: a.clienteId ?? null, filtro: a.filtro ?? 'todos' })
      if (!lista) throw new Error('Falta a migração dos comentários.')
      return lista.map((x) => ({ plataforma: x.plataforma, id: x.id, cliente: x.clienteNome, autor: x.autor, texto: x.texto, em: x.criadoEm, tom: x.tom, motivo: x.motivo, respondido: !!x.respondidoEm, oculto: x.oculto, resolvido: !!x.resolvidoEm, post: x.postTexto, anuncio: x.anuncioNome || undefined, link: x.postLink, respostas: x.respostas }))
    },
  }),

  definir({
    nome: 'responder_comentario_rede',
    descricao: 'Publica uma resposta a um comentário do Instagram ou do Facebook, como o perfil/Página do cliente (fica pública). Use o id e a plataforma de listar_comentarios_redes. Tom educado e profissional; nunca discuta nem exponha dados pessoais.',
    escrita: true,
    entrada: { plataforma: z.enum(['instagram', 'facebook']), comentarioId: z.string().regex(/^[0-9_]{1,120}$/), texto: z.string().min(1).max(2000) },
    executar: async ({ sb, userId }, a) => {
      await (await import('@/servicos/comentarios-redes')).responderComentario(sb, userId, a.plataforma, a.comentarioId, a.texto)
      return { ok: true }
    },
  }),

  definir({
    nome: 'ocultar_comentario_rede',
    descricao: 'Oculta (ou mostra de novo, com ocultar=false) um comentário do Instagram ou do Facebook do cliente. Ocultar não apaga: só quem escreveu e os amigos dele continuam vendo.',
    escrita: true,
    entrada: { plataforma: z.enum(['instagram', 'facebook']), comentarioId: z.string().regex(/^[0-9_]{1,120}$/), ocultar: z.boolean() },
    executar: async ({ sb }, a) => {
      await (await import('@/servicos/comentarios-redes')).ocultarComentario(sb, a.plataforma, a.comentarioId, a.ocultar)
      return { ok: true }
    },
  }),

  definir({
    nome: 'performance_cliente',
    descricao: 'Performance mês a mês do cliente (até 12 meses terminando em mes): investido na Meta e no Google, formulários, conversas, conversões do Google, cliques nos links do perfil do Instagram, cliques no link da bio, leads da bio confirmados, faturamento e vendas lançados, com CPL, ROAS, custo por venda, ticket médio e conversão de cada mês.',
    escrita: false,
    entrada: { clienteId: id('Cliente (id de listar_clientes)'), mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().describe('Último mês (AAAA-MM); padrão o mês atual'), meses: z.number().int().min(1).max(12).optional().describe('Quantos meses; padrão 6') },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      const d = await import('@/dominio/performance')
      const p = await import('@/servicos/performance')
      const hoje = dataDeHoje(new Date())
      const google = await (await import('@/servicos/google-agencia')).situacaoGoogle()
      const [h, bio] = await Promise.all([p.historicoDoCliente(sb, cliente, d.mesesAte(d.lerMes(a.mes, hoje), a.meses ?? 6), hoje, google.conectado), p.linkBioDoCliente(sb, cliente.id)])
      const semFaturamento = h.meses.filter((m) => m.faturamento === null && p.investido(m) > 0).map((m) => m.mes)
      const avisos = [
        ...h.erros,
        'formularios = todos os leads da Meta: leadsNaMeta (formulário instantâneo e leads em mensagens) + leadsSite (evento Lead do pixel do site).',
        'investidoMeta é o gasto da CONTA inteira na Meta (todas as campanhas, de qualquer objetivo) e investidoGoogle o da conta do Google Ads.',
        ...(h.meses.some((m) => m.mes === hoje.slice(0, 7)) ? [`${hoje.slice(0, 7)} está em andamento: o gasto de hoje é parcial, e a Meta e o Google recalculam os últimos dias (cliques inválidos, reprocessamento), então o valor pode subir ou cair alguns reais entre leituras. Mês fechado também pode receber ajuste da plataforma nas semanas seguintes.`] : []),
        ...(semFaturamento.length ? [`Faturamento e vendas não lançados em ${semFaturamento.join(', ')}: ROAS, custo por venda, ticket médio e conversão ficam nulos. Lance com registrar_resultado_mes (ou na aba Performance).`] : []),
        ...(!bio?.whatsapp ? ['O cliente não tem WhatsApp no cadastro: sem ele não dá para criar o link da bio.'] : !bio.slug ? ['O link da bio ainda não foi criado (aba Performance → cliente → Link da bio): cliquesLinkBio fica 0.'] : h.meses.every((m) => !m.cliquesLinkBio) ? [`Nenhum clique no link da bio (www.gruposrv.com.br/l/${bio.slug}) no período: confira se ele está na bio do Instagram.`] : []),
        ...(!cliente.metaPaginaId ? ['Sem a Página do Facebook no cadastro: cliquesPerfilInstagram fica nulo.'] : h.meses.every((m) => !m.cliquesPerfilInstagram) ? ['cliquesPerfilInstagram = toques nos botões e links do perfil; zerado pode ser real ou a Meta não ter entregue a métrica.'] : []),
      ]
      return {
        cliente: cliente.nome,
        avisos,
        meses: h.meses.map((m) => ({ ...m, investido: p.investido(m), leadsPagos: p.leadsPagos(m), ...d.indicadores({ investido: p.investido(m), leadsPagos: p.leadsPagos(m), leadsOrganicos: m.leadsConfirmados, faturamento: m.faturamento, vendas: m.vendas }) })),
      }
    },
  }),

  definir({
    nome: 'registrar_resultado_mes',
    descricao: 'Lança (ou corrige) o faturamento (R$) e o número de vendas do cliente num mês. null = não informado. Substitui o que havia no mês.',
    escrita: true,
    entrada: { clienteId: id('Cliente (id de listar_clientes)'), mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).describe('AAAA-MM'), faturamento: z.number().min(0).nullable(), vendas: z.number().int().min(0).nullable(), notas: z.string().max(500).optional() },
    executar: async ({ sb }, a) => {
      await (await import('@/servicos/performance')).salvarResultadoMes(sb, a.clienteId, a.mes, { faturamento: a.faturamento, vendas: a.vendas, notas: a.notas ?? '' })
      return { ok: true }
    },
  }),

  definir({
    nome: 'confirmar_lead_bio',
    descricao: 'Confirma um lead que chegou pelo link da bio do Instagram do cliente (conversa no WhatsApp com a mensagem da bio). dia padrão = hoje.',
    escrita: true,
    entrada: { clienteId: id('Cliente (id de listar_clientes)'), dia: data('Dia em que o lead chegou').optional(), observacao: z.string().max(200).optional() },
    executar: async ({ sb }, a) => {
      await (await import('@/servicos/performance')).confirmarLead(sb, a.clienteId, a.dia ?? dataDeHoje(new Date()), a.observacao ?? '')
      return { ok: true }
    },
  }),

  definir({
    nome: 'estrutura_anuncios_cliente',
    descricao: 'Campanhas da Meta (com os conjuntos e a quantidade de anúncios) e campanhas do Google Ads do cliente, com ids, status, orçamento (reais), gasto e leads do período; mais os pedidos aguardando aprovação e as últimas alterações. Padrão: só as ATIVAS. status=pausados ou todos inclui as pausadas; comGasto=true esconde as sem gasto no período. Para ver os anúncios de uma campanha (ids para adicionar_anuncio_meta, pausar_anuncio, propor_alteracao_anuncio), chame com campanhaId (TEXTO entre aspas). pagina = página de 60 campanhas. Campanha ou conjunto (com orçamento próprio) ligado e sem gasto no período vem com alerta.',
    escrita: false,
    entrada: {
      clienteId: id('Cliente (id de listar_clientes)'),
      status: z.enum(['ativos', 'pausados', 'todos']).default('ativos'),
      comGasto: z.boolean().default(false).describe('Só campanhas com gasto no período'),
      campanhaId: z.string().regex(/^\d{1,25}$/).optional().describe('Abre uma campanha da Meta com os conjuntos e os anúncios. SEMPRE como texto entre aspas (ids da Meta têm 18 dígitos e perdem precisão como número).'),
      pagina: z.number().int().min(1).max(20).default(1).describe('Página de 60 campanhas'),
      dias: z.union([z.literal(7), z.literal(30)]).optional().describe('Gasto dos últimos 7 ou 30 dias até ontem; padrão 7'),
      de: data('Início de um período escolhido (com ate)').optional(),
      ate: data('Fim do período escolhido').optional(),
    },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      const p = periodoDaIA(a)
      const ctl = await import('@/servicos/controle-anuncios')
      const g = await import('@/servicos/google-agencia')
      const { estruturaParaIA, googleParaIA } = await import('@/dominio/controle-anuncios')
      const google = await g.situacaoGoogle()
      const filtro = { status: a.status, comGasto: a.comGasto, campanhaId: a.campanhaId, pagina: a.pagina, periodo: p }
      const [meta, goog, pendentes, ultimas] = await Promise.all([
        cliente.metaContaId ? ctl.estruturaMeta(cliente.metaContaId, p).then((x) => estruturaParaIA(x, filtro)).catch((e: Error) => ({ erro: e.message })) : null,
        !a.campanhaId && cliente.googleAdsId && google.conectado
          ? g.estruturaGoogle(cliente.googleAdsId, p).then((x) => ('erro' in x ? x : googleParaIA(x, filtro)))
          : null,
        ctl.propostasPendentes(sb, cliente.id),
        a.campanhaId ? Promise.resolve([]) : ctl.historico(sb, cliente.id, 10),
      ])
      return { cliente: cliente.nome, periodo: p, meta, google: goog, pedidosPendentes: pendentes.map((x) => ({ id: x.id, plataforma: x.plataforma, nivel: x.nivel, objetoId: x.objetoId, nome: x.nome, acao: x.acao, valorAtual: x.valorAtual, valorNovo: x.valorNovo, motivo: x.motivo, em: x.em })), ultimasAlteracoes: ultimas.map((x) => ({ plataforma: x.plataforma, nome: x.nome, acao: x.acao, antes: x.antes, depois: x.depois, origem: x.origem, por: x.por, em: x.em })) }
    },
  }),

  definir({
    nome: 'listar_criativos_cliente',
    descricao: 'Criativos (imagens e vídeos) que a equipe subiu na biblioteca do cliente (aba Anúncios → Criativos), com id, nome e tipo. Use o id em criar_campanha_meta e adicionar_anuncio_meta.',
    escrita: false,
    entrada: { clienteId: id('Cliente (id de listar_clientes)') },
    executar: async ({ sb }, a) => (await import('@/servicos/controle-anuncios')).listarCriativos(sb, a.clienteId).then((l) => l.map((c) => ({ id: c.id, nome: c.nome, tipo: c.tipo, criadoEm: c.criadoEm }))),
  }),

  definir({
    nome: 'buscar_locais_meta',
    descricao: 'Procura cidades e estados do Brasil para o público dos anúncios da Meta. Devolve a chave (use em publico.locais) e o tipo (cidade ou estado).',
    escrita: false,
    entrada: { busca: z.string().min(2).max(80).describe('Ex.: Belém, Ananindeua, Pará') },
    executar: async (_ctx, a) => (await import('@/servicos/controle-anuncios')).buscarLocais(a.busca),
  }),

  definir({
    nome: 'buscar_interesses_meta',
    descricao: 'Procura interesses para segmentar o público dos anúncios da Meta (ex.: odontologia, imóveis, academia). Devolve id, nome e tamanho do público.',
    escrita: false,
    entrada: { busca: z.string().min(2).max(80) },
    executar: async (_ctx, a) => (await import('@/servicos/controle-anuncios')).buscarInteresses(a.busca),
  }),

  definir({
    nome: 'listar_formularios_meta',
    descricao: 'Formulários de cadastro (Lead Ads, formulário instantâneo) da Página do cliente, para campanhas de formulário. Lista vazia = a Página não tem formulário instantâneo (o token tem leads_retrieval). Os "formularios" de performance_cliente também contam o evento Lead do pixel do site (leadsSite), então podem existir sem formulário na Página.',
    escrita: false,
    entrada: { clienteId: id('Cliente (id de listar_clientes)') },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      return (await import('@/servicos/controle-anuncios')).formulariosDoCliente(cliente)
    },
  }),

  definir({
    nome: 'buscar_locais_google',
    descricao: 'Procura cidades, estados e regiões do Brasil para segmentar campanhas do Google Ads. Devolve o recurso (geoTargetConstants/…) para usar em locais.',
    escrita: false,
    entrada: { busca: z.string().min(2).max(80).describe('Ex.: Belém, Pará, Ananindeua') },
    executar: async (_ctx, a) => {
      const r = await (await import('@/servicos/google-agencia')).buscarLocaisGoogle(a.busca)
      if ('erro' in r) throw new Error(r.erro)
      return r
    },
  }),

  definir({
    nome: 'ideias_palavras_google',
    descricao: 'Ideias de palavras-chave do Planejador do Google Ads para o cliente: buscas por mês, concorrência e faixa de lance (R$) no topo da página. Parta de palavras e/ou do site do cliente.',
    escrita: false,
    entrada: {
      clienteId: id('Cliente (id de listar_clientes)'),
      palavras: z.array(z.string().min(2).max(80)).max(10).default([]),
      url: z.string().url().optional().describe('Site do cliente (opcional)'),
      locais: z.array(z.string().regex(/^geoTargetConstants\/\d+$/)).max(10).default([]).describe('De buscar_locais_google; vazio = Brasil'),
    },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente?.googleAdsId) throw new Error('Cliente sem conta do Google Ads no cadastro.')
      if (!a.palavras.length && !a.url) throw new Error('Informe palavras ou o site.')
      const r = await (await import('@/servicos/google-agencia')).ideiasDePalavras(cliente.googleAdsId, a)
      if ('erro' in r) throw new Error(r.erro)
      return r.slice(0, 50)
    },
  }),

  definir({
    nome: 'criar_campanha_google_pesquisa',
    descricao: 'Cria no Google Ads uma campanha de PESQUISA completa, PAUSADA: orçamento diário, estratégia (cliques = Maximizar cliques, para conta sem conversões; conversoes = Maximizar conversões), locais, idioma português, um grupo com as palavras-chave (ampla, frase ou exata), negativas e um anúncio responsivo (3 a 15 títulos de até 30 caracteres, 2 a 4 descrições de até 90, URL https). Tudo numa transação: se algo falhar, nada é criado. Para ir ao ar, propor_alteracao_anuncio (ativar, plataforma google, nível campanha). Só admin e gestor.',
    escrita: true,
    entrada: {
      clienteId: id('Cliente (id de listar_clientes)'),
      nome: z.string().min(3).max(120),
      orcamentoDiario: z.number().positive().max(50000).describe('Reais por dia'),
      estrategia: z.enum(['cliques', 'conversoes']),
      locais: z.array(z.string().regex(/^geoTargetConstants\/\d+$/)).max(25).default([]),
      palavras: z.array(z.object({ texto: z.string().min(1).max(80), correspondencia: z.enum(['ampla', 'frase', 'exata']) })).min(1).max(80),
      negativas: z.array(z.string().min(1).max(80)).max(200).optional(),
      titulos: z.array(z.string().min(1).max(30)).min(3).max(15),
      descricoes: z.array(z.string().min(1).max(90)).min(2).max(4),
      url: z.string().url(),
      caminho1: z.string().max(15).optional(),
      caminho2: z.string().max(15).optional(),
    },
    executar: async ({ sb, userId, papel }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      const r = await (await import('@/servicos/controle-anuncios')).criarCampanhaGoogle(sb, { id: userId, papel }, cliente, a)
      return { ...r, status: 'PAUSADA', proximoPasso: 'Revise e use propor_alteracao_anuncio (ativar, plataforma google, nível campanha) para ir ao ar.' }
    },
  }),

  definir({
    nome: 'pausar_anuncio',
    descricao: 'Pausa na hora uma campanha, conjunto ou anúncio da Meta, ou uma campanha do Google Ads (só admin e gestor). Fica no histórico. Ids de estrutura_anuncios_cliente.',
    escrita: true,
    entrada: { clienteId: id('Cliente (id de listar_clientes)'), plataforma: z.enum(['meta', 'google']), nivel: z.enum(['campanha', 'conjunto', 'anuncio']), objetoId: z.string().regex(/^\d{1,25}$/) },
    executar: async ({ sb, userId, papel }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      return { ok: true, resultado: await (await import('@/servicos/controle-anuncios')).executarAlteracao(sb, { id: userId, papel }, cliente, { plataforma: a.plataforma, nivel: a.nivel, objetoId: a.objetoId, acao: 'pausar' }, 'ia') }
    },
  }),

  definir({
    nome: 'propor_alteracao_anuncio',
    descricao: 'Pede para ATIVAR ou MUDAR O ORÇAMENTO (em reais; diário, ou total se o item usar orçamento total) de uma campanha, conjunto ou anúncio (Meta) ou campanha (Google Ads). Não executa: cria um pedido que admin ou gestor aprova na aba Anúncios. Explique o motivo com números.',
    escrita: true,
    entrada: {
      clienteId: id('Cliente (id de listar_clientes)'),
      plataforma: z.enum(['meta', 'google']),
      nivel: z.enum(['campanha', 'conjunto', 'anuncio']),
      objetoId: z.string().regex(/^\d{1,25}$/),
      acao: z.enum(['ativar', 'orcamento']),
      valor: z.number().positive().max(50000).optional().describe('Novo orçamento em reais (obrigatório para orcamento)'),
      motivo: z.string().min(5).max(500),
    },
    executar: async ({ sb }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      if (a.acao === 'orcamento' && !a.valor) throw new Error('Informe o valor do novo orçamento.')
      const id = await (await import('@/servicos/controle-anuncios')).proporAlteracao(sb, cliente, { plataforma: a.plataforma, nivel: a.nivel, objetoId: a.objetoId, acao: a.acao, valor: a.valor, motivo: a.motivo })
      return { ok: true, pedidoId: id, aviso: 'Pedido criado. Admin ou gestor aprova na aba Anúncios da plataforma.' }
    },
  }),

  definir({
    nome: 'criar_campanha_meta',
    descricao: 'Cria na Meta uma campanha completa, PAUSADA: campanha + conjunto (orçamento diário e público) + um anúncio por criativo. modo: whatsapp (conversas no WhatsApp ligado à Página), direct (conversas no Direct do Instagram), formulario (cadastro na Meta; precisa de formularioId) ou site (cliques para o link). Criativos: ids de listar_criativos_cliente. Público: locais de buscar_locais_meta (vazio = Brasil), interesses de buscar_interesses_meta. Para ir ao ar, use propor_alteracao_anuncio (ativar) na campanha e no conjunto. Só admin e gestor.',
    escrita: true,
    entrada: {
      clienteId: id('Cliente (id de listar_clientes)'),
      nome: z.string().min(3).max(120),
      modo: z.enum(['whatsapp', 'direct', 'formulario', 'site']),
      orcamentoDiario: z.number().positive().max(50000).describe('Reais por dia'),
      inicio: data('Início').optional(),
      fim: data('Fim (opcional)').optional(),
      publico: z.object({
        locais: z.array(z.object({ chave: z.string().max(40), tipo: z.enum(['cidade', 'estado']), raioKm: z.number().min(10).max(80).optional() })).max(25).optional(),
        idadeMin: z.number().int().min(18).max(65).optional(),
        idadeMax: z.number().int().min(18).max(65).optional(),
        generos: z.enum(['todos', 'homens', 'mulheres']).optional(),
        interesses: z.array(z.object({ id: z.string().max(40), nome: z.string().max(120) })).max(25).optional(),
        advantage: z.boolean().optional().describe('Público Advantage+ (a Meta amplia quando achar melhor)'),
      }),
      anuncios: z.array(z.object({
        criativoId: id('Criativo da biblioteca'),
        nome: z.string().max(80).optional(),
        texto: z.string().min(1).max(2200).describe('Texto principal'),
        titulo: z.string().max(80).optional(),
        descricao: z.string().max(120).optional(),
        botao: z.string().regex(/^[A-Z_]{3,40}$/).optional().describe('CTA da Meta para site/formulário, ex.: LEARN_MORE, SIGN_UP, GET_QUOTE, CONTACT_US'),
      })).min(1).max(6),
      link: z.string().url().optional().describe('Obrigatório no modo site'),
      formularioId: z.string().regex(/^\d{1,25}$/).optional().describe('Obrigatório no modo formulario'),
    },
    executar: async ({ sb, userId, papel }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      const r = await (await import('@/servicos/controle-anuncios')).criarCampanhaMeta(sb, { id: userId, papel }, cliente, a)
      return { ...r, status: 'PAUSADA', proximoPasso: 'Revise no Gerenciador de Anúncios se quiser e use propor_alteracao_anuncio (ativar) na campanha e no conjunto.' }
    },
  }),

  definir({
    nome: 'adicionar_anuncio_meta',
    descricao: 'Sobe um criativo da biblioteca como anúncio novo, PAUSADO, num conjunto que já existe (o destino segue o do conjunto: WhatsApp, Direct, formulário ou site). Para ir ao ar, proponha ativar o anúncio. Só admin e gestor.',
    escrita: true,
    entrada: {
      clienteId: id('Cliente (id de listar_clientes)'),
      conjuntoId: z.string().regex(/^\d{1,25}$/),
      criativoId: id('Criativo da biblioteca'),
      nome: z.string().max(80).optional(),
      texto: z.string().min(1).max(2200),
      titulo: z.string().max(80).optional(),
      descricao: z.string().max(120).optional(),
      botao: z.string().regex(/^[A-Z_]{3,40}$/).optional(),
      link: z.string().url().optional().describe('Para conjuntos de site'),
      formularioId: z.string().regex(/^\d{1,25}$/).optional().describe('Para conjuntos de formulário'),
    },
    executar: async ({ sb, userId, papel }, a) => {
      const cliente = (await listarClientes(sb)).find((c) => c.id === a.clienteId)
      if (!cliente) throw new Error('Cliente não encontrado.')
      const anuncio = { criativoId: a.criativoId, nome: a.nome, texto: a.texto, titulo: a.titulo, descricao: a.descricao, botao: a.botao }
      const id = await (await import('@/servicos/controle-anuncios')).adicionarAnuncioMeta(sb, { id: userId, papel }, cliente, { conjuntoId: a.conjuntoId, link: a.link, formularioId: a.formularioId, anuncio })
      return { ok: true, anuncioId: id, status: 'PAUSADO' }
    },
  }),

  definir({
    nome: 'posts_publicados',
    descricao: 'Posts publicados no Instagram pela plataforma (os 60 mais recentes), com as métricas atuais (visualizações, alcance, interações, salvamentos, compartilhamentos) e a nota da análise, se já houver. Use o id em insight_post e analisar_post.',
    escrita: false,
    entrada: { clienteId: id('Cliente (de listar_clientes); vazio = todos').optional() },
    executar: async ({ sb }, a) => {
      const ip = await import('@/servicos/insights-post')
      const todos = (await conteudoSvc.listarAgendamentos(sb)).filter((p) => p.status === 'publicado' && p.igMediaId && (!a.clienteId || p.cliente?.id === a.clienteId))
      const posts = todos.sort((x, y) => (y.publicadoEm ?? '').localeCompare(x.publicadoEm ?? '')).slice(0, 60)
      const [m, notas] = await Promise.all([ip.metricasDosPosts(posts.map((p) => ({ igId: p.igMediaId!, formato: p.formato }))), ip.notasDosPosts(sb, posts.map((p) => p.id))])
      return posts.map((p) => ({ id: p.id, titulo: p.titulo, cliente: p.cliente?.nome, formato: p.formato, publicadoEm: p.publicadoEm, link: p.igLink, metricas: m.get(p.igMediaId!) ?? null, nota: notas.get(p.id) ?? null }))
    },
  }),

  definir({
    nome: 'insight_post',
    descricao: 'Métricas atuais de um post publicado, a comparação com a mediana dos posts dos últimos 90 dias do perfil (nota bom, mediano ou ruim, com os motivos) e a última análise da IA (o que deu certo, o que não deu, replicar, evitar).',
    escrita: false,
    entrada: { postId: id('Post (id de posts_publicados)') },
    executar: async ({ sb }, a) => (await import('@/servicos/insights-post')).insightDoPost(sb, a.postId),
  }),

  definir({
    nome: 'analisar_post',
    descricao: 'Faz a IA (Gemini) assistir o vídeo ou a imagem do post publicado, cruzar com as métricas e a média do perfil, e guardar a análise: tipo de conteúdo, resumo, o que deu certo, o que não deu, o que replicar e o que evitar. Leva até 1 ou 2 minutos em vídeos.',
    escrita: true,
    entrada: { postId: id('Post (id de posts_publicados)') },
    executar: async ({ sb }, a) => (await import('@/servicos/insights-post')).analisarPost(sb, a.postId),
  }),

  definir({
    nome: 'relatorio_clientes_trabalhados',
    descricao: 'Ranking de em quais clientes a pessoa conectada trabalhou (botão "trabalhei hoje" da galeria) nos últimos 7, 14 ou 30 dias: dias trabalhados por cliente, último dia, saudável (≥ 2 dias por semana) ou precisando de atenção, e quantos clientes por dia.',
    escrita: false,
    entrada: { dias: z.union([z.literal(7), z.literal(14), z.literal(30)]).optional().describe('Período em dias; padrão 7') },
    executar: async ({ sb }, a) => {
      const dias = diasDoPeriodo(dataDeHoje(new Date()), a.dias ?? 7)
      const [clientes, marcas] = await Promise.all([listarClientes(sb), marcasDeTrabalhoDesde(sb, dias[0])])
      const r = rankingDeTrabalho(clientes.filter((c) => !c.interno && c.status !== 'encerrado'), marcas, dias)
      return { de: dias[0], ate: dias.at(-1), minimoSaudavel: r.minimo, ranking: r.ranking.map(({ id, nome, dias, ultimo, saudavel }) => ({ id, nome, dias, ultimo, saudavel })), porDia: r.porDia }
    },
  }),

  definir({
    nome: 'listar_equipe',
    descricao: 'Pessoas ativas da equipe (para escolher responsáveis).',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => listarEquipe(sb).then((p) => p.map((x) => ({ id: x.id, nome: x.nome }))),
  }),

  definir({
    nome: 'listar_campos_da_lista',
    descricao: 'Status (com ids) e campos personalizados de uma lista.',
    escrita: false,
    entrada: { listaId: id('Id da lista') },
    executar: async ({ sb }, { listaId }) => {
      const lista = await buscarLista(sb, listaId)
      if (!lista) throw new Error('Lista não encontrada ou sem acesso.')
      const definicoes = await campos.listarCamposDaLista(sb, listaId)
      return {
        lista: { id: lista.id, nome: lista.nome, espacoId: lista.espaco.id, cliente: lista.cliente.nome },
        status: lista.status.map((s) => ({ id: s.id, nome: s.nome, categoria: s.categoria })),
        campos: definicoes.map((c) => ({ id: c.id, nome: c.nome, tipo: c.tipo, opcoes: c.configuracao.options ?? null })),
      }
    },
  }),

  definir({
    nome: 'listar_tarefas',
    descricao: 'Tarefas e subtarefas de uma lista (paiId preenchido = subtarefa).',
    escrita: false,
    entrada: { listaId: id('Id da lista') },
    executar: async ({ sb }, { listaId }) =>
      (await tarefas.listarTarefas(sb, { listaId }, lerFiltros({}), dataDeHoje(new Date()))).map((t) => ({
        id: t.id,
        titulo: t.titulo,
        paiId: t.paiId,
        statusId: t.statusId,
        prioridade: t.prioridade,
        prazo: t.prazo,
        concluida: !!t.concluidaEm,
        responsaveis: t.responsaveis.map((r) => r.nome),
      })),
  }),

  definir({
    nome: 'buscar_tarefa',
    descricao: 'Detalhes de uma tarefa: descrição em texto, campos personalizados com valores e subtarefas.',
    escrita: false,
    entrada: { tarefaId: id('Id da tarefa') },
    executar: async ({ sb }, { tarefaId }) => {
      const t = await tarefas.buscarTarefa(sb, tarefaId)
      if (!t) throw new Error('Tarefa não encontrada ou sem acesso.')
      const definicoes = await campos.listarCamposDaTarefa(sb, tarefaId, t.lista.id)
      return {
        id: t.id,
        titulo: t.titulo,
        descricao: descricaoParaTexto(t.descricao),
        statusId: t.statusId,
        prioridade: t.prioridade,
        prazo: t.prazo,
        lista: { id: t.lista.id, nome: t.lista.nome },
        pai: t.pai,
        responsaveis: t.responsaveis.map((r) => ({ id: r.id, nome: r.nome })),
        campos: definicoes.map((c) => ({ id: c.id, nome: c.nome, tipo: c.tipo, valor: c.valor ?? null })),
        subtarefas: t.subtarefas.map((s) => ({ id: s.id, titulo: s.titulo })),
      }
    },
  }),

  definir({
    nome: 'criar_pasta',
    descricao: 'Cria uma pasta dentro de um espaço (ou solta na raiz, com espacoId vazio). Exige ser gestor do espaço.',
    escrita: true,
    entrada: { espacoId: id('Id do espaço').nullable().optional(), nome: z.string().min(1).max(80) },
    executar: async ({ sb }, a) => ({ pastaId: await estrutura.criarPasta(sb, a.espacoId ?? null, a.nome.trim()) }),
  }),

  definir({
    nome: 'criar_lista',
    descricao: 'Cria uma lista (já vem com os status padrão). Cliente é opcional. Exige ser gestor do espaço. mes opcional no formato AAAA-MM-01.',
    escrita: true,
    entrada: {
      espacoId: id('Id do espaço').nullable().optional(),
      pastaId: id('Id da pasta').nullable().optional(),
      clienteId: id('Id do cliente padrão das tarefas (opcional)').nullable().optional(),
      nome: z.string().min(1).max(80),
      mes: z.string().regex(/^\d{4}-\d{2}-01$/).nullable().optional(),
    },
    executar: async ({ sb }, a) => ({
      listaId: await estrutura.criarLista(sb, { espacoId: a.espacoId ?? null, pastaId: a.pastaId ?? null, clienteId: a.clienteId ?? null, nome: a.nome.trim(), mes: a.mes ?? null }),
    }),
  }),

  definir({
    nome: 'criar_status',
    descricao: 'Adiciona um status a uma lista. Exige ser gestor do espaço.',
    escrita: true,
    entrada: { listaId: id('Id da lista'), nome: z.string().min(1).max(40), categoria: z.enum(STATUS_CATEGORIAS), cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() },
    executar: async ({ sb }, a) => {
      await status.criarStatus(sb, a.listaId, a.nome.trim(), a.cor ?? '#87909e', a.categoria)
      return { ok: true }
    },
  }),

  definir({
    nome: 'criar_campo',
    descricao: 'Cria um campo personalizado no espaço da lista e já o liga à lista. Para lista suspensa e rótulos, informe opcoes. Exige ser gestor do espaço.',
    escrita: true,
    entrada: {
      listaId: id('Id da lista que receberá o campo'),
      nome: z.string().min(1).max(60),
      tipo: z.enum([...TIPOS_CAMPO] as [TipoCampoPersonalizado, ...TipoCampoPersonalizado[]]),
      opcoes: z.array(z.string().min(1)).max(100).optional(),
    },
    executar: async ({ sb }, a) => {
      const lista = await buscarLista(sb, a.listaId)
      if (!lista) throw new Error('Lista não encontrada ou sem acesso.')
      const campoId = await campos.criarCampo(sb, { espacoId: lista.espaco.id, listaId: a.listaId, nome: a.nome, tipo: a.tipo, configuracao: a.opcoes ? { options: a.opcoes } : {}, cor: '#70262d', icone: 'type' })
      return { campoId }
    },
  }),

  definir({
    nome: 'criar_tarefa',
    descricao: 'Cria uma tarefa (ou subtarefa, com paiId). Descrição em texto simples.',
    escrita: true,
    entrada: {
      listaId: id('Id da lista'),
      titulo: z.string().min(1).max(200),
      descricao: z.string().max(50000).optional(),
      paiId: id('Id da tarefa mãe (para criar subtarefa)').optional(),
      statusId: id('Id do status').optional(),
      prioridade: z.enum(PRIORIDADES).optional(),
      prazo: data('Vencimento (é ele que posiciona a tarefa no calendário)').optional(),
      responsaveis: z.array(id('Id de uma pessoa')).max(10).optional(),
      clienteId: id('Tag de cliente da tarefa (id de listar_clientes)').optional(),
    },
    executar: async (ctx, a) => {
      const tarefaId = await criarUma(ctx, a)
      if (a.clienteId) await tarefas.definirTagCliente(ctx.sb, tarefaId, a.clienteId)
      return { tarefaId }
    },
  }),

  definir({
    nome: 'criar_tarefas_em_lote',
    descricao:
      'Cria várias tarefas de uma vez, cada uma com subtarefas (listadas ou em série, como Post 1 a Post 30) e valores de campos personalizados. Ideal para importar roteiros, calendários e planejamentos. Máximo de 50 tarefas e 300 subtarefas por chamada, todas na mesma lista.',
    escrita: true,
    entrada: {
      listaId: id('Id da lista'),
      tarefas: z
        .array(
          z.object({
            titulo: z.string().min(1).max(200),
            descricao: z.string().max(50000).optional(),
            prazo: data('Vencimento (é ele que posiciona a tarefa no calendário)').optional(),
            prioridade: z.enum(PRIORIDADES).optional(),
            clienteId: id('Tag de cliente da tarefa e das subtarefas (id de listar_clientes)').optional(),
            valoresCampos: z.record(z.string().uuid(), valorCampo).optional().describe('Objeto { idDoCampo: valor }'),
            subtarefas: z.array(z.object({ titulo: z.string().min(1).max(200), descricao: z.string().max(50000).optional() })).max(100).optional(),
            serieSubtarefas: z
              .object({ prefixo: z.string().min(1).max(100), de: z.number().int().min(0).max(1000), ate: z.number().int().min(0).max(1000) })
              .optional()
              .describe('Atalho para séries: { prefixo: "Post", de: 1, ate: 30 } cria as subtarefas "Post 1" … "Post 30" (além das de "subtarefas"). Use isto em vez de listar uma a uma.'),
          }),
        )
        .min(1)
        .max(50),
    },
    executar: async (ctx, a) => {
      const lista = (t: (typeof a.tarefas)[number]) => [
        ...(t.subtarefas ?? []),
        ...(t.serieSubtarefas ? Array.from({ length: Math.max(0, t.serieSubtarefas.ate - t.serieSubtarefas.de + 1) }, (_, i) => ({ titulo: `${t.serieSubtarefas!.prefixo} ${t.serieSubtarefas!.de + i}`, descricao: undefined as string | undefined })) : []),
      ]
      if (a.tarefas.reduce((n, t) => n + lista(t).length, 0) > 300) throw new Error('No máximo 300 subtarefas por chamada.')
      const criadas: { tarefaId: string; titulo: string; subtarefaIds: string[] }[] = []
      for (const t of a.tarefas) {
        const tarefaId = await criarUma(ctx, { listaId: a.listaId, titulo: t.titulo, descricao: t.descricao, prazo: t.prazo, prioridade: t.prioridade })
        for (const [campoId, valor] of Object.entries(t.valoresCampos ?? {})) await campos.salvarValorDoCampo(ctx.sb, tarefaId, campoId, valor as Json)
        const subtarefaIds: string[] = []
        for (const s of lista(t)) subtarefaIds.push(await criarUma(ctx, { listaId: a.listaId, titulo: s.titulo, descricao: s.descricao, paiId: tarefaId }))
        if (t.clienteId) await tarefas.definirTagCliente(ctx.sb, tarefaId, t.clienteId)
        criadas.push({ tarefaId, titulo: t.titulo, subtarefaIds })
      }
      return { criadas }
    },
  }),

  definir({
    nome: 'atualizar_tarefa',
    descricao: 'Altera título, descrição, status, prioridade, vencimento, responsáveis ou a tag de cliente de uma tarefa. A tag de cliente vale para a tarefa-mãe e todas as subtarefas (clienteId null remove). Só envie o que muda.',
    escrita: true,
    entrada: {
      tarefaId: id('Id da tarefa'),
      titulo: z.string().min(1).max(200).optional(),
      descricao: z.string().max(50000).optional(),
      statusId: id('Id do status').optional(),
      prioridade: z.enum(PRIORIDADES).optional(),
      prazo: data('Vencimento (é ele que posiciona a tarefa no calendário)').nullable().optional(),
      responsaveis: z.array(id('Id de uma pessoa')).min(1).max(10).optional(),
      clienteId: id('Tag de cliente (id de listar_clientes); null remove a tag').nullable().optional(),
    },
    executar: async ({ sb }, a) => {
      await tarefas.atualizarTarefa(sb, a.tarefaId, {
        titulo: a.titulo,
        descricao: a.descricao === undefined ? undefined : textoParaDescricao(a.descricao),
        statusId: a.statusId,
        prioridade: a.prioridade,
        prazo: a.prazo,
      })
      if (a.responsaveis) await tarefas.definirResponsaveis(sb, a.tarefaId, a.responsaveis)
      if (a.clienteId !== undefined) await tarefas.definirTagCliente(sb, a.tarefaId, a.clienteId)
      return { ok: true }
    },
  }),

  definir({
    nome: 'arquivar_tarefa',
    descricao: 'Arquiva uma tarefa criada por engano (com as subtarefas): ela some das listas, mas continua guardada no banco, nada é apagado de verdade. Use só quando a pessoa pedir.',
    escrita: true,
    entrada: { tarefaId: id('Id da tarefa-mãe a arquivar') },
    executar: async ({ sb }, a) => {
      await tarefas.arquivarTarefas(sb, [a.tarefaId])
      return { ok: true }
    },
  }),

  definir({
    nome: 'definir_valor_campo',
    descricao: 'Grava o valor de um campo personalizado numa tarefa (null limpa). O campo precisa estar ligado à lista da tarefa.',
    escrita: true,
    entrada: { tarefaId: id('Id da tarefa'), campoId: id('Id do campo'), valor: valorCampo },
    executar: async ({ sb }, a) => {
      await campos.salvarValorDoCampo(sb, a.tarefaId, a.campoId, a.valor as Json)
      return { ok: true }
    },
  }),


  definir({
    nome: 'listar_documentos',
    descricao: 'Lista os documentos que você pode ver (título, dono, quem vê, cliente e listas em que estão). Com listaId, só os daquela lista.',
    escrita: false,
    entrada: { listaId: id('Id da lista (opcional)').optional() },
    executar: async ({ sb }, a) => {
      const docs = a.listaId ? await documentos.listarDocumentosDaLista(sb, a.listaId) : await documentos.listarDocumentos(sb)
      return docs.filter((d) => !d.arquivadoEm).map((d) => ({ id: d.id, titulo: d.titulo, dono: d.donoNome, quemVe: d.visibilidade, cliente: d.clienteNome, clienteVe: d.clienteVisivel, wiki: d.wiki, listas: d.listas, atualizadoEm: d.atualizadoEm }))
    },
  }),

  definir({
    nome: 'buscar_documento',
    descricao: 'Abre um documento: páginas (em árvore) e o texto de uma página (a primeira, ou paginaId). O texto sai simples, sem formatação.',
    escrita: false,
    entrada: { documentoId: id('Id do documento'), paginaId: id('Id da página (opcional)').optional() },
    executar: async ({ sb }, a) => {
      const doc = await documentos.buscarDocumento(sb, a.documentoId)
      if (!doc) throw new Error('Documento não encontrado ou sem acesso')
      const ordem = arvoreDePaginas(doc.paginas)
      const alvo = ordem.find((p) => p.id === a.paginaId) ?? ordem[0]
      const pagina = alvo ? await documentos.buscarPagina(sb, alvo.id) : null
      return {
        id: doc.resumo.id,
        titulo: doc.resumo.titulo,
        quemVe: doc.resumo.visibilidade,
        cliente: doc.resumo.clienteNome,
        clienteVe: doc.resumo.clienteVisivel,
        listas: doc.resumo.listas,
        paginas: ordem.map((p) => ({ id: p.id, titulo: p.titulo || '(sem título)', nivel: p.nivel })),
        pagina: pagina ? { id: pagina.id, titulo: pagina.titulo, texto: descricaoParaTexto(conteudoAtual(pagina)) } : null,
      }
    },
  }),

  definir({
    nome: 'criar_documento',
    descricao: 'Cria um documento (com texto inicial opcional). Com listaId ele já nasce vinculado à lista. quemVe: "team" (equipe toda, padrão) ou "private" (só quem tem o token). Para o cliente ver, informe clienteId e clienteVe=true.',
    escrita: true,
    entrada: {
      titulo: z.string().min(1).max(200),
      texto: z.string().max(100000).optional().describe('Texto da primeira página; quebras de linha viram parágrafos'),
      listaId: id('Lista onde o documento fica vinculado').optional(),
      quemVe: z.enum(['team', 'private']).optional(),
      clienteId: id('Cliente do documento').optional(),
      clienteVe: z.boolean().optional().describe('O cliente pode ver (somente leitura, no portal)'),
    },
    executar: async ({ sb, userId }, a) => {
      const novo = await documentos.criarDocumento(sb, userId, { titulo: a.titulo, texto: a.texto, listaId: a.listaId, visibilidade: a.quemVe, clienteId: a.clienteId ?? null, clienteVisivel: a.clienteVe })
      return { id: novo }
    },
  }),

  definir({
    nome: 'atualizar_documento',
    descricao: 'Muda título, arquivamento, quem vê (team/private), cliente e se ele vê; vincula ou desvincula de uma lista. Desvincular não apaga o documento.',
    escrita: true,
    entrada: {
      documentoId: id('Id do documento'),
      titulo: z.string().min(1).max(200).optional(),
      arquivado: z.boolean().optional(),
      quemVe: z.enum(['team', 'private']).optional(),
      clienteId: id('Cliente do documento').nullable().optional(),
      clienteVe: z.boolean().optional(),
      vincularListaId: id('Vincular a esta lista').optional(),
      desvincularListaId: id('Desvincular desta lista').optional(),
    },
    executar: async ({ sb }, a) => {
      await documentos.atualizarDocumento(sb, a.documentoId, { titulo: a.titulo, arquivado: a.arquivado, visibilidade: a.quemVe, clienteId: a.clienteId, clienteVisivel: a.clienteVe })
      if (a.vincularListaId) await documentos.vincularLista(sb, a.documentoId, a.vincularListaId)
      if (a.desvincularListaId) await documentos.desvincularLista(sb, a.documentoId, a.desvincularListaId)
      return { ok: true }
    },
  }),

  definir({
    nome: 'criar_pagina_documento',
    descricao: 'Cria uma página (ou subpágina, com paiId) num documento, com texto inicial opcional.',
    escrita: true,
    entrada: { documentoId: id('Id do documento'), titulo: z.string().max(200), paiId: id('Página-mãe (opcional)').optional(), texto: z.string().max(100000).optional() },
    executar: async ({ sb, userId }, a) => {
      const pagina = await documentos.criarPagina(sb, a.documentoId, a.paiId ?? null, a.titulo)
      if (a.texto) await anexarTexto(sb, userId, pagina, a.texto)
      return { id: pagina }
    },
  }),

  definir({
    nome: 'atualizar_pagina_documento',
    descricao: 'Muda o título de uma página e/ou ACRESCENTA texto ao fim dela (não substitui o que já existe, para não apagar o que outras pessoas escreveram).',
    escrita: true,
    entrada: { paginaId: id('Id da página'), titulo: z.string().max(200).optional(), acrescentarTexto: z.string().max(100000).optional() },
    executar: async ({ sb, userId }, a) => {
      if (a.titulo !== undefined) await documentos.atualizarPagina(sb, a.paginaId, { titulo: a.titulo })
      if (a.acrescentarTexto) await anexarTexto(sb, userId, a.paginaId, a.acrescentarTexto)
      return { ok: true }
    },
  }),

  definir({
    nome: 'comentar',
    descricao: 'Comenta numa tarefa. Por padrão o comentário é interno (o cliente não vê).',
    escrita: true,
    entrada: { tarefaId: id('Id da tarefa'), texto: z.string().min(1).max(10000), interno: z.boolean().default(true) },
    executar: async ({ sb }, a) => {
      await criarComentario(sb, { tarefaId: a.tarefaId, texto: a.texto, interno: a.interno, mencoes: [], anexos: [] })
      return { ok: true }
    },
  }),
  definir({
    nome: 'listar_lancamentos',
    descricao: 'Lançamentos financeiros (entradas e despesas) de um mês, do mais recente ao mais antigo. Só o admin tem acesso. Valores em reais.',
    escrita: false,
    entrada: { mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().describe('Mês (AAAA-MM); padrão: o mês atual') },
    executar: async ({ sb }, a) => {
      const { de, ate } = limitesDoMes(lerMes(a.mes, dataDeHoje(new Date())))
      return (await financeiro.listarLancamentos(sb, de, ate)).map((l) => ({ id: l.id, tipo: l.tipo, categoria: l.categoria, descricao: l.descricao, valor: l.centavos / 100, data: l.data, pago: l.pago, cliente: l.clienteNome }))
    },
  }),

  definir({
    nome: 'resumir_financeiro',
    descricao: 'Resumo do mês: entradas e despesas PAGAS, saldo (só o que foi pago), a receber, a pagar, previsto (pago + pendente) e, por categoria, previsto, pago e pendente. Só o admin tem acesso. Valores em reais.',
    escrita: false,
    entrada: { mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().describe('Mês (AAAA-MM); padrão: o mês atual') },
    executar: async ({ sb }, a) => {
      const mes = lerMes(a.mes, dataDeHoje(new Date()))
      const { de, ate } = limitesDoMes(mes)
      const r = resumir(await financeiro.listarLancamentos(sb, de, ate))
      const reais = (c: number) => c / 100
      return { mes, entradas: reais(r.entradas), despesas: reais(r.despesas), saldo: reais(r.saldo), aReceber: reais(r.aReceber), aPagar: reais(r.aPagar), previsto: reais(r.previsto), porCategoria: r.porCategoria.map((c) => ({ tipo: c.tipo, categoria: c.categoria, previsto: reais(c.centavos), pago: reais(c.pagos), pendente: reais(c.pendentes) })) }
    },
  }),

  definir({
    nome: 'criar_lancamento',
    descricao: `Cria um lançamento financeiro (só o admin). tipo: entrada ou saida (despesa). Categorias sugeridas — entrada: ${CATEGORIAS.entrada.join(', ')}; saida: ${CATEGORIAS.saida.join(', ')}. Valor em reais (positivo). repetirMeses > 1 repete todo mês (os próximos ficam pendentes).`,
    escrita: true,
    entrada: {
      tipo: z.enum(TIPOS_LANCAMENTO),
      categoria: z.string().min(1).max(60),
      valor: z.number().positive().max(999999999),
      data: data('Data do lançamento'),
      descricao: z.string().max(200).optional(),
      pago: z.boolean().default(true).describe('Já recebido/pago'),
      clienteId: id('Cliente ligado ao lançamento').optional(),
      repetirMeses: z.number().int().min(1).max(36).default(1),
    },
    executar: async ({ sb }, a) => ({ criados: await financeiro.criarLancamentos(sb, { tipo: a.tipo, categoria: a.categoria, descricao: a.descricao ?? '', centavos: Math.round(a.valor * 100), data: a.data, pago: a.pago, clienteId: a.clienteId ?? null }, a.repetirMeses) }),
  }),

  definir({
    nome: 'listar_funis',
    descricao: 'Funis visuais da equipe (nome, id e quando mudou).',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => (await telas.listarTelas(sb, 'funil')).map((f) => ({ id: f.id, nome: f.titulo, atualizadoEm: f.atualizadoEm })),
  }),

  definir({
    nome: 'calcular_funil',
    descricao: 'Etapas, ligações (taxa de conversão) e o resultado calculado de um funil: visitantes por etapa, leads (etapas Formulário e WhatsApp; a de WhatsApp depois de um formulário não conta de novo), vendas, receita, lucro, custo por lead (cpl) e por venda (cac), ROAS e conversão de entrada em venda (conversao em fração 0 a 1; conversaoPercentual em %). Sem investimento, cpl e cac vêm null. Valores em reais.',
    escrita: false,
    entrada: { funilId: id('Id do funil') },
    executar: async ({ sb }, a) => {
      const tela = await telas.buscarTela(sb, 'funil', a.funilId)
      if (!tela) throw new Error('Funil não encontrado.')
      const d = lerDadosFunil(tela.dados)
      const r = calcularFunil(d)
      return {
        nome: tela.titulo,
        etapas: d.nos.map((n) => ({ id: n.id, nome: n.nome, tipo: n.tipo, visitantes: r.nos[n.id].visitantes, investimento: n.custo, receita: r.nos[n.id].receita })),
        ligacoes: d.ligacoes.map((l) => ({ de: l.de, para: l.para, taxaPercentual: l.taxa, pessoas: r.fluxo[l.id] })),
        // conversao = fração (0 a 1), como na tela; conversaoPercentual = o mesmo em %.
        totais: { ...r.totais, conversaoPercentual: r.totais.conversao === null ? null : Math.round(r.totais.conversao * 10_000) / 100 },
      }
    },
  }),

  definir({
    nome: 'listar_quadros',
    descricao: 'Quadros brancos da equipe (nome, id e quando mudou). O desenho em si só existe na tela.',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => (await telas.listarTelas(sb, 'quadro')).map((q) => ({ id: q.id, nome: q.titulo, atualizadoEm: q.atualizadoEm })),
  }),

  definir({
    nome: 'relatorio_projetos',
    descricao: 'Painel de foco dos projetos. Projetos é uma lista: cada tarefa principal é um projeto (normalmente um cliente) e as subtarefas são as entregas. Por projeto: tempo investido no período e no total, fatia do tempo, subtarefas concluídas (no total e no período), em andamento, pendentes, atrasadas, última atividade e situação (em foco / precisa de atenção = tarefas abertas sem tempo nem entrega em 7 dias). Com listaId, faz o mesmo painel para outra lista (uma linha por tarefa principal). Conta só tarefas sem subtarefas (a tarefa-mãe é agrupamento).',
    escrita: false,
    entrada: {
      dias: z.union([z.literal(7), z.literal(30), z.literal(90)]).optional().describe('Período em dias; padrão 30'),
      quem: z.enum(['eu', 'equipe']).optional().describe('Tempo só da pessoa dona do token (padrão) ou da equipe toda'),
      listaId: id('Outra lista para o mesmo painel (padrão: a lista Projetos)').optional(),
    },
    executar: async ({ sb, userId }, a) => {
      const projetos = a.listaId ? null : await listaDeProjetos(sb)
      if (!a.listaId && !projetos) throw new Error('Os projetos ainda não foram configurados (aba Projetos, botão "Configurar Projetos").')
      const listaId = a.listaId ?? projetos!.id
      const p = await painelDoEscopo(sb, { listaId, cor: '' }, { dias: a.dias ?? 30, usuarioId: a.quem === 'equipe' ? null : userId, agora: new Date() })
      const horas = (s: number) => Math.round((s / 3600) * 10) / 10
      return {
        listaId,
        desde: p.inicioPeriodo,
        totais: { ...p.totais, horasPeriodo: horas(p.totais.segundosPeriodo), horasTotal: horas(p.totais.segundosTotal), tempoPeriodo: formatarDuracao(p.totais.segundosPeriodo) },
        linhas: p.linhas.map((l) => ({
          tarefaId: l.id, nome: l.nome, detalhe: l.detalhe, horasPeriodo: horas(l.segundosPeriodo), horasTotal: horas(l.segundosTotal), participacaoPercentual: Math.round(l.participacao * 100),
          total: l.total, concluidas: l.concluidas, concluidasPeriodo: l.concluidasPeriodo, emAndamento: l.emAndamento, pendentes: l.pendentes, atrasadas: l.atrasadas, ultimaAtividade: l.ultimaAtividade, situacao: l.saude,
        })),
        horasPorSemana: p.semanas.map((s) => ({ semana: s.inicio, horas: horas(s.segundos) })),
      }
    },
  }),

  definir({
    nome: 'situacao_publicacao_post',
    descricao: 'Agendamento e publicação de um post de conteúdo (tarefa da lista de conteúdo) no Instagram/Facebook: aprovação do cliente, dia e hora, redes, situação (agendado, publicado, falhou e o motivo) e os links publicados.',
    escrita: false,
    entrada: { tarefaId: id('Post (id da tarefa da lista de conteúdo)') },
    executar: async ({ sb }, a) => {
      const [post, pub] = await Promise.all([conteudoSvc.buscarConteudo(sb, a.tarefaId), conteudoSvc.buscarPublicacao(sb, a.tarefaId)])
      if (!post || !pub) throw new Error('Post de conteúdo não encontrado (ou falta a migration de publicação).')
      return { formato: post.formato, aprovacao: post.aprovacao, versao: post.versaoAtual, publicarEm: pub.em, redes: pub.alvos, collab: pub.collabs, modo: pub.modo, status: pub.status, erro: pub.erro, instagram: pub.igLink, facebook: pub.fbLink, cliente: pub.cliente?.nome }
    },
  }),

  definir({
    nome: 'agendar_post',
    descricao: 'Agenda um post de conteúdo para o Instagram e/ou Facebook. modo "aprovacao": o post vai para o portal do cliente (se ainda é rascunho) e só publica no horário depois que ele aprovar; "direto": publica no horário sem aprovação. Data AAAA-MM-DD e hora HH:MM (Belém). O post precisa ter mídia e o cliente a Página do Facebook no cadastro. collab: até 3 @ do Instagram convidados como coautores (feed, Reels e carrossel; Stories não), cada um aceita o convite no app; omitir mantém os já salvos, [] tira. Não publica na hora (isso só pela tela).',
    escrita: true,
    entrada: {
      tarefaId: id('Post (id da tarefa da lista de conteúdo)'),
      data: data('Dia da publicação'),
      hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).describe('Hora HH:MM (Belém)'),
      redes: z.array(z.enum(['instagram', 'facebook', 'google'])).min(1).describe('Onde publicar (google = Google Meu Negócio: texto + primeira foto)'),
      modo: z.enum(['aprovacao', 'direto']).optional().describe('Padrão: aprovacao'),
      collab: z.array(z.string()).max(3).optional().describe('@ do Instagram convidados para a collab (até 3)'),
    },
    executar: async ({ sb }, a) => {
      const collabs = a.collab === undefined ? undefined : lerCollabs(a.collab.join(' '))
      if (collabs && 'erro' in collabs) throw new Error(collabs.erro)
      const problema = await conteudoSvc.problemaParaPublicar(sb, a.tarefaId, a.redes, collabs)
      if (problema) throw new Error(problema)
      const post = await conteudoSvc.buscarConteudo(sb, a.tarefaId)
      const modo = a.modo ?? 'aprovacao'
      if (modo === 'aprovacao' && post?.aprovacao === 'ajuste') throw new Error('O cliente pediu ajuste: edite o post (nasce a versão nova) antes de reenviar.')
      const enviarAoCliente = modo === 'aprovacao' && post?.aprovacao === 'rascunho'
      await conteudoSvc.agendarPost(sb, a.tarefaId, { em: instante(a.data, a.hora).toISOString(), alvos: a.redes, modo, enviarAoCliente, collabs })
      return { ok: true, enviadoAoCliente: enviarAoCliente }
    },
  }),

  definir({
    nome: 'ver_time',
    descricao: 'Quadro do Time: cada pessoa da equipe com situação (ativo, ocioso, offline), há quanto tempo está inativa, o status escolhido (com detalhe e prazo) e o tempo ativo hoje.',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => {
      const agora = new Date()
      const quadro = await time.quadroDoTime(sb, dataDeHoje(agora))
      if (!quadro) throw new Error('Falta a migration do Time.')
      return quadro.map((m) => {
        const inativo = minutosDesde(m.ativoEm ?? m.vistoEm, agora)
        return { nome: m.nome, situacao: situacao(m, agora), inativoHa: situacao(m, agora) === 'ativo' || inativo === null ? null : duracao(inativo), status: ROTULO_STATUS_TIME[m.status], detalhe: m.statusTexto || null, ate: m.statusAte, ativoHoje: duracao(m.minutosHoje) }
      })
    },
  }),

  definir({
    nome: 'definir_meu_status',
    descricao: 'Muda o status da pessoa dona do token no Time (disponivel, reuniao, intervalo, foco, gravando, externo, ausente), com detalhe opcional e, se quiser, por quantos minutos (depois volta sozinho a disponível).',
    escrita: true,
    entrada: {
      status: z.enum(STATUS_TIME).describe('Novo status'),
      detalhe: z.string().max(80).optional().describe('Ex.: almoço, gravação no cliente'),
      minutos: z.number().int().min(1).max(24 * 60).optional().describe('Por quanto tempo (sem = até mudar)'),
    },
    executar: async ({ sb }, a) => {
      await time.definirStatus(sb, a.status, a.detalhe ?? '', a.minutos && a.status !== 'disponivel' ? new Date(Date.now() + a.minutos * 60_000).toISOString() : null)
      return { ok: true }
    },
  }),

  definir({
    nome: 'relatorio_time',
    descricao: 'Minutos ativos na plataforma por pessoa nos últimos N dias (padrão 7): total, dias ativos, média por dia ativo e o detalhe por dia. Admin e gestor veem a equipe toda; os demais só os próprios.',
    escrita: false,
    entrada: { dias: z.number().int().min(1).max(90).optional().describe('Padrão 7') },
    executar: async ({ sb }, a) => {
      const hoje = dataDeHoje(new Date())
      const atividade = await time.atividadeDesde(sb, somarDias(hoje, -((a.dias ?? 7) - 1)))
      const equipe = new Map((await listarEquipe(sb)).map((p) => [p.id, p.nome]))
      const porPessoa = new Map<string, { dia: string; minutos: number }[]>()
      for (const x of atividade) porPessoa.set(x.usuarioId, [...(porPessoa.get(x.usuarioId) ?? []), { dia: x.dia, minutos: x.minutos }])
      return [...porPessoa].map(([id, dias]) => {
        const total = dias.reduce((s, d) => s + d.minutos, 0)
        return { nome: equipe.get(id) ?? id, total: duracao(total), totalMinutos: total, diasAtivos: dias.length, mediaPorDia: duracao(total / dias.length), porDia: dias }
      }).sort((x, y) => y.totalMinutos - x.totalMinutos)
    },
  }),

  definir({
    nome: 'listar_canais_chat',
    descricao: 'Canais do chat da equipe que a pessoa dona do token vê (públicos e privados em que está), com mensagens não lidas.',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => (await chat.listarCanais(sb)).map((c) => ({ canal: c.nome, descricao: c.descricao, privado: c.privado, naoLidas: c.naoLidas })),
  }),

  definir({
    nome: 'ler_canal_chat',
    descricao: 'Últimas mensagens de um canal do chat (mais antigas primeiro), com autor, hora, anexos e quantas respostas em tópico cada uma tem. Com mensagemId, lê o tópico (a mensagem e as respostas). Menções aparecem como @Nome.',
    escrita: false,
    entrada: { canal: z.string().min(1).max(40).describe('Nome do canal (ex.: geral)'), limite: z.number().int().min(1).max(150).optional().describe('Padrão 50'), mensagemId: id('Mensagem principal para ler o tópico').optional() },
    executar: async ({ sb }, a) => {
      const canal = (await chat.listarCanais(sb)).find((c) => c.nome === a.canal.replace(/^#/, ''))
      if (!canal) throw new Error('Canal não encontrado (ou sem acesso).')
      const resumo = (m: chat.Mensagem) => ({
        id: m.id, autor: m.autorNome, em: m.criadoEm, editada: !!m.editadoEm,
        texto: segmentarTexto(m.texto).map((x) => (x.tipo === 'mencao' ? `@${x.nome}` : x.valor)).join(''),
        anexos: m.anexos.map((x) => x.nome), respostas: m.respostas.total || undefined,
      })
      if (a.mensagemId) {
        const fio = await chat.fioDaMensagem(sb, a.mensagemId)
        if (!fio) throw new Error('Mensagem não encontrada.')
        return { canal: canal.nome, mensagem: resumo(fio.principal), respostas: fio.respostas.map(resumo) }
      }
      return { canal: canal.nome, mensagens: (await chat.mensagensDoCanal(sb, canal.id, a.limite ?? 50)).map(resumo) }
    },
  }),

  definir({
    nome: 'enviar_mensagem_chat',
    descricao: 'Envia uma mensagem num canal do chat da equipe (em nome da pessoa dona do token). Para responder em tópico, informe respostaDe (id de uma mensagem principal). Para mencionar alguém (avisa no sino), escreva @[Nome](id) com o id de listar_equipe. Links de tarefas e documentos da plataforma aparecem com o título.',
    escrita: true,
    entrada: { canal: z.string().min(1).max(40).describe('Nome do canal'), texto: z.string().min(1).max(8000), respostaDe: id('Mensagem principal (tópico)').optional() },
    executar: async ({ sb }, a) => {
      const canal = (await chat.listarCanais(sb)).find((c) => c.nome === a.canal.replace(/^#/, ''))
      if (!canal) throw new Error('Canal não encontrado (ou sem acesso).')
      const mensagemId = await chat.enviarMensagem(sb, { canalId: canal.id, paiId: a.respostaDe ?? null, texto: a.texto.trim(), mencoes: extrairMencoes(a.texto), anexos: [] })
      return { mensagemId }
    },
  }),

  definir({
    nome: 'listar_tags_agenda',
    descricao: 'Tags da agenda (da equipe toda), com id, nome e cor. Use os ids em tags de criar_compromisso / atualizar_compromisso.',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => agenda.listarEtiquetas(sb, 'tag'),
  }),

  definir({
    nome: 'criar_tag_agenda',
    descricao: 'Cria uma tag da agenda (vale para a equipe toda). Nomes não se repetem. cor em #rrggbb (opcional).',
    escrita: true,
    entrada: { nome: z.string().trim().min(1).max(40).describe('Nome da tag'), cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Cor #rrggbb') },
    executar: async ({ sb }, a) => agenda.criarEtiqueta(sb, 'tag', a.nome, a.cor ?? '#64748b'),
  }),

  definir({
    nome: 'listar_categorias_agenda',
    descricao: 'Categorias da agenda (como as agendas do Google: cada compromisso tem no máximo uma, e a cor dela pinta o compromisso). Use o id em categoriaId de criar_compromisso / atualizar_compromisso.',
    escrita: false,
    entrada: {},
    executar: async ({ sb }) => agenda.listarEtiquetas(sb, 'categoria'),
  }),

  definir({
    nome: 'criar_categoria_agenda',
    descricao: 'Cria uma categoria da agenda (vale para a equipe toda), por exemplo Reuniões, Gravações, Pessoal. Nomes não se repetem. cor em #rrggbb (opcional).',
    escrita: true,
    entrada: { nome: z.string().trim().min(1).max(40).describe('Nome da categoria'), cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Cor #rrggbb') },
    executar: async ({ sb }, a) => agenda.criarEtiqueta(sb, 'categoria', a.nome, a.cor ?? '#3b82f6'),
  }),

  definir({
    nome: 'listar_agenda',
    descricao: 'Agenda da pessoa dona do token entre duas datas (padrão: a semana atual, de segunda a domingo; no máximo 62 dias). Traz os compromissos da plataforma (cada repetição de um fixo aparece no seu dia) e os eventos do Google Agenda dela, se conectado (origem: google, só leitura).',
    escrita: false,
    entrada: { de: data('Primeiro dia').optional(), ate: data('Último dia').optional() },
    executar: async ({ sb, userId }, a) => {
      const semana = semanaDe(dataDeHoje(new Date()))
      const de = a.de ?? semana[0]
      const ate = a.ate ?? (a.de ? somarDias(a.de, 6) : semana[6])
      if (ate < de || ate > somarDias(de, 61)) throw new Error('Período inválido: ate precisa ser depois de de, com no máximo 62 dias.')
      const [compromissos, doGoogle, equipe, clientes, tags, categorias] = await Promise.all([
        agenda.listarCompromissos(sb, de, ate),
        googleAgenda().then((g) => g.eventosDoGoogle(userId, de, ate)),
        listarEquipe(sb),
        listarClientes(sb),
        agenda.listarEtiquetas(sb, 'tag'),
        agenda.listarEtiquetas(sb, 'categoria'),
      ])
      const nome = new Map(equipe.map((p) => [p.id, p.nome]))
      const cliente = new Map(clientes.map((c) => [c.id, c.nome]))
      const tag = new Map(tags.map((t) => [t.id, t.nome]))
      const categoria = new Map(categorias.map((c) => [c.id, c.nome]))
      return [...ocorrencias(compromissos, de, ate), ...doGoogle]
        .sort((x, y) => x.inicio.localeCompare(y.inicio))
        .map((o) => ({
          origem: o.compromisso ? 'plataforma' : 'google',
          compromissoId: o.compromisso?.id,
          titulo: o.titulo,
          data: dataLocal(o.inicio),
          inicio: o.diaInteiro ? null : horaLocal(o.inicio),
          fim: o.diaInteiro ? null : horaLocal(o.fim),
          diaInteiro: o.diaInteiro,
          ...(o.compromisso && {
            descricao: o.compromisso.descricao,
            visibilidade: o.compromisso.visibilidade,
            pessoas: o.compromisso.pessoas.map((p) => nome.get(p) ?? p),
            repetir: o.compromisso.repetir,
            repetirAte: o.compromisso.repetirAte,
            criadoPor: nome.get(o.compromisso.criadoPor) ?? o.compromisso.criadoPor,
            cliente: o.compromisso.clienteId ? { id: o.compromisso.clienteId, nome: cliente.get(o.compromisso.clienteId) } : null,
            categoria: o.compromisso.categoriaId ? { id: o.compromisso.categoriaId, nome: categoria.get(o.compromisso.categoriaId) } : null,
            tags: o.compromisso.tags.flatMap((t) => (tag.has(t) ? [{ id: t, nome: tag.get(t) }] : [])),
          }),
        }))
    },
  }),

  definir({
    nome: 'criar_compromisso',
    descricao: 'Cria um compromisso na agenda (e no Google Agenda de quem vê, se conectado). Sem horaInicio/horaFim, use diaInteiro: true.',
    escrita: true,
    entrada: entradaCompromisso,
    executar: async (ctx, a) => {
      const v = lerCompromisso(a, ctx.papel === 'admin' || ctx.papel === 'gestor')
      if ('erro' in v) throw new Error(v.erro)
      const compromissoId = await agenda.criarCompromisso(ctx.sb, v.campos)
      await (await googleAgenda()).sincronizarCompromisso(compromissoId)
      return { compromissoId }
    },
  }),

  definir({
    nome: 'atualizar_compromisso',
    descricao: 'Altera um compromisso (só quem criou, ou o admin). Informe só o que muda; o resto continua igual. Vale para todas as repetições de um fixo.',
    escrita: true,
    entrada: { compromissoId: id('Compromisso (compromissoId de listar_agenda)'), ...z.object(entradaCompromisso).partial().shape },
    executar: async (ctx, { compromissoId, ...a }) => {
      const atual = await agenda.buscarCompromisso(ctx.sb, compromissoId)
      if (!atual) throw new Error('Compromisso não encontrado.')
      const definidos = Object.fromEntries(Object.entries(a).filter(([, x]) => x !== undefined)) as Partial<EntradaCompromisso>
      const v = lerCompromisso({ ...paraEntrada(atual), ...definidos }, ctx.papel === 'admin' || ctx.papel === 'gestor')
      if ('erro' in v) throw new Error(v.erro)
      await agenda.atualizarCompromisso(ctx.sb, compromissoId, v.campos)
      await (await googleAgenda()).sincronizarCompromisso(compromissoId)
      return { ok: true }
    },
  }),
]

async function criarUma(
  ctx: Contexto,
  a: { listaId: string; titulo: string; descricao?: string; paiId?: string; statusId?: string; prioridade?: (typeof PRIORIDADES)[number]; prazo?: string; responsaveis?: string[] },
): Promise<string> {
  const tarefaId = await tarefas.criarTarefa(ctx.sb, { listaId: a.listaId, titulo: a.titulo.trim(), responsaveis: a.responsaveis?.length ? a.responsaveis : [ctx.userId], paiId: a.paiId, statusId: a.statusId })
  const extras = { descricao: a.descricao ? textoParaDescricao(a.descricao) : undefined, prioridade: a.prioridade, prazo: a.prazo }
  if (Object.values(extras).some((v) => v !== undefined)) await tarefas.atualizarTarefa(ctx.sb, tarefaId, extras)
  return tarefaId
}
