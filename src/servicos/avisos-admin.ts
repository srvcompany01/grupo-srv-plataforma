import { alertaDeErro, alertaDoTokenMeta } from '@/dominio/alertas'
import { criarClienteAdmin } from '@/infra/supabase/admin'

/** Aviso no sino de todos os admins ativos. Não repete o mesmo `link` + começo de mensagem dentro de `horas`. */
async function avisarAdmins(message: string, link: string, prefixo: string, horas: number): Promise<boolean> {
  const admin = criarClienteAdmin()
  const { count } = await admin.from('notifications').select('id', { count: 'exact', head: true }).eq('kind', 'alerta').eq('link', link).like('message', `${prefixo}%`).gte('created_at', new Date(Date.now() - horas * 3_600_000).toISOString())
  if (count) return false
  const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin').eq('active', true)
  if (!admins?.length) return false
  await admin.from('notifications').insert(admins.map((a) => ({ user_id: a.id, kind: 'alerta', message, link })))
  return true
}

/** Rotina diária: avisa quando o token da Meta está inválido ou a 10 dias de vencer (repete a cada 3 dias). */
export async function avisarTokenMeta(agora = Date.now()): Promise<boolean> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return false
  const versao = process.env.META_API_VERSION || 'v23.0'
  const r = await fetch(`https://graph.facebook.com/${versao}/debug_token?${new URLSearchParams({ input_token: token, access_token: token })}`, { cache: 'no-store' })
  const corpo = (await r.json().catch(() => null)) as { data?: { is_valid?: boolean; expires_at?: number } } | null
  const mensagem = alertaDoTokenMeta(corpo?.data ?? null, agora)
  return mensagem ? avisarAdmins(mensagem, '/config/integracoes', 'Token da Meta', 72) : false
}

/** Erro do servidor em produção: um aviso por endereço a cada 24 h e no máximo 20 linhas de aviso por dia, para o sino não encher. */
export async function avisarErro(mensagem: string, caminho: string, tipo: string, digest?: string): Promise<void> {
  const { count } = await criarClienteAdmin().from('notifications').select('id', { count: 'exact', head: true }).eq('kind', 'alerta').like('message', 'Erro na plataforma%').gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
  if ((count ?? 0) >= 20) return
  await avisarAdmins(alertaDeErro(mensagem, caminho, tipo, digest), caminho.split('?')[0] || '/', 'Erro na plataforma', 24)
}
