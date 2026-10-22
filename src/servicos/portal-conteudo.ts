import 'server-only'
import type { Aprovacao, Decisao, Formato } from '@/dominio/conteudo'
import type { Alvo, ModoPublicacao, StatusPublicacao } from '@/dominio/publicacao'
import { urlLeitura } from '@/infra/r2'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { dados } from './resultado'
import { publicarPost } from './publicacao-meta'

/**
 * Posts de conteúdo no portal do cliente. As tabelas de conteúdo são só da equipe (RLS), então o servidor lê e grava
 * com a chave mestra, SEMPRE filtrando pelo cliente do usuário logado (vem de client_users, não da tela).
 * O cliente vê o que já foi enviado para ele (tudo menos rascunho).
 */

export type MidiaPortal = { tipo: 'imagem' | 'video'; url: string }
export type PostPortal = {
  id: string
  titulo: string
  formato: Formato
  aprovacao: Aprovacao
  versao: number
  legenda: string
  midias: MidiaPortal[]
  publicarEm: string | null
  alvos: Alvo[]
  modo: ModoPublicacao
  status: StatusPublicacao
  igLink: string | null
  fbLink: string | null
  respostas: { versao: number; decisao: Decisao; comentario: string; nome: string; em: string }[]
}

/** Cliente do usuário do portal (o primeiro vínculo). */
export async function clienteDoUsuario(usuarioId: string): Promise<{ id: string; nome: string } | null> {
  const { data } = await criarClienteAdmin().from('client_users').select('client_id, clients(name)').eq('user_id', usuarioId).limit(1).maybeSingle()
  return data ? { id: data.client_id, nome: data.clients?.name ?? '' } : null
}

const CAMPOS = `task_id, format, approval, current_version, publish_at, publish_targets, publish_mode, publish_status, ig_permalink, fb_permalink,
  tasks!inner(title, client_id, archived_at),
  content_versions(number, caption, content_media(kind, r2_key, position), content_responses(decision, comment, responder_name, created_at))`

type Linha = {
  task_id: string; format: string; approval: string; current_version: number; publish_at: string | null; publish_targets: string[]; publish_mode: string; publish_status: string
  ig_permalink: string | null; fb_permalink: string | null
  tasks: { title: string; client_id: string | null; archived_at: string | null }
  content_versions: { number: number; caption: string; content_media: { kind: string; r2_key: string; position: number }[]; content_responses: { decision: string; comment: string; responder_name: string; created_at: string } | null }[]
}

async function paraPost(l: Linha, comMidias: 'todas' | 'capa'): Promise<PostPortal> {
  const atual = l.content_versions.find((v) => v.number === l.current_version)
  const midias = [...(atual?.content_media ?? [])].sort((a, b) => a.position - b.position).slice(0, comMidias === 'capa' ? 1 : 10)
  return {
    id: l.task_id,
    titulo: l.tasks.title,
    formato: l.format as Formato,
    aprovacao: l.approval as Aprovacao,
    versao: l.current_version,
    legenda: atual?.caption ?? '',
    midias: await Promise.all(midias.map(async (m) => ({ tipo: m.kind as 'imagem' | 'video', url: await urlLeitura(m.r2_key) }))),
    publicarEm: l.publish_at,
    alvos: l.publish_targets as Alvo[],
    modo: l.publish_mode as ModoPublicacao,
    status: l.publish_status as StatusPublicacao,
    igLink: l.ig_permalink,
    fbLink: l.fb_permalink,
    respostas: l.content_versions
      .filter((v) => v.content_responses)
      .map((v) => ({ versao: v.number, decisao: v.content_responses!.decision as Decisao, comentario: v.content_responses!.comment, nome: v.content_responses!.responder_name, em: v.content_responses!.created_at }))
      .sort((a, b) => b.versao - a.versao),
  }
}

/** Posts do cliente que já foram enviados a ele: os que esperam resposta primeiro. */
export async function postsDoCliente(clienteId: string): Promise<PostPortal[]> {
  const linhas = dados(await criarClienteAdmin().from('content_posts').select(CAMPOS).eq('tasks.client_id', clienteId).is('tasks.archived_at', null).neq('approval', 'rascunho').order('publish_at', { ascending: false, nullsFirst: false }).limit(60)) as unknown as Linha[]
  const posts = await Promise.all(linhas.map((l) => paraPost(l, 'capa')))
  return posts.sort((a, b) => Number(b.aprovacao === 'aguardando') - Number(a.aprovacao === 'aguardando'))
}

export async function postDoCliente(clienteId: string, tarefaId: string): Promise<PostPortal | null> {
  const linha = dados(await criarClienteAdmin().from('content_posts').select(CAMPOS).eq('task_id', tarefaId).eq('tasks.client_id', clienteId).is('tasks.archived_at', null).neq('approval', 'rascunho').maybeSingle()) as unknown as Linha | null
  return linha ? paraPost(linha, 'todas') : null
}

/**
 * Resposta do cliente à versão atual: grava a resposta, muda a aprovação, deixa um comentário na tarefa para a equipe
 * e, se aprovou e o horário já passou, publica na hora.
 */
export async function responderPost(clienteId: string, usuario: { id: string; nome: string }, tarefaId: string, decisao: Decisao, comentario: string): Promise<{ publicado?: boolean }> {
  const admin = criarClienteAdmin()
  const post = await postDoCliente(clienteId, tarefaId)
  if (!post) throw new Error('Post não encontrado.')
  if (post.aprovacao !== 'aguardando') throw new Error('Este post já foi respondido.')
  const { data: versao, error } = await admin.from('content_versions').select('id').eq('task_id', tarefaId).eq('number', post.versao).single()
  if (error) throw error
  dados(await admin.from('content_responses').insert({ version_id: versao.id, task_id: tarefaId, decision: decisao, comment: comentario, responder_name: usuario.nome || 'Cliente' }))
  dados(await admin.from('content_posts').update({ approval: decisao }).eq('task_id', tarefaId).eq('approval', 'aguardando').select('task_id'))
  const texto = decisao === 'aprovado' ? `✅ Aprovou a versão ${post.versao} do post pelo portal.` : `✏️ Pediu ajuste na versão ${post.versao} pelo portal: ${comentario}`
  await admin.from('comments').insert({ task_id: tarefaId, author_id: usuario.id, body: texto, is_internal: false })
  if (decisao === 'aprovado' && post.status === 'agendado' && post.publicarEm && Date.parse(post.publicarEm) <= Date.now()) {
    return { publicado: (await publicarPost(tarefaId)).status === 'publicado' }
  }
  return {}
}
