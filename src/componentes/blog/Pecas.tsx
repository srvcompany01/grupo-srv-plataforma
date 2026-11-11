import { ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { linkLanding } from '@/dominio/blog'
import type { Categoria, PostResumo } from '@/servicos/blog'

/** Peças visuais do blog (identidade da landing: vermelho #d80d12, preto, off-white, Barlow Condensed nos títulos). */

const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Belem' })
export const dataCurta = (iso: string) => data.format(new Date(iso)).replace('.', '')

export function SeloCategoria({ c }: { c: Categoria }) {
  return (
    <Link href={`/blog/categoria/${c.slug}`} style={{ color: c.cor }}>
      <span style={{ background: c.cor }} aria-hidden />
      {c.nome}
    </Link>
  )
}

export function Meta({ p }: { p: PostResumo }) {
  return (
    <p>
      {p.autor && <Link href={`/blog/autor/${p.autor.slug}`}>{p.autor.nome}</Link>}
      {p.autor && <span aria-hidden>·</span>}
      <time dateTime={p.publicadoEm}>{dataCurta(p.publicadoEm)}</time>
      {p.minutos > 0 && <><span aria-hidden>·</span><span><Clock aria-hidden />{p.minutos} min de leitura</span></>}
    </p>
  )
}

function Capa({ p, className, prioridade }: { p: PostResumo; className?: string; prioridade?: boolean }) {
  return (
    <div>
      {p.capa ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem (cache longo)
        <img src={p.capa} alt={p.capaAlt} width={1200} height={675} loading={prioridade ? 'eager' : 'lazy'} fetchPriority={prioridade ? 'high' : undefined} />
      ) : (
        <div style={{ background: `linear-gradient(135deg, ${p.categoria?.cor ?? '#d80d12'}, #070707)` }}>
          <span>{p.categoria?.nome ?? 'Grupo SRV'}</span>
        </div>
      )}
    </div>
  )
}

/** Card de artigo. `destaque`: grande, para a manchete da home. */
export function CartaoPost({ p, destaque, semCapa, prioridade }: { p: PostResumo; destaque?: boolean; semCapa?: boolean; prioridade?: boolean }) {
  return (
    <article>
      {!semCapa && <Capa p={p} prioridade={prioridade} />}
      <div>
        {p.categoria && <SeloCategoria c={p.categoria} />}
        <h3>
          <Link href={`/blog/${p.slug}`}>{p.titulo}</Link>
        </h3>
        {(destaque || !semCapa) && <p>{p.resumo}</p>}
        <div><Meta p={p} /></div>
      </div>
    </article>
  )
}

/**
 * Chamada para a landing (no meio e no fim dos artigos, e na home). O artigo pode ter CTA próprio (texto, destino e
 * contexto); sem ele, vale a chamada padrão da Máquina de Vendas. `data-cta` alimenta a medição de cliques.
 */
export function ChamadaLanding({ slug, variante = 'escura', cta }: { slug: string; variante?: 'escura' | 'clara'; cta?: { label: string; url: string; contexto: string; label2?: string; url2?: string } }) {
  const escura = variante === 'escura'
  const destino = cta?.url ? (cta.url.startsWith('/') ? linkLanding(slug, cta.url) : cta.url) : linkLanding(slug)
  return (
    <aside>
      <p>Grupo SRV · Máquina de Vendas</p>
      <p>{cta?.label ? cta.label : 'Quer transformar isso em vendas na sua empresa?'}</p>
      <p>{cta?.contexto || 'A Grupo SRV implementa a Máquina de Vendas: um fluxo contínuo, previsível, controlável e escalável de vendas pela internet.'}</p>
      <div>
        <Link href={destino} data-cta="1">
          {cta?.label || 'Faça o pré-diagnóstico'} <ArrowRight />
        </Link>
        {cta?.label2 && cta.url2 && (
          <Link href={cta.url2} data-cta="2">{cta.label2}</Link>
        )}
      </div>
    </aside>
  )
}

export function Paginacao({ base, pagina, total, porPagina }: { base: string; pagina: number; total: number; porPagina: number }) {
  const paginas = Math.ceil(total / porPagina)
  if (paginas <= 1) return null
  const url = (n: number) => (n === 1 ? base : `${base}${base.includes('?') ? '&' : '?'}pagina=${n}`)
  return (
    <nav aria-label="Páginas">
      {pagina > 1 && <Link href={url(pagina - 1)} rel="prev">← Anteriores</Link>}
      <span>Página {pagina} de {paginas}</span>
      {pagina < paginas && <Link href={url(pagina + 1)} rel="next">Mais artigos →</Link>}
    </nav>
  )
}

/** Dados estruturados (schema.org) em JSON-LD. */
export function JsonLd({ dados }: { dados: Record<string, unknown> }) {
  // JSON gerado aqui, com "<" escapado (não dá para fechar a tag <script>).
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, '\\u003c') }} />
}
