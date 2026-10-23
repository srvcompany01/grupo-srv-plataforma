import { sincronizarComentarios } from '@/servicos/comentarios-redes'
import { publicarVencidos } from '@/servicos/publicacao-meta'

// Vídeos do Instagram podem levar alguns minutos para processar.
export const maxDuration = 300

/**
 * Publica os posts de conteúdo vencidos e, a cada 15 minutos, lê os comentários novos das redes dos clientes. Chamada a cada 5 minutos pelo pg_cron do Supabase (ou por qualquer agendador)
 * com `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return new Response('Não autorizado', { status: 401 })
  try {
    const publicados = await publicarVencidos()
    // Comentários do Instagram e do Facebook: a cada 15 minutos (esta rotina roda a cada 5).
    const comentarios = new Date().getUTCMinutes() % 15 < 5 ? await sincronizarComentarios().catch((e) => ({ erro: e instanceof Error ? e.message : 'falha' })) : null
    return Response.json({ publicados, comentarios })
  } catch (e) {
    console.error(e)
    return Response.json({ erro: 'Falha ao publicar' }, { status: 500 })
  }
}
export const POST = GET
