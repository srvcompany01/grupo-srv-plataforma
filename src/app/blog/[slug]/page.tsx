import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CartaoPost, ChamadaLanding, JsonLd, Meta, SeloCategoria, dataCurta } from '@/componentes/blog/Pecas'
import { ContarVisita, Newsletter } from '@/componentes/blog/Newsletter'
import { SITE, dividirParaChamada, renderizar, sumario } from '@/dominio/blog'
import { postPublicado, publicados } from '@/servicos/blog'

export const revalidate = 300

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const p = await postPublicado((await params).slug)
  if (!p) return { title: 'Artigo não encontrado', robots: { index: false } }
  const url = `${SITE}/blog/${p.slug}`
  return {
    title: p.seoTitulo || p.titulo,
    description: p.resumo,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, title: p.seoTitulo || p.titulo, description: p.resumo, publishedTime: p.publicadoEm, modifiedTime: p.atualizadoEm, authors: p.autor ? [p.autor.nome] : undefined, images: p.capa ? [{ url: `${SITE}${p.capa}`, alt: p.capaAlt }] : undefined },
    twitter: { card: 'summary_large_image', title: p.seoTitulo || p.titulo, description: p.resumo, images: p.capa ? [`${SITE}${p.capa}`] : undefined },
  }
}

/** Artigo: breadcrumb, título, autor e datas, capa, sumário, texto com chamada no meio, autor, relacionados e newsletter. */
export default async function Artigo({ params }: PageProps<'/blog/[slug]'>) {
  const p = await postPublicado((await params).slug)
  if (!p) notFound()
  const [antes, depois] = dividirParaChamada(renderizar(p.conteudo))
  const indice = sumario(p.conteudo).filter((t) => t.nivel === 2)
  const relacionados = (await publicados({ categoriaId: p.categoria?.id, excluir: p.id, limite: 3 })).posts
  const url = `${SITE}/blog/${p.slug}`
  const atualizado = p.atualizadoEm.slice(0, 10) > p.publicadoEm.slice(0, 10)

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <ContarVisita slug={p.slug} />
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting', headline: p.titulo, description: p.resumo, mainEntityOfPage: url, url, datePublished: p.publicadoEm, dateModified: p.atualizadoEm,
              image: p.capa ? [`${SITE}${p.capa}`] : undefined, keywords: p.palavraChave || undefined, articleSection: p.categoria?.nome,
              author: p.autor ? { '@type': p.autor.slug === 'equipe-grupo-srv' ? 'Organization' : 'Person', name: p.autor.nome, url: `${SITE}/blog/autor/${p.autor.slug}` } : { '@type': 'Organization', name: 'Grupo SRV' },
              publisher: { '@type': 'Organization', name: 'Grupo SRV', logo: { '@type': 'ImageObject', url: `${SITE}/marca/simbolo.png` } },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE}/blog` },
                ...(p.categoria ? [{ '@type': 'ListItem', position: 2, name: p.categoria.nome, item: `${SITE}/blog/categoria/${p.categoria.slug}` }] : []),
                { '@type': 'ListItem', position: p.categoria ? 3 : 2, name: p.titulo, item: url },
              ],
            },
          ],
        }}
      />
      <nav aria-label="Você está em" className="mb-6 text-[12px] text-[#656565]">
        <Link href="/blog" className="hover:text-[#070707]">Blog</Link>
        {p.categoria && <> <span aria-hidden>/</span> <Link href={`/blog/categoria/${p.categoria.slug}`} className="hover:text-[#070707]">{p.categoria.nome}</Link></>}
      </nav>

      <header className="mx-auto max-w-3xl space-y-4 text-center">
        {p.categoria && <SeloCategoria c={p.categoria} />}
        <h1 className="font-[family-name:var(--blog-titulo)] text-4xl font-extrabold uppercase leading-[0.95] md:text-6xl">{p.titulo}</h1>
        <p className="text-[18px] text-[#4a4a4a]">{p.resumo}</p>
        <div className="flex justify-center"><Meta p={p} /></div>
        {atualizado && <p className="text-[12px] text-[#656565]">Atualizado em <time dateTime={p.atualizadoEm}>{dataCurta(p.atualizadoEm)}</time></p>}
      </header>

      {p.capa && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem
        <img src={p.capa} alt={p.capaAlt} width={1200} height={675} fetchPriority="high" className="mx-auto mt-8 aspect-[16/9] w-full max-w-5xl rounded-2xl object-cover" />
      )}

      <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          {indice.length > 1 && (
            <nav aria-label="Neste artigo" className="sticky top-24 space-y-2 text-[13px]">
              <p className="font-[family-name:var(--blog-mono)] text-[11px] font-semibold uppercase tracking-widest text-[#656565]">Neste artigo</p>
              <ol className="space-y-2 border-l border-[#e6e6e2] pl-3">{indice.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-[#2a2a2a] hover:text-[#d80d12]">{t.texto}</a></li>)}</ol>
            </nav>
          )}
        </aside>
        <div className="min-w-0">
          <div className="artigo-blog" dangerouslySetInnerHTML={{ __html: antes }} />
          <ChamadaLanding slug={p.slug} />
          {depois && <div className="artigo-blog" dangerouslySetInnerHTML={{ __html: depois }} />}
          <ChamadaLanding slug={p.slug} variante="clara" />

          {p.autor && (
            <section className="mt-10 flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-[#e6e6e2]">
              {p.autor.foto ? (
                // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem
                <img src={p.autor.foto} alt={p.autor.nome} width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#070707] font-[family-name:var(--blog-titulo)] text-2xl font-bold text-white">{p.autor.nome.slice(0, 1)}</span>
              )}
              <div>
                <p className="font-[family-name:var(--blog-mono)] text-[11px] uppercase tracking-widest text-[#656565]">Escrito por</p>
                <Link href={`/blog/autor/${p.autor.slug}`} className="font-[family-name:var(--blog-titulo)] text-xl font-bold hover:text-[#d80d12]">{p.autor.nome}</Link>
                {p.autor.cargo && <p className="text-[13px] text-[#656565]">{p.autor.cargo}</p>}
                {p.autor.bio && <p className="mt-2 text-[14px] text-[#4a4a4a]">{p.autor.bio}</p>}
              </div>
            </section>
          )}

          <section className="mt-10 rounded-2xl bg-[#070707] p-6 text-white">
            <p className="font-[family-name:var(--blog-titulo)] text-3xl font-extrabold uppercase leading-none">Gostou? Receba os próximos no seu e-mail</p>
            <p className="mt-2 text-[14px] text-white/70">Conteúdo prático de marketing e vendas, sem enrolação.</p>
            <div className="mt-4"><Newsletter origem={`artigo:${p.slug}`} /></div>
          </section>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mx-auto mt-14 max-w-5xl border-t border-[#e6e6e2] pt-10">
          <h2 className="mb-6 font-[family-name:var(--blog-titulo)] text-3xl font-extrabold uppercase">Continue lendo</h2>
          <div className="grid gap-6 sm:grid-cols-3">{relacionados.map((r) => <CartaoPost key={r.id} p={r} />)}</div>
        </section>
      )}
    </article>
  )
}
