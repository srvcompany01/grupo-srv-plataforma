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
    <article>
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
      <nav aria-label="Você está em">
        <Link href="/blog">Blog</Link>
        {p.categoria && <> <span aria-hidden>/</span> <Link href={`/blog/categoria/${p.categoria.slug}`}>{p.categoria.nome}</Link></>}
        <> <span aria-hidden>/</span> <span>{p.breadcrumb || p.titulo}</span></>
      </nav>

      <header>
        {p.categoria && <SeloCategoria c={p.categoria} />}
        <h1>{p.titulo}</h1>
        {p.subtitulo && <p>{p.subtitulo}</p>}
        <p>{p.resumo}</p>
        <div><Meta p={p} /></div>
        {p.publico && (
          <p>
            <span>Para quem é</span>
            <span>{p.publico}</span>
          </p>
        )}
        {atualizado && <p>Atualizado em <time dateTime={p.atualizadoEm}>{dataCurta(p.atualizadoEm)}</time>{p.notaAtualizacao ? `: ${p.notaAtualizacao}` : ''}</p>}
      </header>

      {p.capa && (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem */}
          <img src={p.capa} alt={p.capaAlt} width={1200} height={630} fetchPriority="high" />
          {(p.capaLegenda || p.capaCredito) && (
            <figcaption>{p.capaLegenda}{p.capaLegenda && p.capaCredito ? ' · ' : ''}{p.capaCredito && `Imagem: ${p.capaCredito}`}</figcaption>
          )}
        </figure>
      )}

      <div>
        <aside className="hidden lg:block">
          {indice.length > 1 && (
            <nav aria-label="Neste artigo">
              <p>Neste artigo</p>
              <ol>{indice.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.texto}</a></li>)}</ol>
            </nav>
          )}
        </aside>
        <div data-artigo>
          <div dangerouslySetInnerHTML={{ __html: antes }} />
          {meio && <ChamadaLanding slug={p.slug} cta={cta} />}
          {depois && <div dangerouslySetInnerHTML={{ __html: depois }} />}
          {final && <ChamadaLanding slug={p.slug} variante={meio ? 'clara' : 'escura'} cta={cta} />}

          {p.tags.length > 0 && (
            <ul aria-label="Tags">
              {p.tags.map((t) => <li key={t}>#{t}</li>)}
            </ul>
          )}
          {p.aviso && <p><strong>Nota editorial:</strong> {p.aviso}</p>}

          {p.autor && (
            <section>
              {p.autor.foto ? (
                // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem
                <img src={p.autor.foto} alt={p.autor.nome} width={64} height={64} />
              ) : (
                <span>{p.autor.nome.slice(0, 1)}</span>
              )}
              <div>
                <p>Escrito por</p>
                <Link href={`/blog/autor/${p.autor.slug}`}>{p.autor.nome}</Link>
                {p.autor.cargo && <p>{p.autor.cargo}</p>}
                {p.autor.bio && <p>{p.autor.bio}</p>}
              </div>
            </section>
          )}

          <section>
            <p>Gostou? Receba os próximos no seu e-mail</p>
            <p>Conteúdo prático de marketing e vendas, sem enrolação.</p>
            <div><Newsletter origem={`artigo:${p.slug}`} /></div>
          </section>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section>
          <h2>Continue lendo</h2>
          <div>{relacionados.map((r) => <CartaoPost key={r.id} p={r} />)}</div>
        </section>
      )}
    </article>
  )
}
