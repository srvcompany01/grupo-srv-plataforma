import 'server-only'
import { resumir, slugify, tempoLeitura } from '@/dominio/blog'
import { criarClientePublico } from '@/infra/supabase/publico'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

/**
 * Blog: leitura pública (cliente de visitante, só o publicado, com cache) e gestão pela equipe (sessão, RLS is_team).
 */

export type Categoria = { id: string; slug: string; nome: string; descricao: string; cor: string }
export type Autor = { id: string; slug: string; nome: string; cargo: string; bio: string; foto: string | null }
export type PostResumo = {
  id: string
  slug: string
  titulo: string
  resumo: string
  capa: string | null
  capaAlt: string
  categoria: Categoria | null
  autor: Autor | null
  publicadoEm: string
  atualizadoEm: string
  minutos: number
  pilar: boolean
  visitas: number
}
export type Post = PostResumo & { seoTitulo: string; palavraChave: string; conteudo: string }

/** Endereço público de uma imagem do blog (servida pelo próprio site, com cache longo). */
export const urlImagem = (chave: string | null) => (chave ? `/blog/imagem/${chave}` : null)

const CAMPOS = 'id, slug, title, seo_title, excerpt, keyword, content, cover_key, cover_alt, is_pillar, published_at, updated_at, views, blog_categories(id, slug, name, description, color), blog_authors(id, slug, name, role, bio, avatar_key)'
const CAMPOS_RESUMO = CAMPOS.replace('content, ', '')

type Linha = {
  id: string; slug: string; title: string; seo_title: string; excerpt: string; keyword: string; content?: string; cover_key: string | null; cover_alt: string; is_pillar: boolean; published_at: string | null; updated_at: string; views: number
  blog_categories: { id: string; slug: string; name: string; description: string; color: string } | null
  blog_authors: { id: string; slug: string; name: string; role: string; bio: string; avatar_key: string | null } | null
}

const paraCategoria = (c: Linha['blog_categories']): Categoria | null => (c ? { id: c.id, slug: c.slug, nome: c.name, descricao: c.description, cor: c.color } : null)
const paraAutor = (a: Linha['blog_authors']): Autor | null => (a ? { id: a.id, slug: a.slug, nome: a.name, cargo: a.role, bio: a.bio, foto: urlImagem(a.avatar_key) } : null)

function paraResumo(l: Linha, minutos: number): PostResumo {
  return {
    id: l.id, slug: l.slug, titulo: l.title, resumo: l.excerpt || resumir(l.content ?? ''), capa: urlImagem(l.cover_key), capaAlt: l.cover_alt || l.title,
    categoria: paraCategoria(l.blog_categories), autor: paraAutor(l.blog_authors), publicadoEm: l.published_at ?? l.updated_at, atualizadoEm: l.updated_at,
    minutos, pilar: l.is_pillar, visitas: l.views,
  }
}
const paraPost = (l: Linha): Post => ({ ...paraResumo(l, tempoLeitura(l.content ?? '')), seoTitulo: l.seo_title, palavraChave: l.keyword, conteudo: l.content ?? '' })

// ---------- Público ----------

export async function categorias(): Promise<Categoria[]> {
  const linhas = dados(await criarClientePublico().from('blog_categories').select('id, slug, name, description, color').order('position'))
  return linhas.map((c) => ({ id: c.id, slug: c.slug, nome: c.name, descricao: c.description, cor: c.color }))
}

export async function autorPorSlug(slug: string): Promise<Autor | null> {
  const { data } = await criarClientePublico().from('blog_authors').select('id, slug, name, role, bio, avatar_key').eq('slug', slug).maybeSingle()
  return data ? paraAutor(data) : null
}

type Filtro = { categoriaId?: string; autorId?: string; busca?: string; excluir?: string; limite?: number; pagina?: number; ordem?: 'recentes' | 'lidos' }

/** Publicados (mais novos primeiro, ou mais lidos). `total` para a paginação. */
export async function publicados(f: Filtro = {}): Promise<{ posts: PostResumo[]; total: number }> {
  const limite = f.limite ?? 12
  const pagina = Math.max(1, f.pagina ?? 1)
  // O conteúdo vem junto só para calcular o tempo de leitura (o blog tem poucos artigos por página).
  let q = criarClientePublico().from('blog_posts').select(`${CAMPOS}`, { count: 'exact' }).eq('status', 'publicado').lte('published_at', new Date().toISOString())
  if (f.categoriaId) q = q.eq('category_id', f.categoriaId)
  if (f.autorId) q = q.eq('author_id', f.autorId)
  if (f.excluir) q = q.neq('id', f.excluir)
  if (f.busca) {
    const termo = f.busca.replace(/[%_,()]/g, ' ').trim().slice(0, 80)
    if (termo) q = q.or(`title.ilike.%${termo}%,excerpt.ilike.%${termo}%,keyword.ilike.%${termo}%`)
  }
  q = f.ordem === 'lidos' ? q.order('views', { ascending: false }) : q.order('published_at', { ascending: false })
  const { data, error, count } = await q.range((pagina - 1) * limite, pagina * limite - 1)
  if (error) throw error
  return { posts: (data as unknown as Linha[]).map((l) => paraResumo(l, tempoLeitura(l.content ?? ''))), total: count ?? 0 }
}

export async function postPublicado(slug: string): Promise<Post | null> {
  const { data } = await criarClientePublico().from('blog_posts').select(CAMPOS).eq('slug', slug).eq('status', 'publicado').lte('published_at', new Date().toISOString()).maybeSingle()
  return data ? paraPost(data as unknown as Linha) : null
}

/** Todos os endereços publicados (para o sitemap). */
export async function enderecosPublicados(): Promise<{ slug: string; atualizadoEm: string; categoria: string | null; autor: string | null }[]> {
  const linhas = dados(await criarClientePublico().from('blog_posts').select('slug, updated_at, blog_categories(slug), blog_authors(slug)').eq('status', 'publicado').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(5000)) as unknown as { slug: string; updated_at: string; blog_categories: { slug: string } | null; blog_authors: { slug: string } | null }[]
  return linhas.map((l) => ({ slug: l.slug, atualizadoEm: l.updated_at, categoria: l.blog_categories?.slug ?? null, autor: l.blog_authors?.slug ?? null }))
}

export async function contarVisita(slug: string): Promise<void> {
  await criarClientePublico().rpc('blog_contar_visita', { p_slug: slug })
}

// ---------- Equipe (sessão) ----------

export type PostEquipe = Post & { status: 'rascunho' | 'publicado'; capaChave: string | null; categoriaId: string | null; autorId: string | null; publicadoEmBruto: string | null }

export async function postsDaEquipe(sb: Supabase): Promise<(PostResumo & { status: string; publicadoEmBruto: string | null; palavraChave: string })[]> {
  const linhas = dados(await sb.from('blog_posts').select(`${CAMPOS_RESUMO}, status`).order('updated_at', { ascending: false }).limit(500)) as unknown as (Linha & { status: string })[]
  return linhas.map((l) => ({ ...paraResumo(l, 0), status: l.status, publicadoEmBruto: l.published_at, palavraChave: l.keyword }))
}

export async function postDaEquipe(sb: Supabase, id: string): Promise<PostEquipe | null> {
  const { data } = await sb.from('blog_posts').select(`${CAMPOS}, status, category_id, author_id`).eq('id', id).maybeSingle()
  if (!data) return null
  const l = data as unknown as Linha & { status: 'rascunho' | 'publicado'; category_id: string | null; author_id: string | null }
  return { ...paraPost(l), status: l.status, capaChave: l.cover_key, categoriaId: l.category_id, autorId: l.author_id, publicadoEmBruto: l.published_at }
}

export async function autores(sb: Supabase): Promise<Autor[]> {
  return dados(await sb.from('blog_authors').select('id, slug, name, role, bio, avatar_key').order('name')).map(paraAutor) as Autor[]
}

export type CamposPost = {
  titulo: string; slug: string; seoTitulo: string; resumo: string; palavraChave: string; conteudo: string
  capaChave: string | null; capaAlt: string; categoriaId: string | null; autorId: string | null; pilar: boolean
}

const colunas = (c: CamposPost) => ({
  title: c.titulo.trim().slice(0, 160), slug: slugify(c.slug || c.titulo) || 'artigo', seo_title: c.seoTitulo.trim().slice(0, 80), excerpt: c.resumo.trim().slice(0, 300),
  keyword: c.palavraChave.trim().slice(0, 80), content: c.conteudo, cover_key: c.capaChave, cover_alt: c.capaAlt.trim().slice(0, 200),
  category_id: c.categoriaId, author_id: c.autorId, is_pillar: c.pilar,
})

/** Cria (id null) ou salva o artigo. Devolve o id. */
export async function salvarPost(sb: Supabase, id: string | null, c: CamposPost): Promise<string> {
  if (!c.titulo.trim()) throw { code: 'P0001', message: 'Dê um título ao artigo.' }
  if (id) {
    dados(await sb.from('blog_posts').update(colunas(c)).eq('id', id).select('id').single())
    return id
  }
  const { data, error } = await sb.from('blog_posts').insert(colunas(c)).select('id').single()
  if (error) throw error
  return data.id
}

/** Publica agora (ou agenda, com data futura) / volta para rascunho. */
export async function definirPublicacao(sb: Supabase, id: string, quando: string | null): Promise<void> {
  dados(await sb.from('blog_posts').update(quando ? { status: 'publicado', published_at: quando } : { status: 'rascunho' }).eq('id', id).select('id').single())
}

export async function inscritos(sb: Supabase): Promise<{ email: string; nome: string; origem: string; em: string }[]> {
  return dados(await sb.from('blog_subscribers').select('email, name, source, created_at').is('unsubscribed_at', null).order('created_at', { ascending: false }).limit(5000)).map((i) => ({ email: i.email, nome: i.name, origem: i.source, em: i.created_at }))
}

export async function salvarAutor(sb: Supabase, id: string | null, a: { nome: string; cargo: string; bio: string; fotoChave?: string | null }): Promise<void> {
  const campos = { name: a.nome.trim().slice(0, 80), role: a.cargo.trim().slice(0, 80), bio: a.bio.trim().slice(0, 800), ...(a.fotoChave !== undefined ? { avatar_key: a.fotoChave } : {}) }
  if (!campos.name) throw { code: 'P0001', message: 'Informe o nome do autor.' }
  if (id) dados(await sb.from('blog_authors').update(campos).eq('id', id).select('id').single())
  else dados(await sb.from('blog_authors').insert({ ...campos, slug: slugify(campos.name) || 'autor' }).select('id').single())
}
