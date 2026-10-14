import type { EscopoToken } from '@/dominio/api-token'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type TokenApi = { id: string; nome: string; escopo: EscopoToken; criadoEm: string; expiraEm: string; ultimoUso: string | null; revogado: boolean }

/** Os tokens da própria pessoa (a RLS não mostra os dos outros). */
export async function listarTokens(sb: Supabase): Promise<TokenApi[]> {
  const linhas = dados(await sb.from('api_tokens').select('id, name, scope, created_at, expires_at, last_used_at, revoked_at').order('created_at', { ascending: false }))
  return linhas.map((t) => ({ id: t.id, nome: t.name, escopo: t.scope as EscopoToken, criadoEm: t.created_at, expiraEm: t.expires_at, ultimoUso: t.last_used_at, revogado: !!t.revoked_at }))
}
