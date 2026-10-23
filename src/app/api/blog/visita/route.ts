import { contarVisita } from '@/servicos/blog'

/** Visita a um artigo (vem do navegador): alimenta o "Mais lidos". */
export async function POST(req: Request) {
  try {
    const { slug } = (await req.json()) as { slug?: unknown }
    if (typeof slug === 'string' && /^[a-z0-9-]{1,90}$/.test(slug)) await contarVisita(slug)
  } catch {}
  return new Response(null, { status: 204 })
}
