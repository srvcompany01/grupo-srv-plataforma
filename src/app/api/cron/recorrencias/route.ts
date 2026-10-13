import { criarClienteAdmin } from '@/infra/supabase/admin'
import { dataDeHoje } from '@/dominio/filtros'

/** Vercel Cron (vercel.json). A Vercel envia `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  const { data, error } = await criarClienteAdmin().rpc('gerar_recorrencias', { p_hoje: dataDeHoje(new Date()) })
  if (error) {
    console.error(error)
    return Response.json({ erro: 'Falha ao gerar' }, { status: 500 })
  }
  return Response.json({ criadas: data })
}
