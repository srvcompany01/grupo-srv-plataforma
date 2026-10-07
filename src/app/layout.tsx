import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'

const sora = Sora({ variable: '--font-sora', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grupo SRV',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full bg-fundo text-texto">{children}</body>
    </html>
  )
}
