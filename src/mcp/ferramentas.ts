import * as z from 'zod'
import { descricaoParaTexto, textoParaDescricao } from '@/dominio/descricao'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { CATALOGO_CAMPOS, TIPOS_CAMPO, type TipoCampoPersonalizado } from '@/dominio/personalizacao'
import { PRIORIDADES } from '@/dominio/tarefas'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { listarClientes, marcasDeTrabalhoDesde } from '@/servicos/clientes-plataforma'
import { diasDoPeriodo, rankingDeTrabalho } from '@/dominio/trabalho-clientes'
import { dataLocal, horaLocal, lerCompromisso, ocorrencias, paraEntrada, semanaDe, somarDias, type EntradaCompromisso } from '@/dominio/agenda'
import * as agenda from '@/servicos/agenda'
import { espacoDeProjetos, painelDoEscopo } from '@/servicos/painel-projetos'
import { formatarDuracao } from '@/dominio/painel-projetos'
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

export const FERRAMENTAS: Ferramenta[] = [
  definir({
    nome: 'descrever_plataforma',
    descricao: 'COMECE POR AQUI. Explica como a plataforma da Grupo SRV é organizada, as regras, os tipos de campo e as ferramentas disponíveis.',
    escrita: false,
    entrada: {},
    executar: async (ctx) => ({
      voce: { nome: ctx.nome, papel: ctx.papel, permissao: ctx.escopo === 'write' ? 'leitura e escrita' : 'somente leitura' },
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
        'Projetos: um espaço marcado como "de projetos"; cada lista dele é um projeto (normalmente um por cliente) e as tarefas/subtarefas são as entregas. relatorio_projetos traz o foco (tempo lançado nas tarefas pelo cronômetro ou à mão) e o andamento de cada projeto. Para criar um projeto, crie uma lista nesse espaço (criar_lista).',
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
    executar: async ({ sb }) => (await listarClientes(sb)).map((c) => ({ id: c.id, nome: c.nome, status: c.status })),
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
    descricao: 'Resumo do mês: entradas, despesas, saldo (só o que foi pago), a receber, a pagar, previsto e totais por categoria. Só o admin tem acesso. Valores em reais.',
    escrita: false,
    entrada: { mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().describe('Mês (AAAA-MM); padrão: o mês atual') },
    executar: async ({ sb }, a) => {
      const mes = lerMes(a.mes, dataDeHoje(new Date()))
      const { de, ate } = limitesDoMes(mes)
      const r = resumir(await financeiro.listarLancamentos(sb, de, ate))
      const reais = (c: number) => c / 100
      return { mes, entradas: reais(r.entradas), despesas: reais(r.despesas), saldo: reais(r.saldo), aReceber: reais(r.aReceber), aPagar: reais(r.aPagar), previsto: reais(r.previsto), porCategoria: r.porCategoria.map((c) => ({ tipo: c.tipo, categoria: c.categoria, valor: reais(c.centavos) })) }
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
    descricao: 'Etapas, ligações (taxa de conversão) e o resultado calculado de um funil: visitantes por etapa, leads, vendas, receita, lucro, custo por lead, custo por venda e ROAS. Valores em reais.',
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
        totais: r.totais,
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
    descricao: 'Painel de foco dos projetos (espaço Projetos: cada lista é um projeto, normalmente um por cliente). Por projeto: tempo investido no período e no total, fatia do tempo, tarefas concluídas (no total e no período), em andamento, pendentes, atrasadas, última atividade e situação (em foco / precisa de atenção = tarefas abertas sem tempo nem entrega em 7 dias). Com projetoId, detalha esse projeto por tarefa principal. Conta só tarefas sem subtarefas (a tarefa-mãe é agrupamento).',
    escrita: false,
    entrada: {
      dias: z.union([z.literal(7), z.literal(30), z.literal(90)]).optional().describe('Período em dias; padrão 30'),
      quem: z.enum(['eu', 'equipe']).optional().describe('Tempo só da pessoa dona do token (padrão) ou da equipe toda'),
      projetoId: id('Projeto (id de lista do espaço Projetos) para detalhar por tarefa').optional(),
    },
    executar: async ({ sb, userId }, a) => {
      const espaco = await espacoDeProjetos(sb)
      if (!espaco && !a.projetoId) throw new Error('O espaço de projetos ainda não foi configurado (aba Projetos, botão "Configurar Projetos").')
      const p = await painelDoEscopo(sb, a.projetoId ? { listaId: a.projetoId, cor: '' } : { espacoId: espaco!.id }, { dias: a.dias ?? 30, usuarioId: a.quem === 'equipe' ? null : userId, agora: new Date() })
      const horas = (s: number) => Math.round((s / 3600) * 10) / 10
      return {
        desde: p.inicioPeriodo,
        totais: { ...p.totais, horasPeriodo: horas(p.totais.segundosPeriodo), horasTotal: horas(p.totais.segundosTotal), tempoPeriodo: formatarDuracao(p.totais.segundosPeriodo) },
        linhas: p.linhas.map((l) => ({
          id: l.id, nome: l.nome, detalhe: l.detalhe, horasPeriodo: horas(l.segundosPeriodo), horasTotal: horas(l.segundosTotal), participacaoPercentual: Math.round(l.participacao * 100),
          total: l.total, concluidas: l.concluidas, concluidasPeriodo: l.concluidasPeriodo, emAndamento: l.emAndamento, pendentes: l.pendentes, atrasadas: l.atrasadas, ultimaAtividade: l.ultimaAtividade, situacao: l.saude,
        })),
        horasPorSemana: p.semanas.map((s) => ({ semana: s.inicio, horas: horas(s.segundos) })),
      }
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
