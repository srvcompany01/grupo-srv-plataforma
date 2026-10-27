import { headers } from 'next/headers'
import { ehRobo, origemDaBio, slugValido } from '@/dominio/bio'
import { criarClientePublico } from '@/infra/supabase/publico'
import { hashDoVisitante } from '../visitante'

/**
 * Visualização da página da bio: o navegador avisa depois que a página abriu (sendBeacon). Conta a visualização e,
 * pelo hash diário de IP + aparelho, as pessoas distintas do dia. Robôs não contam.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slugValido(slug)) return new Response(null, { status: 404 })
  const h = await headers()
  const agente = h.get('user-agent')
  if (ehRobo(agente)) return new Response(null, { status: 204 })
  const hash = hashDoVisitante(slug, h)
  await criarClientePublico().rpc('bio_visualizacao', { p_slug: slug, p_origem: origemDaBio(new URL(req.url).searchParams.get('o')), p_hash: hash })
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
