import { publicarVencidos } from '@/servicos/publicacao-meta'

// Vídeos do Instagram podem levar alguns minutos para processar.
export const maxDuration = 300

/**
 * Publica os posts de conteúdo vencidos. Chamada a cada 5 minutos pelo pg_cron do Supabase (ou por qualquer agendador)
 * com `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  try {
    return Response.json({ publicados: await publicarVencidos() })
  } catch (e) {
    console.error(e)
    return Response.json({ erro: 'Falha ao publicar' }, { status: 500 })
  }
}
export const POST = GET
