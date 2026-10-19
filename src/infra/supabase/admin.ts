import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { opcoesRealtime } from './realtime'
import type { Database } from './tipos'

/**
 * Cliente com a chave mestra: IGNORA a RLS. Usos permitidos (e só estes):
 * - convidar usuários e definir papel/ativo (config/usuarios/acoes.ts), sempre após exigirAdmin();
 * - scripts/criar-admin.ts;
 * - formulário público (app/f/[token]): só a RPC enviar_formulario e a leitura do formulário ativo;
 * - endpoint público de leads das landing pages (app/api/leads): grava em landing_leads e envia o formulário de leads.
 */
export function criarClienteAdmin() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!chave) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente')
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: opcoesRealtime,
  })
}
