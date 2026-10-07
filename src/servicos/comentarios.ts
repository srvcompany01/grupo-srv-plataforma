import { tipoDoAnexo, type TipoAnexo } from '@/dominio/anexos'
import { urlLeitura } from '@/infra/r2'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type AnexoComentario = { id: string; nome: string; mime: string; tamanho: number; tipo: TipoAnexo; url: string }
export type NovoAnexo = { chave: string; nome: string; mime: string; tamanho: number }

export type Comentario = {
  id: string
  autorId: string
  autorNome: string
  texto: string
  interno: boolean
  criadoEm: string
  editadoEm: string | null
  mencoes: string[]
  anexos: AnexoComentario[]
}

export async function listarComentarios(sb: Supabase, tarefaId: string): Promise<Comentario[]> {
  const linhas = dados(
    await sb
      .from('comments')
      .select(
        `id, author_id, body, is_internal, created_at, edited_at, profiles!comments_author_id_fkey(full_name),
         comment_mentions(user_id),
         comment_attachments(id, r2_key, file_name, mime_type, size_bytes, kind, created_at)`,
      )
      .eq('task_id', tarefaId)
      .order('created_at'),
  )
  return Promise.all(
    linhas.map(async (c) => ({
      id: c.id,
      autorId: c.author_id,
      autorNome: c.profiles?.full_name ?? '',
      texto: c.body,
      interno: c.is_internal,
      criadoEm: c.created_at,
      editadoEm: c.edited_at,
      mencoes: c.comment_mentions.map((m) => m.user_id),
      anexos: await Promise.all(
        [...c.comment_attachments]
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map(async (a): Promise<AnexoComentario> => {
            const tipo = tipoDoAnexo(a.mime_type)
            const baixar = tipo === 'arquivo' && !a.mime_type.startsWith('image/')
            return {
              id: a.id,
              nome: a.file_name,
              mime: a.mime_type,
              tamanho: a.size_bytes,
              tipo,
              url: await urlLeitura(a.r2_key, baixar ? { download: a.file_name } : {}),
            }
          }),
      ),
    })),
  )
}

/** Cria o comentário, as menções e os anexos numa transação (RPC); falhou, nada fica gravado. */
export async function criarComentario(
  sb: Supabase,
  c: { tarefaId: string; texto: string; interno: boolean; mencoes: string[]; anexos: NovoAnexo[] },
): Promise<void> {
  const { error } = await sb.rpc('criar_comentario', {
    p_task: c.tarefaId,
    p_body: c.texto,
    p_internal: c.interno,
    p_mencoes: c.mencoes,
    p_anexos: c.anexos.map((a) => ({
      r2_key: a.chave,
      file_name: a.nome,
      mime_type: a.mime,
      size_bytes: a.tamanho,
      kind: tipoDoAnexo(a.mime),
    })),
  })
  if (error) throw error
}

export async function pessoasDaTarefa(sb: Supabase, tarefaId: string): Promise<{ id: string; nome: string; avatar: string | null }[]> {
  const linhas = dados(await sb.rpc('pessoas_da_tarefa', { p_task: tarefaId }))
  return linhas.map((p) => ({ id: p.id, nome: p.full_name, avatar: p.avatar_url }))
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
