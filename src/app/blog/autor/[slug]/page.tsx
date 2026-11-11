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
    <div>
      <JsonLd dados={{ '@context': 'https://schema.org', '@type': a.slug === 'equipe-grupo-srv' ? 'Organization' : 'Person', name: a.nome, description: a.bio, jobTitle: a.cargo || undefined, url: `${SITE}/blog/autor/${a.slug}`, image: a.foto ? `${SITE}${a.foto}` : undefined }} />
      <header>
        {a.foto ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem
          <img src={a.foto} alt={a.nome} width={96} height={96} />
        ) : (
          <span>{a.nome.slice(0, 1)}</span>
        )}
        <div>
          <h1>{a.nome}</h1>
          {a.cargo && <p>{a.cargo}</p>}
          {a.bio && <p>{a.bio}</p>}
        </div>
      </header>
      <h2>Artigos ({total})</h2>
      <div>{posts.map((p) => <CartaoPost key={p.id} p={p} />)}</div>
      <Paginacao base={`/blog/autor/${a.slug}`} pagina={pagina} total={total} porPagina={POR_PAGINA} />
    </div>
  )
}
