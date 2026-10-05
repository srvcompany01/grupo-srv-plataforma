'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_SESSAO, DURACAO_SESSAO_MS, criarCookieSessao, senhaConfere } from '@/infra/sessao'

export async function entrar(_: { erro: string } | null, form: FormData): Promise<{ erro: string } | null> {
  const senha = String(form.get('senha') ?? '')
  const correta = process.env.ADMIN_SENHA ?? ''
  const segredo = process.env.SESSAO_SEGREDO ?? ''
  if (!correta || !segredo) return { erro: 'Painel sem ADMIN_SENHA/SESSAO_SEGREDO configurados.' }
  if (!senhaConfere(senha, correta)) {
    await new Promise((r) => setTimeout(r, 1000))
    return { erro: 'Senha incorreta.' }
  }
  ;(await cookies()).set(COOKIE_SESSAO, criarCookieSessao(segredo, Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACAO_SESSAO_MS / 1000,
  })
  redirect('/admin')
}
