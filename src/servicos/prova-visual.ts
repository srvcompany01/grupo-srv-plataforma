import type { ComentarioProva } from '@/dominio/prova-visual'
import type { Supabase } from '@/infra/supabase/servidor'
import { filtroDeCursor } from '@/dominio/limite'
import { dados } from './resultado'

export const CAMPOS_PROVA = 'id, version_id, parent_id, author_kind, author_name, body, media_index, x_pct, y_pct, video_second, resolved_at, resolved_by, created_at, resolvedor:profiles!content_review_comments_resolved_by_fkey(full_name)'

export type LinhaProva = {
  id: string; version_id: string; parent_id: string | null; author_kind: string; author_name: string; body: string
  media_index: number | null; x_pct: number | null; y_pct: number | null; video_second: number | null
  resolved_at: string | null; resolved_by: string | null; created_at: string; resolvedor?: { full_name: string } | null
}

export type ComentarioProvaComResolvedor = ComentarioProva & { resolvidoPorNome: string | null }

export const paraComentario = (l: LinhaProva): ComentarioProvaComResolvedor => ({
  id: l.id,
  versaoId: l.version_id,
  paiId: l.parent_id,
  autorTipo: l.author_kind === 'equipe' ? 'equipe' : 'cliente',
  autor: l.author_name,
  texto: l.body,
  midia: l.media_index,
  x: l.x_pct === null ? null : Number(l.x_pct),
  y: l.y_pct === null ? null : Number(l.y_pct),
  segundo: l.video_second === null ? null : Number(l.video_second),
  resolvidoEm: l.resolved_at,
  resolvidoPor: l.resolved_by,
  resolvidoPorNome: l.resolvedor?.full_name ?? null,
  criadoEm: l.created_at,
})

// ---------------------------------------------------------------- agência (cliente do usuário: a RLS decide)

export const PAGINA_DE_LEITURA = 200
/** Teto de leitura de UMA versão (a quota é de 100 pontos e 20 respostas do cliente por ponto; a agência responde sem teto). */
export const MAXIMO_DA_VERSAO = 3000

export type Cursor = { criadoEm: string; id: string }
export type PaginaDeComentarios = { comentarios: ComentarioProvaComResolvedor[]; /** `null` = acabou; senão, passe de volta para ler a próxima página. */ proximo: Cursor | null }

/** Uma página de uma versão, por cursor (created_at, id): ordem total e estável, comentário novo não repete nem pula linhas. */
export async function paginaDaVersao(sb: Supabase, tarefaId: string, versaoId: string, depois: Cursor | null = null, limite = PAGINA_DE_LEITURA): Promise<PaginaDeComentarios> {
  let q = sb.from('content_review_comments').select(CAMPOS_PROVA).eq('task_id', tarefaId).eq('version_id', versaoId).order('created_at').order('id').limit(limite + 1)
  const filtro = filtroDeCursor(depois)
  if (filtro) q = q.or(filtro)
  const linhas = dados(await q) as unknown as LinhaProva[]
  const pagina = linhas.slice(0, limite)
  const ultima = pagina[pagina.length - 1]
  return { comentarios: pagina.map(paraComentario), proximo: linhas.length > limite && ultima ? { criadoEm: ultima.created_at, id: ultima.id } : null }
}

/** A versão inteira (até o teto). `truncado` avisa quando passou do teto: nunca some em silêncio. */
export async function lerVersao(sb: Supabase, tarefaId: string, versaoId: string, maximo = MAXIMO_DA_VERSAO): Promise<{ comentarios: ComentarioProvaComResolvedor[]; truncado: boolean }> {
  const todos: ComentarioProvaComResolvedor[] = []
  let cursor: Cursor | null = null
  for (;;) {
    const pagina: PaginaDeComentarios = await paginaDaVersao(sb, tarefaId, versaoId, cursor, Math.min(PAGINA_DE_LEITURA, maximo - todos.length))
    todos.push(...pagina.comentarios)
    if (!pagina.proximo) return { comentarios: todos, truncado: false }
    if (todos.length >= maximo) return { comentarios: todos, truncado: true }
    cursor = pagina.proximo
  }
}

export type ResumoDaVersao = { versaoId: string; numero: number; total: number; abertos: number; resolvidos: number }

/** Totais por versão (consulta agregada, sem depender de página carregada), da mais nova para a mais antiga. */
export async function resumoDaProva(sb: Supabase, tarefaId: string): Promise<ResumoDaVersao[]> {
  const linhas = dados(await sb.rpc('resumo_prova_visual', { p_task: tarefaId }))
  return linhas.map((l) => ({ versaoId: l.version_id, numero: l.version_number, total: Number(l.total), abertos: Number(l.abertos), resolvidos: Number(l.resolvidos) }))
}

/** Quantos pontos do cliente ainda estão em aberto, por tarefa (indicador da lista e do kanban). Agregado no banco. */
export async function abertosPorTarefa(sb: Supabase, tarefaIds: string[]): Promise<Map<string, number>> {
  const mapa = new Map<string, number>()
  if (tarefaIds.length === 0) return mapa
  for (const l of dados(await sb.rpc('abertos_por_tarefa', { p_ids: tarefaIds }))) mapa.set(l.task_id, Number(l.abertos))
  return mapa
}

/** A agência responde a um ponto do cliente. O nome e o usuário vêm do banco (auth.uid()). */
export async function responderComentario(sb: Supabase, pai: { id: string; versaoId: string; tarefaId: string }, texto: string): Promise<void> {
  const corpo = texto.trim()
  if (!corpo) throw new Error('Escreva a resposta.')
  if (corpo.length > 2000) throw new Error('A resposta passou de 2000 caracteres.')
  dados(await sb.from('content_review_comments').insert({ task_id: pai.tarefaId, version_id: pai.versaoId, parent_id: pai.id, author_kind: 'equipe', author_name: 'Agência', body: corpo }))
}

/** Marca como resolvido ou reabre. A resolução fica só nos pontos do cliente (raiz). */
export async function resolverComentario(sb: Supabase, id: string, resolvido: boolean): Promise<void> {
  const { error, count } = await sb.from('content_review_comments').update({ resolved_at: resolvido ? new Date().toISOString() : null }, { count: 'exact' }).eq('id', id).is('parent_id', null)
  if (error) throw error
  if (!count) throw { code: '42501' }
}


export type RevisaoCarregada = {
  /** Totais por versão (agregados no banco), da mais nova para a mais antiga. */
  resumo: ResumoDaVersao[]
  /** Comentários da versão atual, inteiros (até o teto). */
  atual: ComentarioProvaComResolvedor[]
  truncado: boolean
}

/** O que a tela da tarefa precisa: o resumo por versão e a versão atual. As antigas vêm sob demanda (carregarVersaoProvaAcao). */
export async function revisaoDaTarefa(sb: Supabase, tarefaId: string): Promise<RevisaoCarregada> {
  const resumo = await resumoDaProva(sb, tarefaId)
  if (resumo.length === 0) return { resumo, atual: [], truncado: false }
  const { comentarios, truncado } = await lerVersao(sb, tarefaId, resumo[0].versaoId)
  return { resumo, atual: comentarios, truncado }
}
