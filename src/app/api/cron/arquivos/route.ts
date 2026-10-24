import { rodarCiclo } from '@/servicos/ciclo-arquivos'

export const maxDuration = 300

/** Vercel Cron (vercel.json), todo dia de madrugada: ciclo de renovação dos arquivos. */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  try {
    return Response.json({ arquivados: await rodarCiclo() })
  } catch (e) {
    console.error(e)
    return Response.json({ erro: 'Falha no ciclo de arquivos' }, { status: 500 })
  }
}
