import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans, Sometype_Mono } from 'next/font/google'
import { ConfirmarProvider } from '@/componentes/ConfirmarProvider'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], weight: ['500', '600', '700', '800'] })
const sometype = Sometype_Mono({ variable: '--font-sometype', subsets: ['latin'], weight: ['400', '500'] })

export const metadata: Metadata = {
  title: 'Grupo SRV',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f8f9fa' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jakarta.variable} ${sometype.variable} h-full antialiased`}>
      <body className="min-h-full bg-fundo text-texto"><ConfirmarProvider>{children}</ConfirmarProvider></body>
    </html>
  )
}
