import * as z from 'zod'
import { descricaoParaTexto, textoParaDescricao } from '@/dominio/descricao'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { CATALOGO_CAMPOS, TIPOS_CAMPO, type TipoCampoPersonalizado } from '@/dominio/personalizacao'
import { PRIORIDADES } from '@/dominio/tarefas'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { listarClientes } from '@/servicos/clientes-plataforma'
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
        'Documentos: textos da equipe com páginas aninhadas, que podem ser vinculados a listas (visualização Documentos) e a um cliente. Escreva com criar_documento / atualizar_pagina_documento (só acrescenta texto). Nada é apagado por aqui. Para tirar algo do caminho, o fluxo é arquivar na plataforma.',
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
    },
    executar: async (ctx, a) => ({ tarefaId: await criarUma(ctx, a) }),
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
        criadas.push({ tarefaId, titulo: t.titulo, subtarefaIds })
      }
      return { criadas }
    },
  }),

  definir({
    nome: 'atualizar_tarefa',
    descricao: 'Altera título, descrição, status, prioridade, datas ou responsáveis de uma tarefa. Só envie o que muda.',
    escrita: true,
    entrada: {
      tarefaId: id('Id da tarefa'),
      titulo: z.string().min(1).max(200).optional(),
      descricao: z.string().max(50000).optional(),
      statusId: id('Id do status').optional(),
      prioridade: z.enum(PRIORIDADES).optional(),
      prazo: data('Vencimento (é ele que posiciona a tarefa no calendário)').nullable().optional(),
      responsaveis: z.array(id('Id de uma pessoa')).min(1).max(10).optional(),
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
