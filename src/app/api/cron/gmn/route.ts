import { dataDeHoje } from '@/dominio/filtros'
import { fotografarPerfis, placesConfigurado, rodarMonitores } from '@/servicos/places'
import { relatoriosDoMes } from '@/servicos/relatorio-compartilhado'

export const maxDuration = 300

/**
 * Vercel Cron (vercel.json), todo dia às 8h de Belém: foto da nota e das avaliações no Google (avisa avaliação nova);
 * às segundas, o geogrid das palavras acompanhadas (avisa quando a posição piora); no dia 1, o relatório do mês
 * anterior de cada cliente (a equipe recebe no sino para enviar pelo WhatsApp).
 */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  const hoje = dataDeHoje(new Date())
  const perfis = placesConfigurado() ? await fotografarPerfis(hoje) : null
  const geogrid = placesConfigurado() && new Date().getUTCDay() === 1 ? await rodarMonitores() : null
  const relatorios = hoje.endsWith('-01') ? await relatoriosDoMes(hoje) : null
  return Response.json({ perfis, geogrid, relatorios })
}
