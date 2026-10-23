import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './tipos'

/**
 * Cliente de visitante (chave pública, sem sessão e sem cookies): lê só o que a RLS libera para "anon".
 * Usado nas páginas públicas do blog, que assim podem ser geradas e guardadas em cache (melhor para o Google).
 */
export function criarClientePublico() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
