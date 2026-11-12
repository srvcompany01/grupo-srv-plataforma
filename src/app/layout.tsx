import type { Metadata, Viewport } from 'next'
import { ConfirmarProvider } from '@/componentes/ConfirmarProvider'
import './globals.css'
import '@/componentes/ui/base.css'


export const metadata: Metadata = {
  title: 'Grupo SRV',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body><ConfirmarProvider>{children}</ConfirmarProvider></body>
    </html>
  )
}
