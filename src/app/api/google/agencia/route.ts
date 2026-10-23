import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { googleConfigurado } from '@/servicos/google-agenda'
import { urlConsentimentoAgencia } from '@/servicos/google-agencia'

// Início do OAuth da conta Google da AGÊNCIA (Google Ads + Meu Negócio). Só admin. Volta pelo mesmo /api/google/retorno.
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel !== 'admin') return NextResponse.redirect(new URL('/anuncios', req.url))
  if (!googleConfigurado()) return NextResponse.redirect(new URL('/anuncios?google=sem-config', req.url))
  const estado = `agencia.${randomBytes(24).toString('base64url')}`
  const res = NextResponse.redirect(urlConsentimentoAgencia(new URL(req.url).origin, estado))
  res.cookies.set('google_estado', estado, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/google', maxAge: 600 })
  return res
}
