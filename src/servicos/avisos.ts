import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

/** Menção numa tarefa (comentário) ou no chat. `href` leva ao lugar; `onde` é a tarefa ou o #canal. */
export type Aviso = { id: string; href: string; onde: string; atorNome: string; criadoEm: string; lido: boolean }

export async function listarAvisos(sb: Supabase, limite = 30): Promise<Aviso[]> {
  const comChat = await sb
    .from('notifications')
    .select('id, task_id, chat_message_id, created_at, read_at, tasks(title), profiles!notifications_actor_id_fkey(full_name), chat_messages(id, parent_id, chat_channels(name))')
    .order('created_at', { ascending: false })
    .limit(limite)
  // Sem a migration do chat (coluna chat_message_id), lê só os avisos de tarefa: o layout não pode quebrar.
  const linhas = comChat.error
    ? dados(await sb.from('notifications').select('id, task_id, created_at, read_at, tasks(title), profiles!notifications_actor_id_fkey(full_name)').order('created_at', { ascending: false }).limit(limite)).map((a) => ({ ...a, chat_message_id: null, chat_messages: null }))
    : dados(comChat)
  return linhas.map((a) => ({
    id: a.id,
    href: a.task_id ? `/tarefas/${a.task_id}` : `/chat/${a.chat_messages?.chat_channels?.name ?? 'geral'}?fio=${a.chat_messages?.parent_id ?? a.chat_message_id}`,
    onde: a.task_id ? a.tasks?.title || 'uma tarefa' : `#${a.chat_messages?.chat_channels?.name ?? 'chat'}`,
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
