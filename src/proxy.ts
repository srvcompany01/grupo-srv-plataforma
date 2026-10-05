import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSAO, sessaoValida } from '@/infra/sessao'

// Barreira antes de qualquer renderização do admin. As páginas também checam (dbAdmin).
export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next()
  const valor = req.cookies.get(COOKIE_SESSAO)?.value
  if (sessaoValida(valor, process.env.SESSAO_SEGREDO ?? '', Date.now())) return NextResponse.next()
  return NextResponse.redirect(new URL('/admin/login', req.url))
}

export const config = { matcher: ['/admin', '/admin/:path*'] }
