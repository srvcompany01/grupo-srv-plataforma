import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { googleConfigurado, urlDeConsentimento } from '@/servicos/google-agenda'

// Início do OAuth do Google Agenda: guarda um estado aleatório em cookie e manda para o consentimento do Google.
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel === 'cliente') return NextResponse.redirect(new URL('/login', req.url))
  if (!googleConfigurado()) return NextResponse.redirect(new URL('/agenda?google=sem-config', req.url))
  const estado = randomBytes(24).toString('base64url')
  const res = NextResponse.redirect(urlDeConsentimento(new URL(req.url).origin, estado))
  res.cookies.set('google_estado', estado, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/google', maxAge: 600 })
  return res
}
