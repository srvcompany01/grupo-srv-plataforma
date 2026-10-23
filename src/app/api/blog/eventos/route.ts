import { registrarEventos } from '@/servicos/blog'

/**
 * Eventos de leitura do artigo (vêm do navegador, por sendBeacon): visita, leitura engajada, rolagem 25/50/75/90,
 * cliques no CTA e em links internos, origem da visita. Sem nome, e-mail ou qualquer dado pessoal.
 */
export async function POST(req: Request) {
  try {
    const texto = await req.text()
    if (texto.length > 2000) return new Response(null, { status: 413 })
    const { slug, eventos } = JSON.parse(texto) as { slug?: unknown; eventos?: unknown }
    if (typeof slug === 'string' && /^[a-z0-9-]{1,90}$/.test(slug) && Array.isArray(eventos)) {
      await registrarEventos(slug, eventos.filter((e): e is string => typeof e === 'string' && e.length <= 60))
    }
  } catch {}
  return new Response(null, { status: 204 })
}
