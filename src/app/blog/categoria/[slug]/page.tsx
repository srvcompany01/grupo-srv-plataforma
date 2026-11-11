import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CartaoPost, ChamadaLanding, JsonLd, Paginacao } from '@/componentes/blog/Pecas'
import { Newsletter } from '@/componentes/blog/Newsletter'
import { SITE } from '@/dominio/blog'
import { categorias, publicados } from '@/servicos/blog'

export const revalidate = 300
const POR_PAGINA = 12

async function categoria(slug: string) {
  return (await categorias()).find((c) => c.slug === slug) ?? null
}

export async function generateMetadata({ params, searchParams }: PageProps<'/blog/categoria/[slug]'>): Promise<Metadata> {
  const c = await categoria((await params).slug)
  if (!c) return { robots: { index: false } }
  const pagina = Number((await searchParams).pagina) || 1
  const url = `${SITE}/blog/categoria/${c.slug}${pagina > 1 ? `?pagina=${pagina}` : ''}`
  return { title: `${c.nome}: guias e dicas${pagina > 1 ? ` (página ${pagina})` : ''}`, description: c.descricao, alternates: { canonical: url }, openGraph: { url, title: c.nome, description: c.descricao } }
}

/** Página do pilar (categoria): o que é o assunto, o guia principal em destaque e todos os artigos. */
export default async function PaginaCategoria({ params, searchParams }: PageProps<'/blog/categoria/[slug]'>) {
  const c = await categoria((await params).slug)
  if (!c) notFound()
  const pagina = Math.max(1, Number((await searchParams).pagina) || 1)
  const { posts, total } = await publicados({ categoriaId: c.id, limite: POR_PAGINA, pagina })
  const pilar = pagina === 1 ? posts.find((p) => p.pilar) : undefined
  const demais = posts.filter((p) => p !== pilar)
  return (
    <div>
      <JsonLd dados={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE}/blog` }, { '@type': 'ListItem', position: 2, name: c.nome, item: `${SITE}/blog/categoria/${c.slug}` }] }} />
      <nav aria-label="Você está em"><Link href="/blog">Blog</Link> <span aria-hidden>/</span> {c.nome}</nav>
      <header style={{ borderColor: c.cor }}>
        <h1>{c.nome}</h1>
        <p>{c.descricao}</p>
      </header>

      {pilar && (
        <section>
          <p style={{ color: c.cor }}>Guia completo</p>
          <CartaoPost p={pilar} destaque prioridade />
        </section>
      )}

      {demais.length > 0 ? (
        <div>{demais.map((p, i) => <CartaoPost key={p.id} p={p} prioridade={!pilar && i < 3} />)}</div>
      ) : !pilar ? (
        <p>Os primeiros artigos deste assunto estão chegando.</p>
      ) : null}
      <Paginacao base={`/blog/categoria/${c.slug}`} pagina={pagina} total={total} porPagina={POR_PAGINA} />

      <ChamadaLanding slug={`categoria-${c.slug}`} />
      <section>
        <p>Receba os novos artigos de {c.nome.toLowerCase()}</p>
        <div><Newsletter origem={`categoria:${c.slug}`} /></div>
      </section>
    </div>
  )
}
