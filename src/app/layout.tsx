import type { Metadata, Viewport } from 'next'
import { Reddit_Sans } from 'next/font/google'
import { ConfirmarProvider } from '@/componentes/ConfirmarProvider'
import './globals.css'

const reddit = Reddit_Sans({ variable: '--font-reddit', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: 'Grupo SRV',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0e1113' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${reddit.variable} h-full antialiased`}>
      <body className="min-h-full bg-fundo text-texto"><ConfirmarProvider>{children}</ConfirmarProvider></body>
    </html>
  )
}
