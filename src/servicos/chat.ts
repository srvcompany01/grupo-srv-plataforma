import { tipoDoAnexo } from '@/dominio/anexos'
import { urlLeitura } from '@/infra/r2'
import type { Supabase } from '@/infra/supabase/servidor'
import type { AnexoComentario } from './comentarios'
import { dados } from './resultado'

// Chat da equipe com o cliente da pessoa logada: a RLS decide quais canais e mensagens ela vê.

export type Canal = { id: string; nome: string; descricao: string; privado: boolean; criadoPor: string | null; naoLidas: number }
export type Mensagem = {
  id: string
  autorId: string
  autorNome: string
  autorAvatar: string | null
  texto: string
  criadoEm: string
  editadoEm: string | null
  anexos: AnexoComentario[]
  /** Só nas mensagens principais: respostas do tópico. */
  respostas: { total: number; ultima: string | null; autores: { nome: string; avatar: string | null }[] }
}
export type NovoAnexoChat = { chave: string; nome: string; mime: string; tamanho: number }

export async function listarCanais(sb: Supabase): Promise<Canal[]> {
  const [canais, lidas] = await Promise.all([
    sb.from('chat_channels').select('id, name, description, is_private, created_by').is('archived_at', null).order('name').then(dados),
    sb.rpc('chat_nao_lidas').then(dados),
  ])
  const naoLidas = new Map((lidas ?? []).map((l) => [l.channel_id, Number(l.nao_lidas)]))
  return canais.map((c) => ({ id: c.id, nome: c.name, descricao: c.description, privado: c.is_private, criadoPor: c.created_by, naoLidas: naoLidas.get(c.id) ?? 0 }))
}

/** Total de mensagens não lidas (para o número na barra lateral). Sem a migration, 0. */
export async function totalNaoLidas(sb: Supabase): Promise<number> {
  const { data, error } = await sb.rpc('chat_nao_lidas')
  if (error) return 0
  return (data ?? []).reduce((s, l) => s + Number(l.nao_lidas), 0)
}

const CAMPOS = 'id, author_id, body, created_at, edited_at, parent_id, profiles!chat_messages_author_id_fkey(full_name, avatar_url), chat_attachments(id, r2_key, file_name, mime_type, size_bytes, arquivado_em)'
type Linha = {
  id: string; author_id: string; body: string; created_at: string; edited_at: string | null; parent_id: string | null
  profiles: { full_name: string; avatar_url: string | null } | null
  chat_attachments: { id: string; r2_key: string; file_name: string; mime_type: string; size_bytes: number; arquivado_em: string | null }[]
}
/** Anexos com link assinado (imagens abrem na tela; os demais baixam com o nome original). */
const anexosComUrl = (l: Linha) =>
  Promise.all(l.chat_attachments.map(async (a): Promise<AnexoComentario> => {
    // Arquivado pelo ciclo de renovação: mostra a imagem de "arquivado" no lugar.
    const mime = a.arquivado_em ? 'image/svg+xml' : a.mime_type
    const tipo = tipoDoAnexo(mime)
    const baixar = tipo === 'arquivo' && !mime.startsWith('image/')
    return { id: a.id, nome: a.file_name, mime, tamanho: a.size_bytes, tipo, url: await urlLeitura(a.r2_key, { download: baixar ? a.file_name : undefined, arquivado: a.arquivado_em }) }
  }))

const paraMensagem = async (l: Linha): Promise<Mensagem> => ({
  id: l.id,
  autorId: l.author_id,
  autorNome: l.profiles?.full_name ?? '',
  autorAvatar: l.profiles?.avatar_url ?? null,
  texto: l.body,
  criadoEm: l.created_at,
  editadoEm: l.edited_at,
  anexos: await anexosComUrl(l),
  respostas: { total: 0, ultima: null, autores: [] },
})

/** Últimas mensagens principais do canal (mais antigas primeiro), com o resumo das respostas de cada uma. */
export async function mensagensDoCanal(sb: Supabase, canalId: string, limite = 150): Promise<Mensagem[]> {
  const linhas = dados(await sb.from('chat_messages').select(CAMPOS).eq('channel_id', canalId).is('parent_id', null).order('created_at', { ascending: false }).limit(limite)) as Linha[]
  const msgs = await Promise.all(linhas.reverse().map(paraMensagem))
  if (!msgs.length) return msgs
  const respostas = dados(await sb.from('chat_messages').select('parent_id, created_at, profiles!chat_messages_author_id_fkey(full_name, avatar_url)').in('parent_id', msgs.map((m) => m.id)).order('created_at'))
  const porPai = new Map(msgs.map((m) => [m.id, m]))
  for (const r of respostas) {
    const m = porPai.get(r.parent_id!)
    if (!m) continue
    m.respostas.total++
    m.respostas.ultima = r.created_at
    const nome = r.profiles?.full_name ?? ''
    if (!m.respostas.autores.some((a) => a.nome === nome)) m.respostas.autores.push({ nome, avatar: r.profiles?.avatar_url ?? null })
  }
  return msgs
}

/** A mensagem principal e as respostas do tópico. */
export async function fioDaMensagem(sb: Supabase, id: string): Promise<{ principal: Mensagem; respostas: Mensagem[] } | null> {
  const principal = dados(await sb.from('chat_messages').select(CAMPOS).eq('id', id).is('parent_id', null).maybeSingle()) as Linha | null
  if (!principal) return null
  const respostas = dados(await sb.from('chat_messages').select(CAMPOS).eq('parent_id', id).order('created_at')) as Linha[]
  return { principal: await paraMensagem(principal), respostas: await Promise.all(respostas.map(paraMensagem)) }
}

export async function enviarMensagem(sb: Supabase, e: { canalId: string; paiId: string | null; texto: string; mencoes: string[]; anexos: NovoAnexoChat[] }): Promise<string> {
  const { data, error } = await sb.from('chat_messages').insert({ channel_id: e.canalId, parent_id: e.paiId, body: e.texto }).select('id').single()
  if (error) throw error
  if (e.anexos.length) {
    dados(await sb.from('chat_attachments').insert(e.anexos.map((a) => ({ message_id: data.id, channel_id: e.canalId, r2_key: a.chave, file_name: a.nome, mime_type: a.mime, size_bytes: a.tamanho }))))
  }
  if (e.mencoes.length) dados(await sb.from('chat_mentions').insert(e.mencoes.map((user_id) => ({ message_id: data.id, user_id }))))
  return data.id
}

const semPermissao = () => ({ code: '42501' })

export async function editarMensagem(sb: Supabase, id: string, texto: string): Promise<void> {
  if (!dados(await sb.from('chat_messages').update({ body: texto }).eq('id', id).select('id')).length) throw semPermissao()
}

export async function excluirMensagem(sb: Supabase, id: string): Promise<void> {
  if (!dados(await sb.from('chat_messages').delete().eq('id', id).select('id')).length) throw semPermissao()
}

export async function criarCanal(sb: Supabase, euId: string, c: { nome: string; descricao: string; privado: boolean; membros: string[] }): Promise<string> {
  const { data, error } = await sb.from('chat_channels').insert({ name: c.nome, description: c.descricao, is_private: c.privado }).select('id').single()
  if (error) throw error
  if (c.privado) dados(await sb.from('chat_members').insert([...new Set([euId, ...c.membros])].map((user_id) => ({ channel_id: data.id, user_id }))))
  return data.id
}

export async function membrosDoCanal(sb: Supabase, canalId: string): Promise<string[]> {
  return dados(await sb.from('chat_members').select('user_id').eq('channel_id', canalId)).map((m) => m.user_id)
}

/** Troca os membros de um canal privado (quem criou ou o admin). */
export async function definirMembros(sb: Supabase, canalId: string, euId: string, membros: string[]): Promise<void> {
  const atuais = await membrosDoCanal(sb, canalId)
  const quer = new Set([...membros, euId])
  const sair = atuais.filter((u) => !quer.has(u))
  const entrar = [...quer].filter((u) => !atuais.includes(u))
  if (sair.length) dados(await sb.from('chat_members').delete().eq('channel_id', canalId).in('user_id', sair))
  if (entrar.length) dados(await sb.from('chat_members').insert(entrar.map((user_id) => ({ channel_id: canalId, user_id }))))
}

export async function arquivarCanal(sb: Supabase, canalId: string): Promise<void> {
  if (!dados(await sb.from('chat_channels').update({ archived_at: new Date().toISOString() }).eq('id', canalId).select('id')).length) throw semPermissao()
}

export async function marcarCanalLido(sb: Supabase, canalId: string): Promise<void> {
  const { error } = await sb.rpc('marcar_chat_lido', { p_canal: canalId })
  if (error) throw error
}

/** Títulos das tarefas e documentos citados por link nas mensagens (a RLS só devolve o que a pessoa pode ver). */
export async function titulosReferencias(sb: Supabase, refs: { tarefas: string[]; documentos: string[] }): Promise<Record<string, string>> {
  const [t, d] = await Promise.all([
    refs.tarefas.length ? sb.from('tasks').select('id, title').in('id', refs.tarefas).then(dados) : [],
    refs.documentos.length ? sb.from('documents').select('id, title').in('id', refs.documentos).then(dados) : [],
  ])
  return Object.fromEntries([...t, ...d].map((x) => [x.id, x.title]))
}
