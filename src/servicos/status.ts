import { posicaoEntre } from '@/dominio/posicao'
import type { Categoria } from '@/dominio/tarefas'
import type { Supabase } from '@/infra/supabase/servidor'

// Escritas pelo cliente do usuário: a RLS só deixa o gestor do espaço (ou admin).

export async function criarStatus(sb: Supabase, listaId: string, nome: string, cor: string, categoria: Categoria) {
  const { data: ultimos, error: e1 } = await sb
    .from('list_statuses')
    .select('position')
    .eq('list_id', listaId)
    .order('position', { ascending: false })
    .limit(1)
  if (e1) throw e1
  const { error } = await sb
    .from('list_statuses')
    .insert({ list_id: listaId, name: nome, color: cor, category: categoria, position: posicaoEntre(ultimos[0]?.position ?? null, null) })
  if (error) throw error
}

export async function atualizarStatus(sb: Supabase, id: string, campos: { nome?: string; cor?: string; categoria?: Categoria }) {
  const { error, count } = await sb
    .from('list_statuses')
    .update({ name: campos.nome, color: campos.cor, category: campos.categoria }, { count: 'exact' })
    .eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

/** Antes de remover, as tarefas do status vão para `destinoId`. */
export async function removerStatus(sb: Supabase, id: string, destinoId: string) {
  const mover = await sb.from('tasks').update({ status_id: destinoId }).eq('status_id', id)
  if (mover.error) throw mover.error
  const { error, count } = await sb.from('list_statuses').delete({ count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

export async function reposicionarStatus(sb: Supabase, id: string, antes: string | null, depois: string | null) {
  const { error } = await sb.from('list_statuses').update({ position: posicaoEntre(antes, depois) }).eq('id', id)
  if (error) throw error
}
