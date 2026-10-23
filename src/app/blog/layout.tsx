import type { Metadata } from 'next'
import { Barlow_Condensed, IBM_Plex_Mono, Inter } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { JsonLd } from '@/componentes/blog/Pecas'
import { LANDING_PADRAO, SITE } from '@/dominio/blog'
import { categorias } from '@/servicos/blog'

const titulo = Barlow_Condensed({ variable: '--blog-titulo', subsets: ['latin'], weight: ['600', '700', '800'] })
const texto = Inter({ variable: '--blog-texto', subsets: ['latin'] })
const mono = IBM_Plex_Mono({ variable: '--blog-mono', subsets: ['latin'], weight: ['500', '600'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Blog da Grupo SRV: marketing e vendas para empresas', template: '%s | Blog Grupo SRV' },
  description: 'Guias práticos de tráfego pago, redes sociais, Google e vendas para empresas que querem crescer com previsibilidade.',
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  alternates: { types: { 'application/rss+xml': `${SITE}/blog/feed.xml` } },
  openGraph: { siteName: 'Blog Grupo SRV', locale: 'pt_BR', type: 'website' },
}

export const revalidate = 300

/** Casca pública do blog: cabeçalho com as categorias e a chamada para a landing, rodapé institucional. */
export default async function LayoutBlog({ children }: { children: React.ReactNode }) {
  const cats = await categorias().catch(() => [])
  return (
    <div className={`${titulo.variable} ${texto.variable} ${mono.variable} min-h-dvh bg-[#f8f8f5] font-[family-name:var(--blog-texto)] text-[15px] text-[#070707]`}>
      <JsonLd dados={{ '@context': 'https://schema.org', '@type': 'Organization', name: 'Grupo SRV', url: SITE, logo: `${SITE}/marca/simbolo.png` }} />
      <header className="sticky top-0 z-40 border-b border-[#e6e6e2] bg-[#f8f8f5]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/blog" className="flex shrink-0 items-center gap-2" aria-label="Blog da Grupo SRV, início">
            <Image src="/marca/simbolo.png" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="font-[family-name:var(--blog-titulo)] text-xl font-extrabold uppercase tracking-wide">Grupo SRV <span className="text-[#d80d12]">Blog</span></span>
          </Link>
          <nav className="hidden flex-1 items-center gap-5 lg:flex" aria-label="Categorias">
            {cats.map((c) => <Link key={c.id} href={`/blog/categoria/${c.slug}`} className="text-[13px] font-medium text-[#2a2a2a] hover:text-[#d80d12]">{c.nome}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/blog/busca" aria-label="Buscar no blog" className="rounded-full p-2 hover:bg-[#f0f0ec]"><Search className="h-4 w-4" /></Link>
            <Link href={`${LANDING_PADRAO}?utm_source=blog&utm_medium=cabecalho`} className="whitespace-nowrap rounded-full bg-[#d80d12] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#a2070a]"><span className="hidden sm:inline">Fale com um especialista</span><span className="sm:hidden">Fale conosco</span></Link>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto border-t border-[#ececea] px-4 py-2 lg:hidden" aria-label="Categorias">
          {cats.map((c) => <Link key={c.id} href={`/blog/categoria/${c.slug}`} className="shrink-0 text-[13px] font-medium text-[#2a2a2a]">{c.nome}</Link>)}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="mt-16 bg-[#070707] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <p className="font-[family-name:var(--blog-titulo)] text-2xl font-extrabold uppercase">Grupo SRV</p>
            <p className="max-w-sm text-[14px] text-white/70">Agência de marketing e vendas: tráfego pago, redes sociais, Google e processo comercial para empresas que querem vender com previsibilidade.</p>
            <Link href={`${LANDING_PADRAO}?utm_source=blog&utm_medium=rodape`} className="inline-flex rounded-full bg-[#d80d12] px-4 py-2 text-[13px] font-semibold hover:bg-[#a2070a]">Conheça a Máquina de Vendas</Link>
          </div>
          <div>
            <p className="mb-3 font-[family-name:var(--blog-mono)] text-[11px] uppercase tracking-widest text-white/50">Assuntos</p>
            <ul className="space-y-2 text-[14px] text-white/80">{cats.map((c) => <li key={c.id}><Link href={`/blog/categoria/${c.slug}`} className="hover:text-white">{c.nome}</Link></li>)}</ul>
          </div>
          <div>
            <p className="mb-3 font-[family-name:var(--blog-mono)] text-[11px] uppercase tracking-widest text-white/50">Grupo SRV</p>
            <ul className="space-y-2 text-[14px] text-white/80">
              <li><Link href="/sobre" className="hover:text-white">Sobre</Link></li>
              <li><Link href="/calculadora?utm_source=blog&utm_medium=rodape" className="hover:text-white">Calculadora de ROI</Link></li>
              <li><Link href="/blog/autor/equipe-grupo-srv" className="hover:text-white">Nossos autores</Link></li>
              <li><Link href="/privacidade" className="hover:text-white">Política de Privacidade</Link></li>
              <li><a href="/blog/feed.xml" className="hover:text-white">RSS</a></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-[12px] text-white/50">© {new Date().getFullYear()} Grupo SRV. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
