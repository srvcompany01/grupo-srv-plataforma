import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type Aviso = { id: string; tarefaId: string; tarefaTitulo: string; atorNome: string; criadoEm: string; lido: boolean }

export async function listarAvisos(sb: Supabase, limite = 30): Promise<Aviso[]> {
  const linhas = dados(
    await sb
      .from('notifications')
      .select('id, task_id, created_at, read_at, tasks(title), profiles!notifications_actor_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(limite),
  )
  return linhas.map((a) => ({
    id: a.id,
    tarefaId: a.task_id,
    tarefaTitulo: a.tasks?.title ?? '',
    atorNome: a.profiles?.full_name ?? '',
    criadoEm: a.created_at,
    lido: a.read_at !== null,
  }))
}

export async function contarNaoLidos(sb: Supabase): Promise<number> {
  const { count, error } = await sb.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null)
  if (error) throw error
  return count ?? 0
}

export async function marcarLido(sb: Supabase, id: string): Promise<void> {
  const { error } = await sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null)
  if (error) throw error
}

export async function marcarTodosLidos(sb: Supabase): Promise<void> {
  const { error } = await sb.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
  if (error) throw error
}
