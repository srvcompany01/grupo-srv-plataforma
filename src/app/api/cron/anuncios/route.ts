import { dataDeHoje } from '@/dominio/filtros'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { avisarTokenMeta } from '@/servicos/avisos-admin'
import { avisarCampanhasParadas } from '@/servicos/controle-anuncios'

export const maxDuration = 300

/** Vercel Cron (vercel.json), todo dia às 9h de Belém: campanha ligada sem gasto há 2 dias e token da Meta vencendo avisam no sino. */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  const tokenMeta = await avisarTokenMeta().catch((e) => (console.error('Token da Meta', e), false))
  try {
    return Response.json({ tokenMeta, clientesAvisados: await avisarCampanhasParadas(await listarClientes(criarClienteAdmin()), dataDeHoje(new Date())) })
  } catch (e) {
    console.error(e)
    return Response.json({ erro: 'Falha ao verificar as campanhas' }, { status: 500 })
  }
}
