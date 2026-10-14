import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { ConfirmarProvider } from '@/componentes/ConfirmarProvider'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const cormorant = Cormorant_Garamond({ variable: '--font-cormorant', subsets: ['latin'], weight: ['500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Grupo SRV',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f7f3ed' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full bg-fundo text-texto"><ConfirmarProvider>{children}</ConfirmarProvider></body>
    </html>
  )
}
