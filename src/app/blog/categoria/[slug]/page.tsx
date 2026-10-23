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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd dados={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE}/blog` }, { '@type': 'ListItem', position: 2, name: c.nome, item: `${SITE}/blog/categoria/${c.slug}` }] }} />
      <nav aria-label="Você está em" className="mb-4 text-[12px] text-[#656565]"><Link href="/blog" className="hover:text-[#070707]">Blog</Link> <span aria-hidden>/</span> {c.nome}</nav>
      <header className="max-w-3xl border-l-4 pl-4" style={{ borderColor: c.cor }}>
        <h1 className="font-[family-name:var(--blog-titulo)] text-5xl font-extrabold uppercase leading-none md:text-6xl">{c.nome}</h1>
        <p className="mt-3 text-[17px] text-[#4a4a4a]">{c.descricao}</p>
      </header>

      {pilar && (
        <section className="mt-10 rounded-2xl bg-white p-5 ring-1 ring-[#e6e6e2] md:p-8">
          <p className="mb-4 font-[family-name:var(--blog-mono)] text-[11px] font-semibold uppercase tracking-widest" style={{ color: c.cor }}>Guia completo</p>
          <CartaoPost p={pilar} destaque prioridade />
        </section>
      )}

      {demais.length > 0 ? (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{demais.map((p, i) => <CartaoPost key={p.id} p={p} prioridade={!pilar && i < 3} />)}</div>
      ) : !pilar ? (
        <p className="mt-10 rounded-xl border border-dashed border-[#e6e6e2] p-10 text-center text-[#656565]">Os primeiros artigos deste assunto estão chegando.</p>
      ) : null}
      <Paginacao base={`/blog/categoria/${c.slug}`} pagina={pagina} total={total} porPagina={POR_PAGINA} />

      <ChamadaLanding slug={`categoria-${c.slug}`} />
      <section className="rounded-2xl bg-white p-6 ring-1 ring-[#e6e6e2]">
        <p className="font-[family-name:var(--blog-titulo)] text-2xl font-extrabold uppercase">Receba os novos artigos de {c.nome.toLowerCase()}</p>
        <div className="mt-4"><Newsletter origem={`categoria:${c.slug}`} /></div>
      </section>
    </div>
  )
}
