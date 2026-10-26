/**
 * Kommo (antigo amoCRM). O webhook dele manda `application/x-www-form-urlencoded` com chaves aninhadas
 * (`leads[status][0][id]=123`), não JSON: aqui vira um objeto comum.
 */
type Obj = Record<string, unknown>

/** `a[b][0][c]=1&a[b][0][d]=2` → { a: { b: [ { c: '1', d: '2' } ] } }. */
export function lerFormularioKommo(texto: string): Obj {
  const raiz: Obj = {}
  for (const [chave, valor] of new URLSearchParams(texto)) {
    const caminho = [...chave.matchAll(/([^[\]]+)/g)].map((m) => m[1])
    let no: Obj | unknown[] = raiz
    caminho.forEach((parte, i) => {
      const ultimo = i === caminho.length - 1
      const proximoEhIndice = !ultimo && /^\d+$/.test(caminho[i + 1])
      const contenedor = no as Record<string, unknown>
      if (ultimo) contenedor[parte] = valor
      else {
        contenedor[parte] ??= proximoEhIndice ? [] : {}
        no = contenedor[parte] as Obj | unknown[]
      }
    })
  }
  return normalizarIndices(raiz) as Obj
}

/** Objetos com chaves "0", "1"… viram lista (os índices numéricos do formulário). */
function normalizarIndices(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalizarIndices)
  if (v && typeof v === 'object') {
    const e = Object.entries(v as Obj)
    if (e.length && e.every(([k]) => /^\d+$/.test(k))) return e.sort((a, b) => Number(a[0]) - Number(b[0])).map(([, x]) => normalizarIndices(x))
    return Object.fromEntries(e.map(([k, x]) => [k, normalizarIndices(x)]))
  }
  return v
}

/** Subdomínio da conta que mandou o webhook (account[subdomain]). */
export const contaDoEvento = (corpo: unknown): string => String(((corpo as Obj)?.account as Obj | undefined)?.subdomain ?? '').slice(0, 80)

/** Só o formato de uma resposta da API (chaves e tipos), sem nomes, telefones nem textos de clientes. */
export function formaDe(v: unknown, fundura = 3): unknown {
  if (Array.isArray(v)) return v.length ? [formaDe(v[0], fundura)] : []
  if (v && typeof v === 'object') return fundura <= 0 ? '{…}' : Object.fromEntries(Object.entries(v as Obj).map(([k, x]) => [k, formaDe(x, fundura - 1)]))
  return v === null ? 'null' : typeof v
}

/** O evento traz o texto de alguma mensagem de chat (campo `text` não vazio dentro de `message`)? Não devolve o texto. */
export function temTexto(corpo: unknown): boolean {
  const procurar = (v: unknown, dentroDeMensagem: boolean): boolean => {
    if (Array.isArray(v)) return v.some((x) => procurar(x, dentroDeMensagem))
    if (v && typeof v === 'object') return Object.entries(v as Obj).some(([k, x]) => (dentroDeMensagem && k === 'text' && typeof x === 'string' && x.length > 0) || procurar(x, dentroDeMensagem || /^message$/i.test(k)))
    return false
  }
  return procurar(corpo, false)
}

/**
 * Valores de campos que são só classificação (tipo da mensagem, tipo do autor, canal de origem), contados nos eventos de
 * mensagem: mostra como o Kommo separa cliente, atendente e robô sem expor nome, telefone nem texto.
 */
export function classificacoesDasMensagens(corpos: unknown[]) {
  const conta = (m: Record<string, number>, v: unknown) => { const k = String(v ?? 'sem'); m[k] = (m[k] ?? 0) + 1 }
  const r = { message_type: {} as Record<string, number>, author_type: {} as Record<string, number>, origin: {} as Record<string, number>, element_type: {} as Record<string, number> }
  for (const c of corpos) {
    const add = ((c as Obj)?.message as Obj | undefined)?.add
    for (const m of (Array.isArray(add) ? add : []) as Obj[]) {
      conta(r.message_type, m.message_type)
      conta(r.author_type, (m.author as Obj | undefined)?.type)
      conta(r.origin, m.origin)
      conta(r.element_type, m.element_type)
    }
  }
  return r
}

/**
 * O que os eventos de negócio dizem sobre o funil, sem nome, telefone nem texto: para qual etapa e funil os negócios foram
 * movidos (ids), de qual etapa saíram e que etiquetas carregam. Venda = etapa 142 (ganho); perda = 143.
 */
export function classificacoesDosNegocios(corpos: unknown[]) {
  const conta = (m: Record<string, number>, v: unknown) => { const k = String(v ?? 'sem'); m[k] = (m[k] ?? 0) + 1 }
  const r = { eventos: {} as Record<string, number>, etapaNova: {} as Record<string, number>, etapaAnterior: {} as Record<string, number>, funil: {} as Record<string, number>, etiquetas: {} as Record<string, number>, comValor: 0 }
  for (const c of corpos) {
    const leads = (c as Obj)?.leads as Obj | undefined
    for (const [evento, lista] of Object.entries(leads ?? {})) {
      for (const l of (Array.isArray(lista) ? lista : []) as Obj[]) {
        conta(r.eventos, evento)
        conta(r.etapaNova, l.status_id)
        if (l.old_status_id !== undefined) conta(r.etapaAnterior, l.old_status_id)
        conta(r.funil, l.pipeline_id)
        for (const t of (Array.isArray(l.tags) ? l.tags : []) as Obj[]) conta(r.etiquetas, t.name)
        if (Number(l.price) > 0) r.comValor++
      }
    }
  }
  return r
}

// ───────────────────────────── Eventos do webhook, já interpretados ─────────────────────────────

import type { PapelMensagem } from './atendimento'

export type MensagemKommo = { id: string; texto: string; autorTipo: string; autorId: string; talkId: number; leadId: number | null; contatoId: number | null; criadaEm: number; origem: string }
export type ConversaKommo = { talkId: number; leadId: number | null; contatoId: number | null; origem: string; criadaEm: number; atualizadaEm: number }
export type NegocioKommo = { evento: string; id: number; pipelineId: number | null; statusId: number | null; statusAnteriorId: number | null; valor: number; etiquetas: string[]; responsavelId: number | null; criadoEm: number | null; atualizadoEm: number | null }

/** Etapas fixas do Kommo: 142 = ganho (venda), 143 = perdido. */
export const ETAPA_GANHO = 142
export const ETAPA_PERDIDO = 143

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() === '' ? NaN : Number(v)
  return Number.isFinite(n) ? n : null
}
const lista = (v: unknown): Obj[] => (Array.isArray(v) ? (v as Obj[]) : [])
const seg = (v: unknown) => { const n = num(v); return n === null ? null : n * 1000 }

/** `external` é o cliente; qualquer outro autor é da equipe: com usuário = atendente, sem usuário (id 0) = robô. */
export function papelDaMensagem(autorTipo: string, autorId: string): PapelMensagem {
  if (autorTipo === 'external') return 'cliente'
  return !autorId || autorId === '0' ? 'robo' : 'atendente'
}

/** Separa o que o webhook trouxe em mensagens, conversas e negócios (ids numéricos, horários em ms). */
export function lerEventoKommo(corpo: unknown): { conta: string; mensagens: MensagemKommo[]; conversas: ConversaKommo[]; negocios: NegocioKommo[] } {
  const c = (corpo && typeof corpo === 'object' ? corpo : {}) as Obj
  const mensagens: MensagemKommo[] = []
  for (const m of lista((c.message as Obj | undefined)?.add)) {
    const talkId = num(m.talk_id)
    const criadaEm = seg(m.created_at)
    if (!m.id || talkId === null || criadaEm === null) continue
    const autor = (m.author ?? {}) as Obj
    const ehNegocio = String(m.entity_type ?? '') === 'lead' || String(m.element_type ?? '') === '2'
    mensagens.push({ id: String(m.id), texto: String(m.text ?? ''), autorTipo: String(autor.type ?? ''), autorId: String(autor.id ?? ''), talkId, leadId: ehNegocio ? num(m.entity_id ?? m.element_id) : null, contatoId: num(m.contact_id), criadaEm, origem: String(m.origin ?? '') })
  }
  const conversas: ConversaKommo[] = []
  for (const evento of ['add', 'update']) {
    for (const t of lista((c.talk as Obj | undefined)?.[evento])) {
      const talkId = num(t.talk_id)
      const criadaEm = seg(t.created_at)
      if (talkId === null || criadaEm === null) continue
      conversas.push({ talkId, leadId: String(t.entity_type ?? '') === 'lead' ? num(t.entity_id) : null, contatoId: num(t.contact_id), origem: String(t.origin ?? ''), criadaEm, atualizadaEm: seg(t.updated_at) ?? criadaEm })
    }
  }
  const negocios: NegocioKommo[] = []
  for (const [evento, itens] of Object.entries((c.leads ?? {}) as Obj)) {
    for (const l of lista(itens)) {
      const id = num(l.id)
      if (id === null) continue
      negocios.push({
        evento, id, pipelineId: num(l.pipeline_id), statusId: num(l.status_id), statusAnteriorId: num(l.old_status_id),
        valor: Math.max(0, num(l.price) ?? 0), etiquetas: lista(l.tags).map((t) => String(t.name ?? '')).filter(Boolean),
        responsavelId: num(l.responsible_user_id), criadoEm: seg(l.date_create ?? l.created_at), atualizadoEm: seg(l.last_modified ?? l.updated_at),
      })
    }
  }
  return { conta: contaDoEvento(c), mensagens, conversas, negocios }
}

// ───────────────────────────── O que gravar a partir de um evento ─────────────────────────────

import { mascararTexto } from './privacidade'

export type NegocioGuardado = { id: number; client_id: string; pipeline_id: number; status_id: number | null; valor: number; etiquetas: string[]; responsavel_id: number | null; criado_em: string | null; ganho_em: string | null; perdido_em: string | null; excluido_em: string | null }
export type PlanoDoEvento = {
  negocios: (Omit<NegocioGuardado, 'etiquetas'> & { etiquetas: string[]; atualizado_em: string })[]
  excluidos: { id: number; excluido_em: string }[]
  conversas: { talk_id: number; client_id: string; lead_id: number | null; contato_id: number | null; origem: string; criada_em: string; atualizada_em: string }[]
  mensagens: { id: string; client_id: string; talk_id: number; lead_id: number | null; papel: PapelMensagem; autor_tipo: string; autor_id: string; texto: string; criada_em: string }[]
  /** Negócios que o evento cita mas que não conhecemos: a rotina busca na API para saber o funil. */
  desconhecidos: number[]
  ignorados: number
}

const iso = (ms: number) => new Date(ms).toISOString()

/** Negócio da API REST (`GET /leads/{id}`) no mesmo formato dos eventos do webhook. */
export function negocioDaApi(l: unknown): NegocioKommo | null {
  const o = (l && typeof l === 'object' ? l : {}) as Obj
  const id = num(o.id)
  if (id === null) return null
  const tags = lista(((o._embedded as Obj | undefined) ?? {}).tags)
  return { evento: 'api', id, pipelineId: num(o.pipeline_id), statusId: num(o.status_id), statusAnteriorId: null, valor: Math.max(0, num(o.price) ?? 0), etiquetas: tags.map((t) => String(t.name ?? '')).filter(Boolean), responsavelId: num(o.responsible_user_id), criadoEm: seg(o.created_at), atualizadoEm: seg(o.updated_at) }
}

/**
 * Decide o que gravar: só entram negócios, conversas e mensagens dos funis ligados a um cliente (`funis`). A venda é a
 * transição para a etapa 142 (data de ganho = hora da mudança; se o negócio sai da etapa, deixa de ser venda). O texto
 * é guardado mascarado.
 */
export function planejarEvento(e: ReturnType<typeof lerEventoKommo>, funis: Map<number, string>, guardados: Map<number, NegocioGuardado>, agora: number): PlanoDoEvento {
  const plano: PlanoDoEvento = { negocios: [], excluidos: [], conversas: [], mensagens: [], desconhecidos: [], ignorados: 0 }
  const clientePorNegocio = new Map<number, string>([...guardados].map(([id, g]) => [id, g.client_id]))
  const novos = new Map<number, PlanoDoEvento['negocios'][number]>()
  for (const n of e.negocios) {
    const antes = guardados.get(n.id)
    const cliente = (n.pipelineId !== null ? funis.get(n.pipelineId) : undefined) ?? antes?.client_id
    if (!cliente) { plano.ignorados++; continue }
    if (n.evento === 'delete') {
      if (antes) plano.excluidos.push({ id: n.id, excluido_em: iso(agora) })
      continue
    }
    const statusId = n.statusId ?? antes?.status_id ?? null
    const quando = iso(n.atualizadoEm ?? agora)
    const era = (etapa: number) => antes?.status_id === etapa
    const linha = {
      id: n.id, client_id: cliente, pipeline_id: n.pipelineId ?? antes!.pipeline_id, status_id: statusId,
      valor: n.evento === 'api' || n.valor > 0 || !antes ? n.valor : antes.valor,
      etiquetas: n.etiquetas.length ? n.etiquetas : antes?.etiquetas ?? [],
      responsavel_id: n.responsavelId ?? antes?.responsavel_id ?? null,
      criado_em: antes?.criado_em ?? (n.criadoEm !== null ? iso(n.criadoEm) : quando),
      ganho_em: statusId === ETAPA_GANHO ? (era(ETAPA_GANHO) && antes?.ganho_em ? antes.ganho_em : quando) : null,
      perdido_em: statusId === ETAPA_PERDIDO ? (era(ETAPA_PERDIDO) && antes?.perdido_em ? antes.perdido_em : quando) : null,
      excluido_em: null, atualizado_em: quando,
    }
    novos.set(n.id, linha)
    clientePorNegocio.set(n.id, cliente)
  }
  plano.negocios.push(...novos.values())
  const desconhecidos = new Set<number>()
  const clienteDoNegocio = (leadId: number | null) => {
    if (leadId === null) return undefined
    const c = clientePorNegocio.get(leadId)
    if (!c) desconhecidos.add(leadId)
    return c
  }
  for (const c of e.conversas) {
    const cliente = clienteDoNegocio(c.leadId)
    if (!cliente) { plano.ignorados++; continue }
    plano.conversas.push({ talk_id: c.talkId, client_id: cliente, lead_id: c.leadId, contato_id: c.contatoId, origem: c.origem, criada_em: iso(c.criadaEm), atualizada_em: iso(c.atualizadaEm) })
  }
  for (const m of e.mensagens) {
    const cliente = clienteDoNegocio(m.leadId)
    if (!cliente) { plano.ignorados++; continue }
    plano.mensagens.push({ id: m.id, client_id: cliente, talk_id: m.talkId, lead_id: m.leadId, papel: papelDaMensagem(m.autorTipo, m.autorId), autor_tipo: m.autorTipo, autor_id: m.autorId, texto: mascararTexto(m.texto).slice(0, 4000), criada_em: iso(m.criadaEm) })
    // Garante a conversa mesmo que o evento da conversa ainda não tenha chegado.
    if (!plano.conversas.some((c) => c.talk_id === m.talkId)) plano.conversas.push({ talk_id: m.talkId, client_id: cliente, lead_id: m.leadId, contato_id: m.contatoId, origem: m.origem, criada_em: iso(m.criadaEm), atualizada_em: iso(m.criadaEm) })
  }
  plano.desconhecidos = [...desconhecidos]
  return plano
}
