import { dataDeHoje } from '@/dominio/filtros'
import { fotografarPerfis, placesConfigurado } from '@/servicos/places'

export const maxDuration = 300

/** Vercel Cron (vercel.json), todo dia às 8h de Belém: foto da nota e das avaliações no Google; avisa avaliação nova. */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  if (!placesConfigurado()) return Response.json({ pulado: 'sem GOOGLE_PLACES_API_KEY' })
  return Response.json({ perfis: await fotografarPerfis(dataDeHoje(new Date())) })
}
