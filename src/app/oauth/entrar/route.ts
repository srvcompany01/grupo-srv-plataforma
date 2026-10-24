import { NextResponse } from 'next/server'

/** Guarda para onde voltar depois do login (só a tela de autorização do OAuth) e manda para o login. */
export function GET(req: Request) {
  const voltar = new URL(req.url).searchParams.get('voltar') ?? ''
  const res = NextResponse.redirect(new URL('/login', req.url))
  if (voltar.startsWith('/oauth/autorizar?')) res.cookies.set('voltar', voltar, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 600 })
  return res
}
