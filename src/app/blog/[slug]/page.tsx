import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CartaoPost, ChamadaLanding, JsonLd, Meta, SeloCategoria, dataCurta } from '@/componentes/blog/Pecas'
import { MedirLeitura, Newsletter } from '@/componentes/blog/Newsletter'
import { SITE, contarPalavras, dividirParaChamada, extrairFaq, renderizar, sumario } from '@/dominio/blog'
import { contextoMarca, postPublicado, publicados, type Post } from '@/servicos/blog'

export const revalidate = 300

const urlDo = (p: Post) => p.canonical || `${SITE}/blog/${p.slug}`

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const p = await postPublicado((await params).slug)
  if (!p) return { title: 'Artigo não encontrado', robots: { index: false } }
  const url = urlDo(p)
  const ogTitulo = p.ogTitulo || p.seoTitulo || p.titulo
  const ogDescricao = p.ogDescricao || p.resumo
  const imagem = p.capa ? [{ url: `${SITE}${p.capa}`, alt: p.capaAlt, width: 1200, height: 630 }] : undefined
  return {
    title: p.seoTitulo || p.titulo,
    description: p.resumo,
    keywords: [p.palavraChave, ...p.palavrasSecundarias].filter(Boolean),
    alternates: { canonical: url },
    robots: p.indexar
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }
      : { index: false, follow: true },
    openGraph: {
      type: 'article', url, title: ogTitulo, description: ogDescricao, locale: 'pt_BR', siteName: 'Grupo SRV', publishedTime: p.publicadoEm, modifiedTime: p.atualizadoEm,
      authors: p.autor ? [`${SITE}/blog/autor/${p.autor.slug}`] : undefined, section: p.categoria?.nome, tags: p.tags.length ? p.tags : undefined, images: imagem,
    },
    twitter: { card: 'summary_large_image', title: ogTitulo, description: ogDescricao, images: p.capa ? [{ url: `${SITE}${p.capa}`, alt: p.capaAlt }] : undefined },
  }
}

/**
 * Artigo: breadcrumb, título e subtítulo, para quem é, autor e datas, capa com legenda, sumário, texto com CTA no meio
 * e/ou no fim, FAQ, autor, aviso editorial, tags, relacionados e newsletter. Dados estruturados completos
 * (BlogPosting, Person, Organization, ImageObject, BreadcrumbList e FAQPage quando o FAQ está no texto).
 */
export default async function Artigo({ params }: PageProps<'/blog/[slug]'>) {
  const p = await postPublicado((await params).slug)
  if (!p) notFound()
  const [marca, relacionadosEscolhidos] = await Promise.all([contextoMarca().catch(() => ({}) as Record<string, string | boolean>), p.relacionadosIds.length ? publicados({ ids: p.relacionadosIds, limite: 4 }).then((r) => r.posts) : Promise.resolve([])])
  const relacionados = relacionadosEscolhidos.length ? relacionadosEscolhidos : (await publicados({ categoriaId: p.categoria?.id, excluir: p.id, limite: 3 })).posts
  const [antes, depois] = dividirParaChamada(renderizar(p.conteudo))
  const indice = sumario(p.conteudo).filter((t) => t.nivel === 2)
  const faq = extrairFaq(p.conteudo)
  const url = urlDo(p)
  const atualizado = p.atualizadoEm.slice(0, 10) > p.publicadoEm.slice(0, 10)
  const cta = p.cta.label || p.cta.url ? p.cta : undefined
  const meio = p.cta.posicao !== 'final' && !!depois
  const final = p.cta.posicao !== 'meio' || !depois
  const nomeMarca = String(marca.brand_name || 'Grupo SRV')
  const org = { '@type': 'Organization', '@id': `${SITE}/#organizacao`, name: nomeMarca, url: SITE, logo: `${SITE}/marca/simbolo.png` }
  const autor = p.autor
    ? p.autor.slug === 'equipe-grupo-srv'
      ? org
      : { '@type': 'Person', '@id': `${SITE}/blog/autor/${p.autor.slug}#pessoa`, name: p.autor.nome, url: `${SITE}/blog/autor/${p.autor.slug}`, jobTitle: p.autor.cargo || undefined, description: p.autor.bio || undefined, image: p.autor.foto ? `${SITE}${p.autor.foto}` : undefined, sameAs: p.autor.links.length ? p.autor.links : undefined, worksFor: { '@id': `${SITE}/#organizacao` } }
    : org

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <MedirLeitura slug={p.slug} />
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@graph': [
            org,
            {
              '@type': 'BlogPosting', '@id': `${url}#artigo`, headline: p.titulo, alternativeHeadline: p.subtitulo || undefined, description: p.resumo, url, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
              datePublished: p.publicadoEm, dateModified: p.atualizadoEm, inLanguage: 'pt-BR', wordCount: contarPalavras(p.conteudo),
              image: p.capa ? { '@type': 'ImageObject', url: `${SITE}${p.capa}`, caption: p.capaLegenda || p.capaAlt, creditText: p.capaCredito || undefined, width: 1200, height: 630 } : undefined,
              keywords: [p.palavraChave, ...p.palavrasSecundarias, ...p.tags].filter(Boolean).join(', ') || undefined,
              articleSection: p.categoria?.nome, about: p.tema || p.palavraChave ? { '@type': 'Thing', name: p.tema || p.palavraChave } : undefined,
              mentions: p.entidades.length ? p.entidades.map((name) => ({ '@type': 'Thing', name })) : undefined,
              audience: p.publico ? { '@type': 'Audience', audienceType: p.publico } : undefined,
              isPartOf: { '@type': 'Blog', '@id': `${SITE}/blog#blog`, name: `Blog ${nomeMarca}`, url: `${SITE}/blog` },
              author: autor, publisher: { '@id': `${SITE}/#organizacao` }, copyrightHolder: { '@id': `${SITE}/#organizacao` }, copyrightYear: Number(p.publicadoEm.slice(0, 4)),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE}/blog` },
                ...(p.categoria ? [{ '@type': 'ListItem', position: 2, name: p.categoria.nome, item: `${SITE}/blog/categoria/${p.categoria.slug}` }] : []),
                { '@type': 'ListItem', position: p.categoria ? 3 : 2, name: p.breadcrumb || p.titulo, item: url },
              ],
            },
            ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.pergunta, acceptedAnswer: { '@type': 'Answer', text: f.resposta } })) }] : []),
          ],
        }}
      />
      <nav aria-label="Você está em" className="mb-6 text-[12px] text-[#656565]">
        <Link href="/blog" className="hover:text-[#070707]">Blog</Link>
        {p.categoria && <> <span aria-hidden>/</span> <Link href={`/blog/categoria/${p.categoria.slug}`} className="hover:text-[#070707]">{p.categoria.nome}</Link></>}
        <> <span aria-hidden>/</span> <span className="text-[#2a2a2a]">{p.breadcrumb || p.titulo}</span></>
      </nav>

      <header className="mx-auto max-w-3xl space-y-4 text-center">
        {p.categoria && <SeloCategoria c={p.categoria} />}
        <h1 className="font-[family-name:var(--blog-titulo)] text-4xl font-extrabold uppercase leading-[0.95] md:text-6xl">{p.titulo}</h1>
        {p.subtitulo && <p className="font-[family-name:var(--blog-titulo)] text-2xl font-semibold leading-tight text-[#2a2a2a]">{p.subtitulo}</p>}
        <p className="text-[18px] text-[#4a4a4a]">{p.resumo}</p>
        <div className="flex justify-center"><Meta p={p} /></div>
        {p.publico && (
          <p className="mx-auto inline-flex max-w-2xl items-start gap-2 rounded-xl border border-[#e6e6e2] bg-white px-4 py-2.5 text-left text-[14px] text-[#2a2a2a]">
            <span className="shrink-0 font-[family-name:var(--blog-mono)] text-[11px] font-semibold uppercase tracking-wider text-[#d80d12]">Para quem é</span>
            <span>{p.publico}</span>
          </p>
        )}
        {atualizado && <p className="text-[12px] text-[#656565]">Atualizado em <time dateTime={p.atualizadoEm}>{dataCurta(p.atualizadoEm)}</time>{p.notaAtualizacao ? `: ${p.notaAtualizacao}` : ''}</p>}
      </header>

      {p.capa && (
        <figure className="mx-auto mt-8 max-w-5xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem */}
          <img src={p.capa} alt={p.capaAlt} width={1200} height={630} fetchPriority="high" className="aspect-[1200/630] w-full rounded-2xl object-cover" />
          {(p.capaLegenda || p.capaCredito) && (
            <figcaption className="mt-2 text-center text-[12px] text-[#656565]">{p.capaLegenda}{p.capaLegenda && p.capaCredito ? ' · ' : ''}{p.capaCredito && `Imagem: ${p.capaCredito}`}</figcaption>
          )}
        </figure>
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
        <div className="min-w-0" data-artigo>
          <div className="artigo-blog" dangerouslySetInnerHTML={{ __html: antes }} />
          {meio && <ChamadaLanding slug={p.slug} cta={cta} />}
          {depois && <div className="artigo-blog" dangerouslySetInnerHTML={{ __html: depois }} />}
          {final && <ChamadaLanding slug={p.slug} variante={meio ? 'clara' : 'escura'} cta={cta} />}

          {p.tags.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Tags">
              {p.tags.map((t) => <li key={t} className="rounded-md border border-[#e6e6e2] bg-white px-3 py-1 text-[12px] text-[#4a4a4a]">#{t}</li>)}
            </ul>
          )}
          {p.aviso && <p className="mt-6 rounded-xl bg-[#f0f0ec] px-4 py-3 text-[13px] text-[#4a4a4a]"><strong className="text-[#070707]">Nota editorial:</strong> {p.aviso}</p>}

          {p.autor && (
            <section className="mt-10 flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-[#e6e6e2]">
              {p.autor.foto ? (
                // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem
                <img src={p.autor.foto} alt={p.autor.nome} width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#070707] font-[family-name:var(--blog-titulo)] text-2xl font-bold text-claro">{p.autor.nome.slice(0, 1)}</span>
              )}
              <div>
                <p className="font-[family-name:var(--blog-mono)] text-[11px] uppercase tracking-widest text-[#656565]">Escrito por</p>
                <Link href={`/blog/autor/${p.autor.slug}`} className="font-[family-name:var(--blog-titulo)] text-xl font-bold hover:text-[#d80d12]">{p.autor.nome}</Link>
                {p.autor.cargo && <p className="text-[13px] text-[#656565]">{p.autor.cargo}</p>}
                {p.autor.bio && <p className="mt-2 text-[14px] text-[#4a4a4a]">{p.autor.bio}</p>}
              </div>
            </section>
          )}

          <section className="mt-10 rounded-2xl bg-[#070707] p-6 text-claro">
            <p className="font-[family-name:var(--blog-titulo)] text-3xl font-extrabold uppercase leading-none">Gostou? Receba os próximos no seu e-mail</p>
            <p className="mt-2 text-[14px] text-claro/70">Conteúdo prático de marketing e vendas, sem enrolação.</p>
            <div className="mt-4"><Newsletter origem={`artigo:${p.slug}`} /></div>
          </section>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mx-auto mt-14 max-w-5xl border-t border-[#e6e6e2] pt-10">
          <h2 className="mb-6 font-[family-name:var(--blog-titulo)] text-3xl font-extrabold uppercase">Continue lendo</h2>
          <div className={`grid gap-6 ${relacionados.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>{relacionados.map((r) => <CartaoPost key={r.id} p={r} />)}</div>
        </section>
      )}
    </article>
  )
}
