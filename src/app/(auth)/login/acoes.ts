'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { opcoesRealtime } from '@/infra/supabase/realtime'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { urlBase } from '@/lib/url'

export type Estado = { erro?: string; ok?: string } | null

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function lerEmail(form: FormData): string | null {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  return EMAIL.test(email) ? email : null
}

/**
 * Cliente sem PKCE: os links enviados por e-mail funcionam mesmo abertos em outro aparelho
 * (ex.: pedido no computador, aberto no celular). A sessão chega no fragmento da URL.
 */
function clienteLinkPorEmail() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false },
    realtime: opcoesRealtime,
  })
}

export async function entrar(_: Estado, form: FormData): Promise<Estado> {
  const email = lerEmail(form)
  const senha = String(form.get('senha') ?? '')
  if (!email || !senha) return { erro: 'Informe e-mail e senha.' }
  const sb = await criarClienteServidor()
  const { error } = await sb.auth.signInWithPassword({ email, password: senha })
  if (error) return { erro: 'E-mail ou senha incorretos.' }
  // Veio da tela de autorização do app do Claude (OAuth do MCP): volta para ela.
  const pote = await cookies()
  const voltar = pote.get('voltar')?.value
  if (voltar?.startsWith('/oauth/autorizar?')) {
    pote.delete('voltar')
    redirect(voltar)
  }
  redirect('/')
}

const RESPOSTA_NEUTRA = 'Se o e-mail estiver cadastrado, enviamos um link para ele. Confira também a caixa de spam.'

export async function enviarLink(_: Estado, form: FormData): Promise<Estado> {
  const email = lerEmail(form)
  if (!email) return { erro: 'Informe um e-mail válido.' }
  const { error } = await clienteLinkPorEmail().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${await urlBase()}/auth/confirmar` },
  })
  if (error?.status === 429) return { erro: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' }
  return { ok: RESPOSTA_NEUTRA }
}

export async function esqueciSenha(_: Estado, form: FormData): Promise<Estado> {
  const email = lerEmail(form)
  if (!email) return { erro: 'Informe um e-mail válido.' }
  const { error } = await clienteLinkPorEmail().auth.resetPasswordForEmail(email, {
    redirectTo: `${await urlBase()}/auth/confirmar`,
  })
  if (error?.status === 429) return { erro: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' }
  return { ok: RESPOSTA_NEUTRA }
}

export async function definirSenha(_: Estado, form: FormData): Promise<Estado> {
  const senha = String(form.get('senha') ?? '')
  const confirmacao = String(form.get('confirmacao') ?? '')
  if (senha.length < 8) return { erro: 'A senha precisa ter pelo menos 8 caracteres.' }
  if (senha !== confirmacao) return { erro: 'As senhas não conferem.' }
  const sb = await criarClienteServidor()
  const { data } = await sb.auth.getClaims()
  if (!data?.claims) return { erro: 'Seu link expirou. Peça um novo.' }
  const { error } = await sb.auth.updateUser({ password: senha })
  if (error) return { erro: 'Não foi possível salvar a senha. Tente outra.' }
  redirect('/')
}

export async function sair() {
  const sb = await criarClienteServidor()
  await sb.auth.signOut()
  redirect('/login')
}
