import { dataDeHoje } from '@/dominio/filtros'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { avisarResumoSemanal, avisarTokenMeta } from '@/servicos/avisos-admin'
import { avisarCampanhasParadas } from '@/servicos/controle-anuncios'

export const maxDuration = 300

/** Vercel Cron (vercel.json), todo dia às 9h de Belém: campanha ligada sem gasto há 2 dias e token da Meta vencendo avisam no sino; na segunda, o resumo da semana de cada cliente. */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  const tokenMeta = await avisarTokenMeta().catch((e) => (console.error('Token da Meta', e), false))
  try {
    const hoje = dataDeHoje(new Date())
    const clientes = await listarClientes(criarClienteAdmin())
    const clientesAvisados = await avisarCampanhasParadas(clientes, hoje)
    const segunda = new Date(`${hoje}T12:00:00Z`).getUTCDay() === 1
    const resumos = segunda ? await avisarResumoSemanal(clientes, hoje).catch((e) => (console.error('Resumo semanal', e), 0)) : null
    return Response.json({ tokenMeta, clientesAvisados, resumos })
  } catch (e) {
    console.error(e)
    return Response.json({ erro: 'Falha ao verificar as campanhas' }, { status: 500 })
  }
}
