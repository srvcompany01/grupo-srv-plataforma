import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CartaoPost, JsonLd, Paginacao } from '@/componentes/blog/Pecas'
import { SITE } from '@/dominio/blog'
import { autorPorSlug, publicados } from '@/servicos/blog'

export const revalidate = 300
const POR_PAGINA = 12

export async function generateMetadata({ params }: PageProps<'/blog/autor/[slug]'>): Promise<Metadata> {
  const a = await autorPorSlug((await params).slug)
  if (!a) return { robots: { index: false } }
  return { title: `${a.nome}: artigos`, description: a.bio.slice(0, 160) || `Artigos de ${a.nome} no blog da Grupo SRV.`, alternates: { canonical: `${SITE}/blog/autor/${a.slug}` } }
}

/** Página do autor (quem escreve e por que entende do assunto): ajuda o Google a confiar no conteúdo. */
export default async function PaginaAutor({ params, searchParams }: PageProps<'/blog/autor/[slug]'>) {
  const a = await autorPorSlug((await params).slug)
  if (!a) notFound()
  const pagina = Math.max(1, Number((await searchParams).pagina) || 1)
  const { posts, total } = await publicados({ autorId: a.id, limite: POR_PAGINA, pagina })
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd dados={{ '@context': 'https://schema.org', '@type': a.slug === 'equipe-grupo-srv' ? 'Organization' : 'Person', name: a.nome, description: a.bio, jobTitle: a.cargo || undefined, url: `${SITE}/blog/autor/${a.slug}`, image: a.foto ? `${SITE}${a.foto}` : undefined }} />
      <header className="flex flex-col gap-5 rounded-2xl bg-white p-6 ring-1 ring-[#e6e6e2] sm:flex-row sm:items-center">
        {a.foto ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem
          <img src={a.foto} alt={a.nome} width={96} height={96} className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#070707] font-[family-name:var(--blog-titulo)] text-4xl font-bold text-white">{a.nome.slice(0, 1)}</span>
        )}
        <div>
          <h1 className="font-[family-name:var(--blog-titulo)] text-4xl font-extrabold uppercase leading-none">{a.nome}</h1>
          {a.cargo && <p className="mt-1 text-[14px] text-[#656565]">{a.cargo}</p>}
          {a.bio && <p className="mt-3 max-w-2xl text-[15px] text-[#4a4a4a]">{a.bio}</p>}
        </div>
      </header>
      <h2 className="mt-10 font-[family-name:var(--blog-titulo)] text-3xl font-extrabold uppercase">Artigos ({total})</h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <CartaoPost key={p.id} p={p} />)}</div>
      <Paginacao base={`/blog/autor/${a.slug}`} pagina={pagina} total={total} porPagina={POR_PAGINA} />
    </div>
  )
}
