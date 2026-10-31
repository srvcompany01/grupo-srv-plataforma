import type { Supabase } from '@/infra/supabase/servidor'
import { aplicarEtapaDoPost } from './etapa-post'
import 'server-only'
import type { Aprovacao, Decisao, Formato } from '@/dominio/conteudo'
import type { Alvo, ModoPublicacao, StatusPublicacao } from '@/dominio/publicacao'
import { urlLeitura } from '@/infra/r2'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { dados } from './resultado'
import { publicarPost } from './publicacao-meta'

/**
 * Página do cliente pelo link (sem login): app.gruposrv.com.br/cliente/<nome>-<código>. O servidor lê e grava com a
 * chave mestra, SEMPRE filtrando pelo cliente do link (resolvido aqui, nunca vindo da tela).
 * O cliente vê os posts que já foram enviados para ele (tudo menos rascunho) e os documentos liberados.
 */

export type ClienteDoLink = { id: string; nome: string; slug: string; metaPaginaId: string | null; metaContaId: string | null }

export async function clientePorLink(slug: string): Promise<ClienteDoLink | null> {
  if (!/^[a-z0-9][a-z0-9-]{2,60}$/.test(slug)) return null
  const { data } = await criarClienteAdmin().from('clients').select('id, name, portal_slug, meta_page_id, meta_ad_account_id').eq('portal_slug', slug).neq('status', 'encerrado').maybeSingle()
  return data ? { id: data.id, nome: data.name, slug: data.portal_slug, metaPaginaId: data.meta_page_id, metaContaId: data.meta_ad_account_id } : null
}

/** Documentos que a equipe liberou para o cliente. */
export async function documentosDoCliente(clienteId: string): Promise<{ id: string; titulo: string; atualizadoEm: string }[]> {
  const linhas = dados(await criarClienteAdmin().from('documents').select('id, title, updated_at').eq('client_id', clienteId).eq('client_visible', true).is('archived_at', null).order('updated_at', { ascending: false }))
  return linhas.map((d) => ({ id: d.id, titulo: d.title, atualizadoEm: d.updated_at }))
}

/** O documento só abre se for deste cliente e estiver liberado para ele. */
export async function documentoLiberado(clienteId: string, documentoId: string): Promise<boolean> {
  const { data } = await criarClienteAdmin().from('documents').select('id').eq('id', documentoId).eq('client_id', clienteId).eq('client_visible', true).is('archived_at', null).maybeSingle()
  return !!data
}

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
  /** @ convidados para a collab no Instagram. */
  collabs: string[]
  respostas: { versao: number; decisao: Decisao; comentario: string; nome: string; em: string }[]
}

/** Link do cliente de quem entra pelo login antigo do portal (o primeiro vínculo). */
export async function linkDoUsuario(usuarioId: string): Promise<string | null> {
  const { data } = await criarClienteAdmin().from('client_users').select('clients(portal_slug)').eq('user_id', usuarioId).limit(1).maybeSingle()
  return data?.clients?.portal_slug ?? null
}

const CAMPOS = `task_id, format, approval, current_version, publish_at, publish_targets, publish_mode, publish_status, ig_permalink, fb_permalink, collaborators,
  tasks!inner(title, client_id, archived_at),
  content_versions(number, caption, content_media(kind, r2_key, position, arquivado_em), content_responses(decision, comment, responder_name, created_at))`

type Linha = {
  task_id: string; format: string; approval: string; current_version: number; publish_at: string | null; publish_targets: string[]; publish_mode: string; publish_status: string
  ig_permalink: string | null; fb_permalink: string | null; collaborators: string[] | null
  tasks: { title: string; client_id: string | null; archived_at: string | null }
  content_versions: { number: number; caption: string; content_media: { kind: string; r2_key: string; position: number; arquivado_em: string | null }[]; content_responses: { decision: string; comment: string; responder_name: string; created_at: string } | null }[]
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
    midias: await Promise.all(midias.map(async (m) => ({ tipo: (m.arquivado_em ? 'imagem' : m.kind) as 'imagem' | 'video', url: await urlLeitura(m.r2_key, { arquivado: m.arquivado_em }) }))),
    publicarEm: l.publish_at,
    alvos: l.publish_targets as Alvo[],
    modo: l.publish_mode as ModoPublicacao,
    status: l.publish_status as StatusPublicacao,
    igLink: l.ig_permalink,
    fbLink: l.fb_permalink,
    collabs: l.collaborators ?? [],
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
export async function responderPost(clienteId: string, nome: string, tarefaId: string, decisao: Decisao, comentario: string): Promise<{ publicado?: boolean }> {
  const admin = criarClienteAdmin()
  const post = await postDoCliente(clienteId, tarefaId)
  if (!post) throw new Error('Post não encontrado.')
  if (post.aprovacao !== 'aguardando') throw new Error('Este post já foi respondido.')
  const { data: versao, error } = await admin.from('content_versions').select('id').eq('task_id', tarefaId).eq('number', post.versao).single()
  if (error) throw error
  dados(await admin.from('content_responses').insert({ version_id: versao.id, task_id: tarefaId, decision: decisao, comment: comentario, responder_name: nome }))
  dados(await admin.from('content_posts').update({ approval: decisao }).eq('task_id', tarefaId).eq('approval', 'aguardando').select('task_id'))
  // O cliente aprovou: o post segue para o agendamento (o campo "Etapa" vira Agendado).
  if (decisao === 'aprovado') await aplicarEtapaDoPost(admin as unknown as Supabase, tarefaId, 'agendado')
  // Sem login, o comentário sai em nome de quem criou a tarefa (ou do primeiro responsável), dizendo que foi o cliente.
  const texto = decisao === 'aprovado' ? `✅ O cliente (${nome}) aprovou a versão ${post.versao} pelo link.` : `✏️ O cliente (${nome}) pediu ajuste na versão ${post.versao}: ${comentario}`
  const { data: tarefa } = await admin.from('tasks').select('created_by, task_assignees(user_id)').eq('id', tarefaId).single()
  const autor = tarefa?.created_by ?? tarefa?.task_assignees[0]?.user_id
  if (autor) await admin.from('comments').insert({ task_id: tarefaId, author_id: autor, body: texto, is_internal: false })
  if (decisao === 'aprovado' && post.status === 'agendado' && post.publicarEm && Date.parse(post.publicarEm) <= Date.now()) {
    return { publicado: (await publicarPost(tarefaId)).status === 'publicado' }
  }
  return {}
}
