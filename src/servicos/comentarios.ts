import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type Comentario = {
  id: string
  autorId: string
  autorNome: string
  texto: string
  interno: boolean
  criadoEm: string
  editadoEm: string | null
}

export async function listarComentarios(sb: Supabase, tarefaId: string): Promise<Comentario[]> {
  const linhas = dados(
    await sb
      .from('comments')
      .select('id, author_id, body, is_internal, created_at, edited_at, profiles(full_name)')
      .eq('task_id', tarefaId)
      .order('created_at'),
  )
  return linhas.map((c) => ({
    id: c.id,
    autorId: c.author_id,
    autorNome: c.profiles?.full_name ?? '',
    texto: c.body,
    interno: c.is_internal,
    criadoEm: c.created_at,
    editadoEm: c.edited_at,
  }))
}

export async function comentar(sb: Supabase, tarefaId: string, texto: string, interno: boolean) {
  const { error } = await sb.from('comments').insert({ task_id: tarefaId, body: texto, is_internal: interno })
  if (error) throw error
}

export async function editarComentario(sb: Supabase, id: string, texto: string) {
  const { error, count } = await sb.from('comments').update({ body: texto }, { count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

export async function apagarComentario(sb: Supabase, id: string) {
  const { error, count } = await sb.from('comments').delete({ count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}
