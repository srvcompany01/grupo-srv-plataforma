import { MODELOS_DOCUMENTO, conteudoDoModelo } from '@/dominio/documento-modelos'
import type { PaginaDocumento, PessoaDocumento, ResumoDocumento, Visibilidade } from '@/dominio/documentos'
import { posicaoEntre } from '@/dominio/posicao'
import type { Json, TablesUpdate } from '@/infra/supabase/tipos'
import type { Supabase } from '@/infra/supabase/servidor'

const COLUNAS_RESUMO =
  'id, title, icon, owner_id, visibility, client_id, client_visible, is_wiki, archived_at, updated_at, owner:profiles!documents_owner_id_fkey(full_name), client:clients(name), document_lists(list:lists(id, name)), document_favorites(user_id), document_views(viewed_at)'

type LinhaResumo = {
  id: string
  title: string
  icon: string | null
  owner_id: string
  visibility: string
  client_id: string | null
  client_visible: boolean
  is_wiki: boolean
  archived_at: string | null
  updated_at: string
  owner: { full_name: string } | null
  client: { name: string } | null
  document_lists: { list: { id: string; name: string } | null }[]
  document_favorites: unknown[]
  document_views: { viewed_at: string }[]
}

function paraResumo(l: LinhaResumo): ResumoDocumento {
  return {
    id: l.id,
    titulo: l.title,
    icone: l.icon,
    donoId: l.owner_id,
    donoNome: l.owner?.full_name ?? '—',
    visibilidade: l.visibility as Visibilidade,
    clienteId: l.client_id,
    clienteNome: l.client?.name ?? null,
    clienteVisivel: l.client_visible,
    wiki: l.is_wiki,
    arquivadoEm: l.archived_at,
    atualizadoEm: l.updated_at,
    visualizadoEm: l.document_views[0]?.viewed_at ?? null,
    favorito: l.document_favorites.length > 0,
    listas: l.document_lists.flatMap((v) => (v.list ? [{ id: v.list.id, nome: v.list.name }] : [])),
  }
}

/** Documentos que a pessoa pode ver (a RLS decide). Favoritos e visualizações vêm só da própria pessoa. */
export async function listarDocumentos(sb: Supabase): Promise<ResumoDocumento[]> {
  const { data, error } = await sb.from('documents').select(COLUNAS_RESUMO).order('updated_at', { ascending: false }).limit(1000)
  if (error) throw error
  return (data as unknown as LinhaResumo[]).map(paraResumo)
}

/** Documentos ligados a uma lista. */
export async function listarDocumentosDaLista(sb: Supabase, listaId: string): Promise<ResumoDocumento[]> {
  const { data, error } = await sb.from('document_lists').select('document_id').eq('list_id', listaId)
  if (error) throw error
  const ids = data.map((v) => v.document_id)
  if (!ids.length) return []
  const { data: docs, error: e2 } = await sb.from('documents').select(COLUNAS_RESUMO).in('id', ids).is('archived_at', null).order('updated_at', { ascending: false })
  if (e2) throw e2
  return (docs as unknown as LinhaResumo[]).map(paraResumo)
}

export async function buscarDocumento(sb: Supabase, id: string): Promise<{ resumo: ResumoDocumento; paginas: PaginaDocumento[]; pessoas: PessoaDocumento[] } | null> {
  const { data, error } = await sb.from('documents').select(COLUNAS_RESUMO).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const [paginas, membros] = await Promise.all([
    sb.from('document_pages').select('id, parent_id, title, icon, position').eq('document_id', id),
    sb.from('document_members').select('user_id, can_edit, pessoa:profiles(full_name)').eq('document_id', id),
  ])
  if (paginas.error) throw paginas.error
  return {
    resumo: paraResumo(data as unknown as LinhaResumo),
    paginas: paginas.data.map((p) => ({ id: p.id, paiId: p.parent_id, titulo: p.title, icone: p.icon, posicao: p.position })),
    // Cliente não lê a lista de pessoas (RLS): vem vazia.
    pessoas: (membros.data ?? []).map((m) => ({ id: m.user_id, nome: (m.pessoa as unknown as { full_name: string } | null)?.full_name ?? '—', podeEditar: m.can_edit })),
  }
}

export type PaginaCompleta = {
  id: string
  documentoId: string
  titulo: string
  conteudo: Json | null
  ydoc: string | null
  baseUpdate: number
  alteracoes: { id: number; data: string }[]
}

/** Página com o estado do editor e as alterações ainda não compactadas (para o editor reconstruir o texto). */
export async function buscarPagina(sb: Supabase, paginaId: string, comAlteracoes = true): Promise<PaginaCompleta | null> {
  const { data, error } = await sb.from('document_pages').select('id, document_id, title, content, ydoc, base_update').eq('id', paginaId).maybeSingle()
  if (error) throw error
  if (!data) return null
  let alteracoes: { id: number; data: string }[] = []
  if (comAlteracoes) {
    const { data: ups, error: e2 } = await sb.from('document_updates').select('id, data').eq('page_id', paginaId).gt('id', data.base_update).order('id')
    if (e2) throw e2
    alteracoes = ups
  }
  return { id: data.id, documentoId: data.document_id, titulo: data.title, conteudo: data.content, ydoc: data.ydoc, baseUpdate: data.base_update, alteracoes }
}

export async function criarDocumento(
  sb: Supabase,
  eu: string,
  opcoes: { titulo?: string; texto?: string; modelo?: string; listaId?: string; clienteId?: string | null; clienteVisivel?: boolean; visibilidade?: Visibilidade },
): Promise<string> {
  const modelo = MODELOS_DOCUMENTO.find((m) => m.id === opcoes.modelo) ?? MODELOS_DOCUMENTO[0]
  const titulo = opcoes.titulo?.trim() || modelo.titulo
  const { data, error } = await sb
    .from('documents')
    .insert({ title: titulo, owner_id: eu, is_wiki: !!modelo.wiki, visibility: opcoes.visibilidade ?? 'team', client_id: opcoes.clienteId ?? null, client_visible: !!opcoes.clienteId && !!opcoes.clienteVisivel })
    .select('id')
    .single()
  if (error) throw error
  let anterior: string | null = null
  for (const [i, pagina] of modelo.paginas.entries()) {
    const posicao = posicaoEntre(anterior, null)
    anterior = posicao
    const { error: e2 } = await sb.from('document_pages').insert({
      document_id: data.id,
      title: i === 0 && !modelo.paginas[0].titulo ? '' : pagina.titulo,
      position: posicao,
      content: i === 0 && opcoes.texto ? (conteudoDoModelo(opcoes.texto) as Json) : pagina.texto ? (conteudoDoModelo(pagina.texto) as Json) : null,
    })
    if (e2) throw e2
  }
  if (opcoes.listaId) await vincularLista(sb, data.id, opcoes.listaId)
  return data.id
}

export type CamposDocumento = { titulo?: string; icone?: string | null; arquivado?: boolean; visibilidade?: Visibilidade; clienteId?: string | null; clienteVisivel?: boolean; wiki?: boolean }

export async function atualizarDocumento(sb: Supabase, id: string, c: CamposDocumento): Promise<void> {
  const mudanca: TablesUpdate<'documents'> = {}
  if (c.titulo !== undefined) mudanca.title = c.titulo.trim()
  if (c.icone !== undefined) mudanca.icon = c.icone
  if (c.arquivado !== undefined) mudanca.archived_at = c.arquivado ? new Date().toISOString() : null
  if (c.visibilidade !== undefined) mudanca.visibility = c.visibilidade
  if (c.clienteId !== undefined) {
    mudanca.client_id = c.clienteId
    if (c.clienteId === null) mudanca.client_visible = false
  }
  if (c.clienteVisivel !== undefined) mudanca.client_visible = c.clienteVisivel
  if (c.wiki !== undefined) mudanca.is_wiki = c.wiki
  const { data, error } = await sb.from('documents').update(mudanca).eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('Documento não encontrado ou sem permissão')
}

export async function excluirDocumento(sb: Supabase, id: string): Promise<void> {
  const { data, error } = await sb.from('documents').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('Só o dono pode excluir o documento')
}

/** Troca as pessoas do documento: quem sai da lista perde o acesso (quando o documento não é da equipe toda). */
export async function definirPessoas(sb: Supabase, id: string, pessoas: { id: string; podeEditar: boolean }[]): Promise<void> {
  const { error: e1 } = await sb.from('document_members').delete().eq('document_id', id)
  if (e1) throw e1
  if (!pessoas.length) return
  const { error } = await sb.from('document_members').insert(pessoas.map((p) => ({ document_id: id, user_id: p.id, can_edit: p.podeEditar })))
  if (error) throw error
}

export async function vincularLista(sb: Supabase, documentoId: string, listaId: string): Promise<void> {
  const { error } = await sb.from('document_lists').upsert({ document_id: documentoId, list_id: listaId }, { onConflict: 'document_id,list_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function desvincularLista(sb: Supabase, documentoId: string, listaId: string): Promise<void> {
  const { error } = await sb.from('document_lists').delete().eq('document_id', documentoId).eq('list_id', listaId)
  if (error) throw error
}

export async function alternarFavorito(sb: Supabase, eu: string, documentoId: string, favorito: boolean): Promise<void> {
  const { error } = favorito
    ? await sb.from('document_favorites').upsert({ user_id: eu, document_id: documentoId }, { onConflict: 'user_id,document_id', ignoreDuplicates: true })
    : await sb.from('document_favorites').delete().eq('document_id', documentoId)
  if (error) throw error
}

export async function registrarVisualizacao(sb: Supabase, eu: string, documentoId: string): Promise<void> {
  await sb.from('document_views').upsert({ user_id: eu, document_id: documentoId, viewed_at: new Date().toISOString() }, { onConflict: 'user_id,document_id' })
}

// ---------------------------------------------------------------- páginas

export async function criarPagina(sb: Supabase, documentoId: string, paiId: string | null, titulo = ''): Promise<string> {
  let consulta = sb.from('document_pages').select('position').eq('document_id', documentoId).order('position', { ascending: false }).limit(1)
  consulta = paiId ? consulta.eq('parent_id', paiId) : consulta.is('parent_id', null)
  const { data: ultima, error: e1 } = await consulta
  if (e1) throw e1
  const { data, error } = await sb
    .from('document_pages')
    .insert({ document_id: documentoId, parent_id: paiId, title: titulo, position: posicaoEntre(ultima[0]?.position ?? null, null) })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function atualizarPagina(sb: Supabase, id: string, c: { titulo?: string; icone?: string | null; paiId?: string | null }): Promise<void> {
  const mudanca: TablesUpdate<'document_pages'> = {}
  if (c.titulo !== undefined) mudanca.title = c.titulo.slice(0, 200)
  if (c.icone !== undefined) mudanca.icon = c.icone
  if (c.paiId !== undefined) mudanca.parent_id = c.paiId
  const { data, error } = await sb.from('document_pages').update(mudanca).eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('Página não encontrada ou sem permissão')
}

export async function excluirPagina(sb: Supabase, id: string): Promise<void> {
  const { data: pagina } = await sb.from('document_pages').select('document_id').eq('id', id).maybeSingle()
  if (!pagina) throw new Error('Página não encontrada')
  const { count } = await sb.from('document_pages').select('id', { count: 'exact', head: true }).eq('document_id', pagina.document_id)
  if ((count ?? 0) <= 1) throw new Error('O documento precisa ter ao menos uma página')
  const { error } = await sb.from('document_pages').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------- edição simultânea

/**
 * Grava o estado completo do editor (Yjs em base64 + JSON para leitura/exportação) e descarta as alterações já incorporadas.
 * `ate` é o maior id de alteração que quem salvou já aplicou; a RLS só deixa apagar as que têm mais de 2 minutos.
 * A cada ~30 minutos guarda também uma versão para o histórico.
 */
export async function gravarEstado(sb: Supabase, eu: string, paginaId: string, estado: { ydoc: string; conteudo: Json | null; ate: number; titulo: string }): Promise<void> {
  // Só avança: um estado baseado em alterações mais antigas que o já gravado perderia texto (gravação atrasada).
  const { data: gravada, error } = await sb.from('document_pages').update({ ydoc: estado.ydoc, content: estado.conteudo, base_update: estado.ate }).eq('id', paginaId).lte('base_update', estado.ate).select('id')
  if (error) throw error
  if (!gravada.length) return
  await sb.from('document_updates').delete().eq('page_id', paginaId).lte('id', estado.ate)
  const { data: ultima } = await sb.from('document_versions').select('created_at').eq('page_id', paginaId).order('created_at', { ascending: false }).limit(1)
  if (!ultima?.[0] || Date.now() - new Date(ultima[0].created_at).getTime() > 30 * 60_000) {
    await sb.from('document_versions').insert({ page_id: paginaId, title: estado.titulo, content: estado.conteudo, ydoc: estado.ydoc, created_by: eu })
  }
  // Toca o documento para a lista "atualizado em" refletir a edição.
  const { data: p } = await sb.from('document_pages').select('document_id').eq('id', paginaId).maybeSingle()
  if (p) await sb.from('documents').update({ updated_at: new Date().toISOString() }).eq('id', p.document_id)
}

export async function listarVersoes(sb: Supabase, paginaId: string) {
  const { data, error } = await sb
    .from('document_versions')
    .select('id, title, content, created_at, autor:profiles(full_name)')
    .eq('page_id', paginaId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return data.map((v) => ({ id: v.id, titulo: v.title, conteudo: v.content, criadoEm: v.created_at, autor: (v.autor as unknown as { full_name: string } | null)?.full_name ?? '—' }))
}

/** Guarda uma versão agora (botão "Salvar versão"). */
export async function salvarVersao(sb: Supabase, eu: string, paginaId: string, conteudo: Json | null, ydoc: string | null, titulo: string): Promise<void> {
  const { error } = await sb.from('document_versions').insert({ page_id: paginaId, title: titulo, content: conteudo, ydoc, created_by: eu })
  if (error) throw error
}

// ---------------------------------------------------------------- comentários

export async function listarComentarios(sb: Supabase, paginaId: string) {
  const { data, error } = await sb
    .from('document_comments')
    .select('id, body, quote, resolved_at, created_at, author_id, autor:profiles(full_name)')
    .eq('page_id', paginaId)
    .order('created_at')
  if (error) throw error
  return data.map((c) => ({ id: c.id, texto: c.body, trecho: c.quote, resolvidoEm: c.resolved_at, criadoEm: c.created_at, autorId: c.author_id, autor: (c.autor as unknown as { full_name: string } | null)?.full_name ?? '—' }))
}

export async function criarComentario(sb: Supabase, eu: string, paginaId: string, texto: string, trecho?: string | null): Promise<void> {
  const { error } = await sb.from('document_comments').insert({ page_id: paginaId, author_id: eu, body: texto.trim(), quote: trecho?.slice(0, 500) ?? null })
  if (error) throw error
}

export async function resolverComentario(sb: Supabase, id: string, resolvido: boolean): Promise<void> {
  const { error } = await sb.from('document_comments').update({ resolved_at: resolvido ? new Date().toISOString() : null }).eq('id', id)
  if (error) throw error
}

export async function excluirComentario(sb: Supabase, id: string): Promise<void> {
  const { error } = await sb.from('document_comments').delete().eq('id', id)
  if (error) throw error
}
