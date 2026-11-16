import 'server-only'
import { validarComentario, validarLocalNaMidia, type ComentarioProva, type EntradaComentario, type MidiaDaVersao } from '@/dominio/prova-visual'
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
  // O local precisa existir na versão: mídia (como o portal as mostra) e, para instante, ser vídeo.
  if (!e.paiId && e.midia !== null) {
    const { data: midias, error: erroMidias } = await admin.from('content_media').select('kind, arquivado_em').eq('version_id', versao.id).order('position')
    if (erroMidias) throw erroMidias
    const lista: MidiaDaVersao[] = (midias ?? []).map((m) => ({ tipo: !m.arquivado_em && m.kind === 'video' ? 'video' : 'imagem' }))
    const problema = validarLocalNaMidia(e, lista)
    if (problema) throw new Error(problema)
  }
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
  // Aviso para a equipe: um por tarefa, versão e janela de 30 minutos, com identificador estruturado e upsert atômico no banco
  // (função registrar_aviso_prova). Resposta do cliente a um comentário não gera aviso.
  if (e.paiId) return
  const { error: erroAviso } = await admin.rpc('registrar_aviso_prova', { p_task: tarefaId, p_version: versao.id, p_nome: e.nome.trim(), p_texto: e.texto })
  // O comentário já foi gravado: uma falha no aviso não pode desfazer nem esconder isso do cliente.
  if (erroAviso) console.error(erroAviso)
}
