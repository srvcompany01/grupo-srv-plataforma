import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { hashToken, tokenDoCabecalho, type EscopoToken } from '@/dominio/api-token'
import { criarClienteAdmin } from './supabase/admin'
import { opcoesRealtime } from './supabase/realtime'
import type { Supabase } from './supabase/servidor'
import type { Database } from './supabase/tipos'

export type SessaoApi = { tokenId: string; userId: string; nome: string; papel: string; escopo: EscopoToken }

/** Confere o Bearer token (hash no banco, validade, revogação e perfil ativo da equipe). null = não autorizado. */
export async function autenticarApi(req: Request): Promise<SessaoApi | null> {
  const token = tokenDoCabecalho(req.headers.get('authorization'))
  if (!token) return null
  const admin = criarClienteAdmin()
  const { data, error } = await admin
    .from('api_tokens')
    .select('id, user_id, scope, expires_at, revoked_at, last_used_at, profiles(full_name, role, active)')
    .eq('token_hash', await hashToken(token))
    .maybeSingle()
  if (error || !data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null
  const perfil = data.profiles as { full_name: string; role: string; active: boolean } | null
  if (!perfil?.active || perfil.role === 'cliente') return null
  // Registra o uso no máximo uma vez por minuto (não atrasa a resposta).
  if (!data.last_used_at || Date.now() - new Date(data.last_used_at).getTime() > 60_000) {
    void admin.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id).then(() => undefined)
  }
  return { tokenId: data.id, userId: data.user_id, nome: perfil.full_name, papel: perfil.role, escopo: data.scope as EscopoToken }
}

const cache = new Map<string, { sb: Supabase; expira: number }>()

/**
 * Cliente do Supabase que age COMO a pessoa dona do token: a RLS vale igual à do app.
 * Sem JWT secret: a service role gera um link mágico (sem enviar e-mail) e o troca por uma sessão curta do usuário.
 * Reaproveitada em memória até perto de expirar.
 */
export async function clienteDoUsuario(userId: string): Promise<Supabase> {
  const guardado = cache.get(userId)
  if (guardado && guardado.expira > Date.now()) return guardado.sb
  const admin = criarClienteAdmin()
  const { data: usuario, error: e1 } = await admin.auth.admin.getUserById(userId)
  if (e1 || !usuario.user?.email) throw new Error('Usuário do token não encontrado')
  const { data: link, error: e2 } = await admin.auth.admin.generateLink({ type: 'magiclink', email: usuario.user.email })
  if (e2 || !link.properties?.hashed_token) throw new Error('Não foi possível abrir a sessão do usuário')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const opcoes = { persistSession: false, autoRefreshToken: false }
  const { data: sessao, error: e3 } = await createClient<Database>(url, anon, { auth: opcoes, realtime: opcoesRealtime }).auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink',
  })
  if (e3 || !sessao.session) throw new Error('Não foi possível abrir a sessão do usuário')
  const sb = createClient<Database>(url, anon, {
    auth: opcoes,
    realtime: opcoesRealtime,
    global: { headers: { Authorization: `Bearer ${sessao.session.access_token}` } },
  })
  cache.set(userId, { sb, expira: (sessao.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000 - 5 * 60_000 })
  return sb
}
