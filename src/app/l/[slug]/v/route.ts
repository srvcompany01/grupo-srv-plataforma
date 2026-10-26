import { createHmac } from 'node:crypto'
import { headers } from 'next/headers'
import { ehRobo, origemDaBio, slugValido } from '@/dominio/bio'
import { criarClientePublico } from '@/infra/supabase/publico'

// Sal só deste servidor: sem ele o hash de IP + aparelho poderia ser desfeito por força bruta.
const SAL = process.env.BIO_SAL ?? process.env.SESSAO_SEGREDO ?? crypto.randomUUID()

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
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim()
  const dia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Belem' })
  const hash = createHmac('sha256', SAL).update(`${slug}|${dia}|${ip}|${agente}`).digest('hex').slice(0, 32)
  await criarClientePublico().rpc('bio_visualizacao', { p_slug: slug, p_origem: origemDaBio(new URL(req.url).searchParams.get('o')), p_hash: hash })
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
