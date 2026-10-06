import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans, Sometype_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const jakarta = Plus_Jakarta_Sans({ variable: '--font-plus-jakarta', subsets: ['latin'] })
const sometype = Sometype_Mono({ variable: '--font-sometype-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grupo SRV',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jakarta.variable} ${sometype.variable} h-full antialiased`}>
      <body className="min-h-full bg-fundo text-texto">{children}</body>
    </html>
  )
}
