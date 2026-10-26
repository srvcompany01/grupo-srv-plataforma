import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { opcoesRealtime } from './realtime'
import type { Database } from './tipos'

/**
 * Cliente com a chave mestra: IGNORA a RLS. Usos permitidos (e só estes):
 * - convidar usuários e definir papel/ativo (config/usuarios/acoes.ts), sempre após exigirAdmin();
 * - scripts/criar-admin.ts;
 * - formulário público (app/f/[token]): só a RPC enviar_formulario e a leitura do formulário ativo;
 * - Google Agenda (servicos/google-agenda.ts): vínculo OAuth (refresh token) e sincronização dos compromissos com o Google de cada pessoa;
 * - publicação de posts na Meta (servicos/publicacao-meta.ts, rotina /api/cron/publicar) e a resposta do cliente no portal
 *   (aprovar/pedir ajuste), sempre depois de conferir que o post é do cliente logado;
 * - endpoint público de leads das landing pages (app/api/leads): grava em landing_leads e envia o formulário de leads;
 * - webhook da Evolution API (app/api/whatsapp/eventos): grava o evento só depois de conferir o segredo.
 */
export function criarClienteAdmin() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!chave) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente')
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: opcoesRealtime,
  })
}
