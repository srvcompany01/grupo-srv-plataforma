import { ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { linkLanding } from '@/dominio/blog'
import type { Categoria, PostResumo } from '@/servicos/blog'

/** Peças visuais do blog (identidade da landing: vermelho #d80d12, preto, off-white, Barlow Condensed nos títulos). */

const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Belem' })
export const dataCurta = (iso: string) => data.format(new Date(iso)).replace('.', '')

export function SeloCategoria({ c }: { c: Categoria }) {
  return (
    <Link href={`/blog/categoria/${c.slug}`} className="inline-flex items-center gap-1.5 font-[family-name:var(--blog-mono)] text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.cor }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.cor }} aria-hidden />
      {c.nome}
    </Link>
  )
}

export function Meta({ p }: { p: PostResumo }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#656565]">
      {p.autor && <Link href={`/blog/autor/${p.autor.slug}`} className="font-medium text-[#2a2a2a] hover:underline">{p.autor.nome}</Link>}
      {p.autor && <span aria-hidden>·</span>}
      <time dateTime={p.publicadoEm}>{dataCurta(p.publicadoEm)}</time>
      {p.minutos > 0 && <><span aria-hidden>·</span><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{p.minutos} min de leitura</span></>}
    </p>
  )
}

function Capa({ p, className, prioridade }: { p: PostResumo; className: string; prioridade?: boolean }) {
  return (
    <div className={`overflow-hidden bg-[#f0f0ec] ${className}`}>
      {p.capa ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem (cache longo)
        <img src={p.capa} alt={p.capaAlt} width={1200} height={675} loading={prioridade ? 'eager' : 'lazy'} fetchPriority={prioridade ? 'high' : undefined} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="flex h-full w-full items-end p-4" style={{ background: `linear-gradient(135deg, ${p.categoria?.cor ?? '#d80d12'}, #070707)` }}>
          <span className="font-[family-name:var(--blog-titulo)] text-2xl font-bold uppercase leading-none text-white/90">{p.categoria?.nome ?? 'Grupo SRV'}</span>
        </div>
      )}
    </div>
  )
}

/** Card de artigo. `destaque`: grande, para a manchete da home. */
export function CartaoPost({ p, destaque, semCapa, prioridade }: { p: PostResumo; destaque?: boolean; semCapa?: boolean; prioridade?: boolean }) {
  return (
    <article className="group relative flex flex-col gap-3">
      {!semCapa && <Capa p={p} prioridade={prioridade} className={`rounded-xl ${destaque ? 'aspect-[16/9]' : 'aspect-[16/10]'}`} />}
      <div className="space-y-1.5">
        {p.categoria && <SeloCategoria c={p.categoria} />}
        <h3 className={`font-[family-name:var(--blog-titulo)] font-bold leading-[1.05] text-[#070707] ${destaque ? 'text-3xl md:text-[40px]' : 'text-[22px]'}`}>
          <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 hover:text-[#d80d12]">{p.titulo}</Link>
        </h3>
        {(destaque || !semCapa) && <p className={`text-[#4a4a4a] ${destaque ? 'text-[16px]' : 'line-clamp-2 text-[14px]'}`}>{p.resumo}</p>}
        <div className="relative z-10"><Meta p={p} /></div>
      </div>
    </article>
  )
}

/** Chamada para a landing (no meio e no fim dos artigos, e na home). */
export function ChamadaLanding({ slug, variante = 'escura' }: { slug: string; variante?: 'escura' | 'clara' }) {
  const escura = variante === 'escura'
  return (
    <aside className={`not-prose my-10 overflow-hidden rounded-2xl p-6 md:p-8 ${escura ? 'bg-[#070707] text-white' : 'border border-[#e6e6e2] bg-white text-[#070707]'}`}>
      <p className="font-[family-name:var(--blog-mono)] text-[11px] font-semibold uppercase tracking-widest text-[#d80d12]">Grupo SRV · Máquina de Vendas</p>
      <p className="mt-2 font-[family-name:var(--blog-titulo)] text-3xl font-bold uppercase leading-none md:text-4xl">Quer transformar isso em vendas na sua empresa?</p>
      <p className={`mt-3 max-w-xl text-[15px] ${escura ? 'text-white/75' : 'text-[#4a4a4a]'}`}>A Grupo SRV monta e opera o seu marketing de ponta a ponta: tráfego pago, redes sociais, Google e o processo comercial para atender cada lead.</p>
      <Link href={linkLanding(slug)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d80d12] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#a2070a]">
        Quero falar com um especialista <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  )
}

export function Paginacao({ base, pagina, total, porPagina }: { base: string; pagina: number; total: number; porPagina: number }) {
  const paginas = Math.ceil(total / porPagina)
  if (paginas <= 1) return null
  const url = (n: number) => (n === 1 ? base : `${base}${base.includes('?') ? '&' : '?'}pagina=${n}`)
  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Páginas">
      {pagina > 1 && <Link href={url(pagina - 1)} rel="prev" className="rounded-full border border-[#e6e6e2] px-4 py-2 text-[13px] font-medium hover:border-[#070707]">← Anteriores</Link>}
      <span className="px-2 text-[13px] text-[#656565]">Página {pagina} de {paginas}</span>
      {pagina < paginas && <Link href={url(pagina + 1)} rel="next" className="rounded-full border border-[#e6e6e2] px-4 py-2 text-[13px] font-medium hover:border-[#070707]">Mais artigos →</Link>}
    </nav>
  )
}

/** Dados estruturados (schema.org) em JSON-LD. */
export function JsonLd({ dados }: { dados: Record<string, unknown> }) {
  // JSON gerado aqui, com "<" escapado (não dá para fechar a tag <script>).
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, '\\u003c') }} />
}
