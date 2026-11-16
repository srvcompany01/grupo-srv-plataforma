import 'server-only'
import { validarComentario, type ComentarioProva, type EntradaComentario } from '@/dominio/prova-visual'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { LimiteCompartilhado } from '@/dominio/limite'
import type { Supabase } from '@/infra/supabase/servidor'
import { lerComentarios } from './prova-visual'
import { dados } from './resultado'

// ---------------------------------------------------------------- portal do cliente (chave mestra, sempre filtrando pelo cliente do link)

/** O post é deste cliente e já foi enviado a ele? Devolve a tarefa, a versão atual e se ainda aceita comentários. */
async function postDoLink(clienteId: string, tarefaId: string) {
  const { data } = await criarClienteAdmin()
    .from('content_posts')
    .select('task_id, approval, current_version, tasks!inner(client_id, archived_at)')
    .eq('task_id', tarefaId)
    .eq('tasks.client_id', clienteId)
    .is('tasks.archived_at', null)
    .neq('approval', 'rascunho')
    .maybeSingle()
  return data
}

export type ProvaDoCliente = { atual: ComentarioProva[]; anteriores: { versao: number; comentarios: ComentarioProva[] }[]; podeComentar: boolean }

/** Comentários do post para o cliente do link: os da versão atual e, recolhidos, os das anteriores (só leitura). */
export async function comentariosParaCliente(clienteId: string, tarefaId: string): Promise<ProvaDoCliente> {
  const post = await postDoLink(clienteId, tarefaId)
  if (!post) return { atual: [], anteriores: [], podeComentar: false }
  const admin = criarClienteAdmin()
  const [versoes, todos] = await Promise.all([
    admin.from('content_versions').select('id, number').eq('task_id', tarefaId),
    lerComentarios(admin as unknown as Supabase, tarefaId), // páginas por cursor, com teto
  ])
  const numeroDa = new Map(dados(versoes).map((v) => [v.id, v.number]))
  const atual = todos.filter((c) => numeroDa.get(c.versaoId) === post.current_version)
  const anteriores = [...new Set(todos.map((c) => numeroDa.get(c.versaoId) ?? 0))]
    .filter((n) => n !== post.current_version)
    .sort((x, y) => y - x)
    .map((versao) => ({ versao, comentarios: todos.filter((c) => numeroDa.get(c.versaoId) === versao) }))
  return { atual, anteriores, podeComentar: post.approval === 'aguardando' }
}

/** Consome os limites compartilhados (no banco). false = passou de algum. Se o banco falhar, recusa (não deixa passar sem contar). */
export async function dentroDosLimites(limites: LimiteCompartilhado[]): Promise<boolean> {
  const admin = criarClienteAdmin()
  for (const l of limites) {
    const { data, error } = await admin.rpc('consumir_limite', { p_chave: l.chave, p_max: l.max, p_janela_segundos: l.janelaSegundos })
    if (error) {
      console.error(error)
      return false
    }
    if (!data) return false
  }
  return true
}

/**
 * O cliente do link comenta (ponto, instante ou geral) ou responde à agência. Quem decide a versão é o servidor:
 * nunca a que vier do navegador. O banco recusa se a versão já foi respondida.
 */
export async function comentarComoCliente(clienteId: string, tarefaId: string, e: EntradaComentario & { paiId?: string | null }): Promise<void> {
  const erro = validarComentario(e)
  if (erro) throw new Error(erro)
  const post = await postDoLink(clienteId, tarefaId)
  if (!post) throw new Error('Post não encontrado.')
  if (post.approval !== 'aguardando') throw new Error('Esta versão já foi respondida: os comentários ficam só para leitura.')
  const admin = criarClienteAdmin()
  const { data: versao, error } = await admin.from('content_versions').select('id').eq('task_id', tarefaId).eq('number', post.current_version).single()
  if (error) throw error
  if (e.paiId) {
    const { data: pai } = await admin.from('content_review_comments').select('id').eq('id', e.paiId).eq('task_id', tarefaId).eq('version_id', versao.id).maybeSingle()
    if (!pai) throw new Error('Comentário não encontrado.')
  }
  dados(
    await admin.from('content_review_comments').insert({
      task_id: tarefaId,
      version_id: versao.id,
      parent_id: e.paiId ?? null,
      author_kind: 'cliente',
      author_name: e.nome.trim().slice(0, 80),
      body: e.texto.trim(),
      media_index: e.paiId ? null : e.midia,
      x_pct: e.paiId ? null : e.x,
      y_pct: e.paiId ? null : e.y,
      video_second: e.paiId ? null : e.segundo,
    }),
  )
  // Aviso para a equipe: um por vez. Marcações seguidas do mesmo cliente na mesma versão viram um aviso só, que vai contando.
  if (e.paiId) return
  const { data: tarefa } = await admin.from('tasks').select('created_by, task_assignees(user_id)').eq('id', tarefaId).single()
  const autor = tarefa?.created_by ?? tarefa?.task_assignees[0]?.user_id
  if (!autor) return
  const nome = e.nome.trim()
  const desde = new Date(Date.now() - 30 * 60_000).toISOString()
  const { data: aviso } = await admin.from('comments').select('id, created_at').eq('task_id', tarefaId).eq('author_id', autor).like('body', '💬 O cliente (%) na prova visual%').gte('created_at', desde).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (aviso) {
    const { count } = await admin.from('content_review_comments').select('id', { count: 'exact', head: true }).eq('version_id', versao.id).is('parent_id', null).eq('author_kind', 'cliente').gte('created_at', aviso.created_at)
    await admin.from('comments').update({ body: `💬 O cliente (${nome}) fez ${Math.max(2, count ?? 2)} comentários na prova visual. Último: ${e.texto.trim().slice(0, 160)}` }).eq('id', aviso.id)
    return
  }
  await admin.from('comments').insert({ task_id: tarefaId, author_id: autor, body: `💬 O cliente (${nome}) comentou na prova visual: ${e.texto.trim().slice(0, 200)}`, is_internal: false })
}
