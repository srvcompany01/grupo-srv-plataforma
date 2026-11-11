import type { Metadata } from 'next'
import { Barlow_Condensed, IBM_Plex_Mono, Inter } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { JsonLd } from '@/componentes/blog/Pecas'
import { LANDING_PADRAO, SITE } from '@/dominio/blog'
import { categorias, contextoMarca } from '@/servicos/blog'

const titulo = Barlow_Condensed({ variable: '--blog-titulo', subsets: ['latin'], weight: ['600', '700', '800'] })
const texto = Inter({ variable: '--blog-texto', subsets: ['latin'] })
const mono = IBM_Plex_Mono({ variable: '--blog-mono', subsets: ['latin'], weight: ['500', '600'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Blog da Grupo SRV: marketing e vendas para empresas', template: '%s | Blog Grupo SRV' },
  description: 'Guias práticos de tráfego pago, redes sociais, Google e vendas para empresas que querem crescer com previsibilidade.',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  alternates: { types: { 'application/rss+xml': `${SITE}/blog/feed.xml` } },
  openGraph: { siteName: 'Blog Grupo SRV', locale: 'pt_BR', type: 'website' },
}

export const revalidate = 300

/** Casca pública do blog: cabeçalho com as categorias e a chamada para a landing, rodapé institucional. */
export default async function LayoutBlog({ children }: { children: React.ReactNode }) {
  const [cats, marca] = await Promise.all([categorias().catch(() => []), contextoMarca().catch(() => ({}) as Record<string, string | boolean>)])
  const doc = (k: string) => (typeof marca[k] === 'string' && marca[k] ? String(marca[k]) : undefined)
  const perfis = (doc('same_as') ?? '').split(/\s+/).filter((l) => /^https:\/\//.test(l))
  return (
    <div>
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization', '@id': `${SITE}/#organizacao`, name: doc('brand_name') ?? 'Grupo SRV', url: SITE, logo: `${SITE}/marca/simbolo.png`, description: doc('brand_description'),
              founder: doc('founder_name') ? { '@type': 'Person', name: doc('founder_name') } : undefined, email: doc('institutional_email'), telephone: doc('institutional_phone'),
              sameAs: perfis.length ? perfis : undefined, makesOffer: doc('main_product') ? { '@type': 'Offer', itemOffered: { '@type': 'Service', name: doc('main_product'), description: doc('main_offer') } } : undefined,
            },
            { '@type': 'WebSite', '@id': `${SITE}/#site`, url: SITE, name: doc('brand_name') ?? 'Grupo SRV', inLanguage: 'pt-BR', publisher: { '@id': `${SITE}/#organizacao` } },
            { '@type': 'Blog', '@id': `${SITE}/blog#blog`, url: `${SITE}/blog`, name: `Blog ${doc('brand_name') ?? 'Grupo SRV'}`, inLanguage: 'pt-BR', publisher: { '@id': `${SITE}/#organizacao` } },
          ],
        }}
      />
      <header>
        <div>
          <Link href="/blog" aria-label="Blog da Grupo SRV, início">
            <Image src="/marca/simbolo.png" alt="" width={32} height={32} />
            <span>Grupo SRV <span>Blog</span></span>
          </Link>
          <nav className="hidden" aria-label="Categorias">
            {cats.map((c) => <Link key={c.id} href={`/blog/categoria/${c.slug}`}>{c.nome}</Link>)}
          </nav>
          <div>
            <Link href="/blog/busca" aria-label="Buscar no blog"><Search /></Link>
            <Link href={`${LANDING_PADRAO}?utm_source=blog&utm_medium=cabecalho`}><span className="hidden">Fale com um especialista</span><span>Fale conosco</span></Link>
          </div>
        </div>
        <nav aria-label="Categorias">
          {cats.map((c) => <Link key={c.id} href={`/blog/categoria/${c.slug}`}>{c.nome}</Link>)}
        </nav>
      </header>

      <main>{children}</main>

      <footer>
        <div>
          <div>
            <p>Grupo SRV</p>
            <p>Agência de marketing e vendas: tráfego pago, redes sociais, Google e processo comercial para empresas que querem vender com previsibilidade.</p>
            <Link href={`${LANDING_PADRAO}?utm_source=blog&utm_medium=rodape`}>Conheça a Máquina de Vendas</Link>
          </div>
          <div>
            <p>Assuntos</p>
            <ul>{cats.map((c) => <li key={c.id}><Link href={`/blog/categoria/${c.slug}`}>{c.nome}</Link></li>)}</ul>
          </div>
          <div>
            <p>Grupo SRV</p>
            <ul>
              <li><Link href="/sobre">Sobre</Link></li>
              <li><Link href="/calculadora?utm_source=blog&utm_medium=rodape">Calculadora de ROI</Link></li>
              <li><Link href="/blog/autor/equipe-grupo-srv">Nossos autores</Link></li>
              <li><Link href="/privacidade">Política de Privacidade</Link></li>
              <li><a href="/blog/feed.xml">RSS</a></li>
            </ul>
          </div>
        </div>
        <p>© {new Date().getFullYear()} Grupo SRV. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
