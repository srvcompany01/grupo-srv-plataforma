import type { ComentarioProva } from '@/dominio/prova-visual'
import type { Supabase } from '@/infra/supabase/servidor'
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

/** Comentários de todas as versões do post, mais antigos primeiro. */
export async function comentariosDoPost(sb: Supabase, tarefaId: string): Promise<ComentarioProvaComResolvedor[]> {
  const linhas = dados(await sb.from('content_review_comments').select(CAMPOS_PROVA).eq('task_id', tarefaId).order('created_at')) as unknown as LinhaProva[]
  return linhas.map(paraComentario)
}

/** Quantos pontos do cliente ainda estão em aberto, por tarefa (indicador da lista e do kanban). */
export async function abertosPorTarefa(sb: Supabase, tarefaIds: string[]): Promise<Map<string, number>> {
  const mapa = new Map<string, number>()
  if (tarefaIds.length === 0) return mapa
  const linhas = dados(await sb.from('content_review_comments').select('task_id').in('task_id', tarefaIds).is('parent_id', null).is('resolved_at', null))
  for (const l of linhas) mapa.set(l.task_id, (mapa.get(l.task_id) ?? 0) + 1)
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

