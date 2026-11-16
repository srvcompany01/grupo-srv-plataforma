import 'server-only'
import { validarComentario, validarLocalNaMidia, type ComentarioProva, type EntradaComentario, type MidiaDaVersao } from '@/dominio/prova-visual'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { LimiteCompartilhado } from '@/dominio/limite'
import type { Supabase } from '@/infra/supabase/servidor'
import { lerVersao, paginaDaVersao, resumoDaProva, type Cursor, type PaginaDeComentarios } from './prova-visual'
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

export type VersaoAnterior = { versao: number; total: number }
export type ProvaDoCliente = {
  /** Comentários da versão atual (lida inteira, até o teto; `truncado` avisa se passou). */
  atual: ComentarioProva[]
  truncado: boolean
  /** Pontos em aberto da versão atual, contados no banco (não dependem do que foi carregado). */
  abertos: number
  /** Versões antigas: só o total; os comentários vêm sob demanda, em páginas. */
  anteriores: VersaoAnterior[]
  podeComentar: boolean
}

const SEM_PROVA: ProvaDoCliente = { atual: [], truncado: false, abertos: 0, anteriores: [], podeComentar: false }

/** Comentários do post para o cliente do link: a versão atual inteira e, das anteriores, só os totais (o histórico se pagina sob demanda). */
export async function comentariosParaCliente(clienteId: string, tarefaId: string): Promise<ProvaDoCliente> {
  const post = await postDoLink(clienteId, tarefaId)
  if (!post) return SEM_PROVA
  const admin = criarClienteAdmin() as unknown as Supabase
  const resumo = await resumoDaProva(admin, tarefaId)
  const atual = resumo.find((r) => r.numero === post.current_version)
  const { comentarios, truncado } = atual ? await lerVersao(admin, tarefaId, atual.versaoId) : { comentarios: [], truncado: false }
  return {
    atual: comentarios,
    truncado,
    abertos: atual?.abertos ?? 0,
    anteriores: resumo.filter((r) => r.numero !== post.current_version && r.total > 0).map((r) => ({ versao: r.numero, total: r.total })),
    podeComentar: post.approval === 'aguardando',
  }
}

/** Uma página do histórico de uma versão ANTERIOR (só leitura), com cursor para a próxima. */
export async function paginaDoHistorico(clienteId: string, tarefaId: string, versao: number, depois: Cursor | null): Promise<PaginaDeComentarios | null> {
  const post = await postDoLink(clienteId, tarefaId)
  if (!post || !Number.isInteger(versao) || versao < 1 || versao >= post.current_version) return null
  const admin = criarClienteAdmin() as unknown as Supabase
  const { data } = await criarClienteAdmin().from('content_versions').select('id').eq('task_id', tarefaId).eq('number', versao).maybeSingle()
  if (!data) return null
  return paginaDaVersao(admin, tarefaId, data.id, depois)
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
