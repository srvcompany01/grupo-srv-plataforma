import { criarClienteAdmin } from '@/infra/supabase/admin'

/**
 * Vercel Cron (vercel.json), todo dia às 4h de Belém: apaga o texto das conversas com mais de 90 dias
 * (as métricas e as vendas ficam; só o texto das mensagens some).
 */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  const { data, error } = await criarClienteAdmin().rpc('apagar_mensagens_antigas')
  if (error) return Response.json({ erro: error.message }, { status: 500 })
  return Response.json({ mensagensApagadas: data })
}
