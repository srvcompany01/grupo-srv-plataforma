import { NextResponse } from 'next/server'
import { criarClientePublico } from '@/infra/supabase/publico'

/**
 * Link da bio do cliente (www.gruposrv.com.br/l/<cliente>): conta o clique e abre o WhatsApp do cliente com a
 * mensagem pronta. Quem chega com essa mensagem veio do Instagram: a equipe confirma o lead na aba Performance.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return new Response('Link não encontrado.', { status: 404 })
  const { data } = await criarClientePublico().rpc('registrar_clique_bio', { p_slug: slug })
  const destino = data?.[0]
  if (!destino?.whatsapp) return new Response('Link não encontrado.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  const res = NextResponse.redirect(`https://wa.me/${destino.whatsapp}?text=${encodeURIComponent(destino.mensagem)}`, 302)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
