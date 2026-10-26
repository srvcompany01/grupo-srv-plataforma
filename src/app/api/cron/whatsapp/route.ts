import { criarClienteAdmin } from '@/infra/supabase/admin'
import { avisarSemResposta } from '@/servicos/atendimento'

/**
 * Vercel Cron (vercel.json), todo dia às 4h de Belém: apaga o texto das conversas com mais de 90 dias
 * (as métricas e as vendas ficam; só o texto das mensagens some).
 */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  const admin = criarClienteAdmin()
  const { data, error } = await admin.rpc('apagar_mensagens_antigas')
  if (error) return Response.json({ erro: error.message }, { status: 500 })
  // Rede de segurança dos avisos de conversa sem resposta (o webhook já confere a cada mensagem nova).
  const { data: funis } = await admin.from('kommo_funis').select('client_id')
  let avisos = 0
  for (const c of new Set((funis ?? []).map((f) => f.client_id))) avisos += await avisarSemResposta(c).catch(() => 0)
  return Response.json({ mensagensApagadas: data, avisos })
}
