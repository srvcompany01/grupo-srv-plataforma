import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { ConfirmarProvider } from '@/componentes/ConfirmarProvider'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const outfit = Outfit({ variable: '--font-outfit', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grupo SRV',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f6f7f9' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full bg-fundo text-texto"><ConfirmarProvider>{children}</ConfirmarProvider></body>
    </html>
  )
}
