import 'server-only'
import { checklistSeo, limparBriefing, resumir, slugify, tempoLeitura, type Briefing } from '@/dominio/blog'
import { criarClientePublico } from '@/infra/supabase/publico'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { dados } from './resultado'

/**
 * Blog: leitura pública (cliente de visitante, só o publicado, com cache) e gestão pela equipe (sessão, RLS is_team).
 */

export type Categoria = { id: string; slug: string; nome: string; descricao: string; cor: string }
export type Autor = { id: string; slug: string; nome: string; cargo: string; bio: string; foto: string | null; links: string[] }
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
export type Cta = { label: string; url: string; contexto: string; label2: string; url2: string; posicao: 'meio' | 'final' | 'ambos' }
export type Post = PostResumo & {
  seoTitulo: string
  palavraChave: string
  conteudo: string
  /** Para quem é o artigo (público-alvo). */
  publico: string
  tema: string
  palavrasSecundarias: string[]
  subtitulo: string
  tags: string[]
  breadcrumb: string
  canonical: string
  indexar: boolean
  ogTitulo: string
  ogDescricao: string
  capaLegenda: string
  capaCredito: string
  cta: Cta
  relacionadosIds: string[]
  entidades: string[]
  briefing: Briefing
  aviso: string
  notaAtualizacao: string
}

/** Endereço público de uma imagem do blog (servida pelo próprio site, com cache longo). */
export const urlImagem = (chave: string | null) => (chave ? `/blog/imagem/${chave}` : null)

const AUTOR = 'blog_authors(id, slug, name, role, bio, avatar_key, links)'
const CAMPOS = `id, slug, title, seo_title, excerpt, keyword, topic, audience, secondary_keywords, content, cover_key, cover_alt, is_pillar, published_at, updated_at, views,
  subtitle, tags, breadcrumb_title, canonical_url, robots_index, og_title, og_description, cover_caption, cover_credit, cta_label, cta_url, cta_context, cta2_label, cta2_url, cta_position,
  related_ids, entities, briefing, disclosure, update_note, blog_categories(id, slug, name, description, color), ${AUTOR}`
const CAMPOS_LISTA = `id, slug, title, excerpt, keyword, content, cover_key, cover_alt, is_pillar, published_at, updated_at, views, blog_categories(id, slug, name, description, color), ${AUTOR}`

type Linha = {
  id: string; slug: string; title: string; seo_title?: string; excerpt: string; keyword: string; topic?: string; audience?: string; secondary_keywords?: string[]; content?: string
  cover_key: string | null; cover_alt: string; is_pillar: boolean; published_at: string | null; updated_at: string; views: number
  subtitle?: string; tags?: string[]; breadcrumb_title?: string; canonical_url?: string; robots_index?: boolean; og_title?: string; og_description?: string; cover_caption?: string; cover_credit?: string
  cta_label?: string; cta_url?: string; cta_context?: string; cta2_label?: string; cta2_url?: string; cta_position?: string; related_ids?: string[]; entities?: string[]; briefing?: Json; disclosure?: string; update_note?: string
  blog_categories: { id: string; slug: string; name: string; description: string; color: string } | null
  blog_authors: { id: string; slug: string; name: string; role: string; bio: string; avatar_key: string | null; links?: string[] } | null
}

const paraCategoria = (c: Linha['blog_categories']): Categoria | null => (c ? { id: c.id, slug: c.slug, nome: c.name, descricao: c.description, cor: c.color } : null)
const paraAutor = (a: Linha['blog_authors']): Autor | null => (a ? { id: a.id, slug: a.slug, nome: a.name, cargo: a.role, bio: a.bio, foto: urlImagem(a.avatar_key), links: a.links ?? [] } : null)

function paraResumo(l: Linha, minutos: number): PostResumo {
  return {
    id: l.id, slug: l.slug, titulo: l.title, resumo: l.excerpt || resumir(l.content ?? ''), capa: urlImagem(l.cover_key), capaAlt: l.cover_alt || l.title,
    categoria: paraCategoria(l.blog_categories), autor: paraAutor(l.blog_authors), publicadoEm: l.published_at ?? l.updated_at, atualizadoEm: l.updated_at,
    minutos, pilar: l.is_pillar, visitas: l.views,
  }
}
const paraPost = (l: Linha): Post => ({
  ...paraResumo(l, tempoLeitura(l.content ?? '')),
  seoTitulo: l.seo_title ?? '', palavraChave: l.keyword, conteudo: l.content ?? '', publico: l.audience ?? '', tema: l.topic ?? '', palavrasSecundarias: l.secondary_keywords ?? [],
  subtitulo: l.subtitle ?? '', tags: l.tags ?? [], breadcrumb: l.breadcrumb_title ?? '', canonical: l.canonical_url ?? '', indexar: l.robots_index ?? true,
  ogTitulo: l.og_title ?? '', ogDescricao: l.og_description ?? '', capaLegenda: l.cover_caption ?? '', capaCredito: l.cover_credit ?? '',
  cta: { label: l.cta_label ?? '', url: l.cta_url ?? '', contexto: l.cta_context ?? '', label2: l.cta2_label ?? '', url2: l.cta2_url ?? '', posicao: (l.cta_position as Cta['posicao']) ?? 'ambos' },
  relacionadosIds: l.related_ids ?? [], entidades: l.entities ?? [], briefing: limparBriefing(l.briefing), aviso: l.disclosure ?? '', notaAtualizacao: l.update_note ?? '',
})

// ---------- Contexto da marca ----------

export type ContextoMarca = Record<string, string | boolean>
export const CAMPOS_MARCA: { chave: string; rotulo: string; longo?: boolean }[] = [
  { chave: 'brand_name', rotulo: 'Nome da marca' },
  { chave: 'founder_name', rotulo: 'Fundador' },
  { chave: 'brand_description', rotulo: 'Descrição oficial', longo: true },
  { chave: 'main_product', rotulo: 'Produto principal' },
  { chave: 'main_offer', rotulo: 'Oferta', longo: true },
  { chave: 'main_promise', rotulo: 'Promessa (com ressalvas)', longo: true },
  { chave: 'main_mechanism', rotulo: 'Mecanismo' },
  { chave: 'revenue_engineering', rotulo: 'Engenharia de receita' },
  { chave: 'four_gears', rotulo: 'Quatro engrenagens (em ordem)' },
  { chave: 'tone_of_voice', rotulo: 'Tom de voz' },
  { chave: 'forbidden_claims', rotulo: 'O que nunca prometer', longo: true },
  { chave: 'institutional_email', rotulo: 'E-mail institucional' },
  { chave: 'institutional_phone', rotulo: 'WhatsApp ou telefone' },
  { chave: 'same_as', rotulo: 'Perfis oficiais (um link por linha)', longo: true },
]

export async function contextoMarca(): Promise<ContextoMarca> {
  const { data } = await criarClientePublico().from('blog_settings').select('data').maybeSingle()
  return (data?.data as ContextoMarca | undefined) ?? {}
}

export async function salvarContextoMarca(sb: Supabase, c: ContextoMarca): Promise<void> {
  const limpo: ContextoMarca = {}
  for (const { chave } of CAMPOS_MARCA) if (typeof c[chave] === 'string') limpo[chave] = String(c[chave]).trim().slice(0, 1500)
  limpo.allow_ai_training = c.allow_ai_training === true
  dados(await sb.from('blog_settings').upsert({ id: true, data: limpo, updated_at: new Date().toISOString() }).select('id'))
}

// ---------- Público ----------

export async function categorias(): Promise<Categoria[]> {
  const linhas = dados(await criarClientePublico().from('blog_categories').select('id, slug, name, description, color').order('position'))
  return linhas.map((c) => ({ id: c.id, slug: c.slug, nome: c.name, descricao: c.description, cor: c.color }))
}

export async function autorPorSlug(slug: string): Promise<Autor | null> {
  const { data } = await criarClientePublico().from('blog_authors').select('id, slug, name, role, bio, avatar_key, links').eq('slug', slug).maybeSingle()
  return data ? paraAutor(data) : null
}

type Filtro = { categoriaId?: string; autorId?: string; busca?: string; excluir?: string; ids?: string[]; limite?: number; pagina?: number; ordem?: 'recentes' | 'lidos' }

/** Publicados (mais novos primeiro, ou mais lidos). `total` para a paginação. Artigos marcados "não indexar" ficam fora. */
export async function publicados(f: Filtro = {}): Promise<{ posts: PostResumo[]; total: number }> {
  const limite = f.limite ?? 12
  const pagina = Math.max(1, f.pagina ?? 1)
  // O conteúdo vem junto só para calcular o tempo de leitura (o blog tem poucos artigos por página).
  let q = criarClientePublico().from('blog_posts').select(CAMPOS_LISTA, { count: 'exact' }).eq('status', 'publicado').lte('published_at', new Date().toISOString())
  if (!f.ids) q = q.eq('robots_index', true)
  if (f.ids) q = q.in('id', f.ids.length ? f.ids : ['00000000-0000-0000-0000-000000000000'])
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

/** Todos os endereços publicados e indexáveis (para o sitemap). */
export async function enderecosPublicados(): Promise<{ slug: string; atualizadoEm: string; categoria: string | null; autor: string | null }[]> {
  const linhas = dados(await criarClientePublico().from('blog_posts').select('slug, updated_at, blog_categories(slug), blog_authors(slug)').eq('status', 'publicado').eq('robots_index', true).lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(5000)) as unknown as { slug: string; updated_at: string; blog_categories: { slug: string } | null; blog_authors: { slug: string } | null }[]
  return linhas.map((l) => ({ slug: l.slug, atualizadoEm: l.updated_at, categoria: l.blog_categories?.slug ?? null, autor: l.blog_authors?.slug ?? null }))
}

/** Eventos de leitura vindos do navegador (rolagem, cliques, origem). A função do banco filtra os nomes. */
export async function registrarEventos(slug: string, eventos: string[]): Promise<void> {
  await criarClientePublico().rpc('blog_registrar_eventos', { p_slug: slug, p_eventos: eventos.slice(0, 20) })
}

// ---------- Equipe (sessão) ----------

export type StatusPost = 'rascunho' | 'revisao' | 'publicado'
export type PostEquipe = Post & { status: StatusPost; capaChave: string | null; categoriaId: string | null; autorId: string | null; publicadoEmBruto: string | null; revisarEm: string | null; revisadoPor: string | null; revisadoEm: string | null }

export async function postsDaEquipe(sb: Supabase): Promise<(PostResumo & { status: StatusPost; publicadoEmBruto: string | null; palavraChave: string; revisarEm: string | null; revisado: boolean })[]> {
  const linhas = dados(await sb.from('blog_posts').select(`${CAMPOS_LISTA}, status, review_due, reviewed_at`).order('updated_at', { ascending: false }).limit(500)) as unknown as (Linha & { status: StatusPost; review_due: string | null; reviewed_at: string | null })[]
  return linhas.map((l) => ({ ...paraResumo(l, 0), status: l.status, publicadoEmBruto: l.published_at, palavraChave: l.keyword, revisarEm: l.review_due, revisado: !!l.reviewed_at }))
}

export async function postDaEquipe(sb: Supabase, id: string): Promise<PostEquipe | null> {
  const { data } = await sb.from('blog_posts').select(`${CAMPOS}, status, category_id, author_id, review_due, reviewed_at, profiles!blog_posts_reviewed_by_fkey(full_name)`).eq('id', id).maybeSingle()
  if (!data) return null
  const l = data as unknown as Linha & { status: StatusPost; category_id: string | null; author_id: string | null; review_due: string | null; reviewed_at: string | null; profiles: { full_name: string } | null }
  return { ...paraPost(l), status: l.status, capaChave: l.cover_key, categoriaId: l.category_id, autorId: l.author_id, publicadoEmBruto: l.published_at, revisarEm: l.review_due, revisadoPor: l.profiles?.full_name ?? null, revisadoEm: l.reviewed_at }
}

export async function autores(sb: Supabase): Promise<Autor[]> {
  return dados(await sb.from('blog_authors').select('id, slug, name, role, bio, avatar_key, links').order('name')).map(paraAutor) as Autor[]
}

/** Palavra-chave de cada artigo (para avisar quando dois disputam a mesma busca). */
export async function palavrasChaveDosPosts(sb: Supabase): Promise<{ id: string; titulo: string; palavraChave: string }[]> {
  return dados(await sb.from('blog_posts').select('id, title, keyword').neq('keyword', '')).map((p) => ({ id: p.id, titulo: p.title, palavraChave: p.keyword }))
}

export type CamposPost = {
  titulo: string; slug: string; seoTitulo: string; resumo: string; palavraChave: string; publico: string; tema: string; palavrasSecundarias: string[]; conteudo: string
  capaChave: string | null; capaAlt: string; categoriaId: string | null; autorId: string | null; pilar: boolean
  subtitulo?: string; tags?: string[]; breadcrumb?: string; canonical?: string; indexar?: boolean; ogTitulo?: string; ogDescricao?: string; capaLegenda?: string; capaCredito?: string
  cta?: Partial<Cta>; relacionadosIds?: string[]; entidades?: string[]; briefing?: Briefing; aviso?: string; notaAtualizacao?: string; revisarEm?: string | null
}

const lista = (xs: string[] | undefined, max: number, tam = 80) => [...new Set((xs ?? []).map((k) => k.trim().slice(0, tam)).filter(Boolean))].slice(0, max)
const url = (u: string | undefined) => {
  const v = (u ?? '').trim()
  return /^(\/|https:\/\/)/.test(v) ? v.slice(0, 300) : ''
}

const colunas = (c: CamposPost) => ({
  title: c.titulo.trim().slice(0, 160), slug: slugify(c.slug || c.titulo) || 'artigo', seo_title: c.seoTitulo.trim().slice(0, 80), excerpt: c.resumo.trim().slice(0, 300),
  keyword: c.palavraChave.trim().slice(0, 80), audience: c.publico.trim().slice(0, 200), topic: c.tema.trim().slice(0, 300),
  secondary_keywords: lista(c.palavrasSecundarias, 15), content: c.conteudo, cover_key: c.capaChave, cover_alt: c.capaAlt.trim().slice(0, 200),
  category_id: c.categoriaId, author_id: c.autorId, is_pillar: c.pilar,
  subtitle: (c.subtitulo ?? '').trim().slice(0, 200), tags: lista(c.tags, 10, 40), breadcrumb_title: (c.breadcrumb ?? '').trim().slice(0, 60),
  canonical_url: /^https:\/\//.test((c.canonical ?? '').trim()) ? (c.canonical ?? '').trim().slice(0, 300) : '', robots_index: c.indexar !== false,
  og_title: (c.ogTitulo ?? '').trim().slice(0, 100), og_description: (c.ogDescricao ?? '').trim().slice(0, 300),
  cover_caption: (c.capaLegenda ?? '').trim().slice(0, 200), cover_credit: (c.capaCredito ?? '').trim().slice(0, 120),
  cta_label: (c.cta?.label ?? '').trim().slice(0, 80), cta_url: url(c.cta?.url), cta_context: (c.cta?.contexto ?? '').trim().slice(0, 300),
  cta2_label: (c.cta?.label2 ?? '').trim().slice(0, 80), cta2_url: url(c.cta?.url2), cta_position: ['meio', 'final', 'ambos'].includes(c.cta?.posicao ?? '') ? c.cta!.posicao! : 'ambos',
  related_ids: (c.relacionadosIds ?? []).filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 4), entities: lista(c.entidades, 20),
  briefing: limparBriefing(c.briefing) as Json, disclosure: (c.aviso ?? '').trim().slice(0, 300), update_note: (c.notaAtualizacao ?? '').trim().slice(0, 300),
  review_due: c.revisarEm && /^\d{4}-\d{2}-\d{2}$/.test(c.revisarEm) ? c.revisarEm : null,
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

/** Publica agora (ou agenda, com data futura), manda para revisão ou volta para rascunho. */
export async function definirPublicacao(sb: Supabase, id: string, quando: string | 'revisao' | null): Promise<void> {
  const campos = quando === 'revisao' ? { status: 'revisao' } : quando ? { status: 'publicado', published_at: quando } : { status: 'rascunho' }
  dados(await sb.from('blog_posts').update(campos).eq('id', id).select('id').single())
}

/** Revisão humana: aprovar (registra quem e quando) ou desfazer a aprovação. */
export async function definirRevisao(sb: Supabase, id: string, euId: string, aprovado: boolean): Promise<void> {
  dados(await sb.from('blog_posts').update(aprovado ? { reviewed_by: euId, reviewed_at: new Date().toISOString() } : { reviewed_by: null, reviewed_at: null }).eq('id', id).select('id').single())
}

export async function inscritos(sb: Supabase): Promise<{ email: string; nome: string; origem: string; em: string }[]> {
  return dados(await sb.from('blog_subscribers').select('email, name, source, created_at').is('unsubscribed_at', null).order('created_at', { ascending: false }).limit(5000)).map((i) => ({ email: i.email, nome: i.name, origem: i.source, em: i.created_at }))
}

export async function salvarAutor(sb: Supabase, id: string | null, a: { nome: string; cargo: string; bio: string; links?: string[]; fotoChave?: string | null }): Promise<void> {
  const campos = {
    name: a.nome.trim().slice(0, 80), role: a.cargo.trim().slice(0, 80), bio: a.bio.trim().slice(0, 800),
    links: (a.links ?? []).map((l) => l.trim()).filter((l) => /^https:\/\//.test(l)).slice(0, 8),
    ...(a.fotoChave !== undefined ? { avatar_key: a.fotoChave } : {}),
  }
  if (!campos.name) throw { code: 'P0001', message: 'Informe o nome do autor.' }
  if (id) dados(await sb.from('blog_authors').update(campos).eq('id', id).select('id').single())
  else dados(await sb.from('blog_authors').insert({ ...campos, slug: slugify(campos.name) || 'autor' }).select('id').single())
}

// ---------- Desempenho (eventos de leitura) ----------

export type Desempenho = { visitas: number; leituraEngajada: number; rolagem: Record<'25' | '50' | '75' | '90', number>; cliquesCta: number; cliquesCta2: number; cliquesInternos: number; origens: Record<string, number> }

/** Soma dos eventos de leitura por artigo (todos, ou só os de `postId`), desde `desde` (AAAA-MM-DD). */
export async function desempenho(sb: Supabase, desde: string, postId?: string): Promise<Map<string, Desempenho>> {
  let q = sb.from('blog_post_events').select('post_id, event, count').gte('day', desde).limit(50_000)
  if (postId) q = q.eq('post_id', postId)
  const { data, error } = await q
  const r = new Map<string, Desempenho>()
  if (error) return r // sem a migração: sem números
  for (const e of data) {
    const d = r.get(e.post_id) ?? { visitas: 0, leituraEngajada: 0, rolagem: { '25': 0, '50': 0, '75': 0, '90': 0 }, cliquesCta: 0, cliquesCta2: 0, cliquesInternos: 0, origens: {} }
    if (e.event === 'page_view') d.visitas += e.count
    else if (e.event === 'engaged_view') d.leituraEngajada += e.count
    else if (e.event.startsWith('scroll_')) d.rolagem[e.event.slice(7) as '25'] += e.count
    else if (e.event === 'cta_click') d.cliquesCta += e.count
    else if (e.event === 'cta2_click') d.cliquesCta2 += e.count
    else if (e.event === 'internal_link_click') d.cliquesInternos += e.count
    else if (e.event.startsWith('origem:')) d.origens[e.event.slice(7)] = (d.origens[e.event.slice(7)] ?? 0) + e.count
    r.set(e.post_id, d)
  }
  return r
}

/** Checklist completo de um artigo salvo (o mesmo do editor), com canibalização contra os outros artigos. */
export async function qualidadeDoPost(sb: Supabase, p: PostEquipe) {
  const outras = (await palavrasChaveDosPosts(sb)).filter((x) => x.id !== p.id).map((x) => x.palavraChave)
  return checklistSeo({
    titulo: p.titulo, seoTitulo: p.seoTitulo, resumo: p.resumo, palavraChave: p.palavraChave, palavrasSecundarias: p.palavrasSecundarias, publico: p.publico, conteudo: p.conteudo,
    capa: !!p.capaChave, capaAlt: p.capaAlt === p.titulo ? '' : p.capaAlt, slug: p.slug, tags: p.tags, ctaLabel: p.cta.label, ctaUrl: p.cta.url, revisado: !!p.revisadoEm,
    outrasPalavrasChave: outras, textosExtras: [p.subtitulo, p.ogTitulo, p.ogDescricao, p.cta.contexto, p.aviso],
  })
}

/** Exclui o artigo de vez (só fora do ar; a RLS também confere). */
export async function excluirPost(sb: Supabase, id: string): Promise<void> {
  const { error, count } = await sb.from('blog_posts').delete({ count: 'exact' }).eq('id', id).neq('status', 'publicado')
  if (error) throw error
  if (!count) throw { code: 'P0001', message: 'Só dá para excluir um artigo fora do ar: tire do ar antes.' }
}
