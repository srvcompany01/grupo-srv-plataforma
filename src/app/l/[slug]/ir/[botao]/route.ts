import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { ehRobo, slugValido } from '@/dominio/bio'
import { criarClientePublico } from '@/infra/supabase/publico'

/** Toque em um botão da página da bio: conta (se não for robô) e manda para o WhatsApp do cliente ou para o link. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; botao: string }> }) {
  const { slug, botao } = await params
  if (!slugValido(slug) || !/^[a-z0-9-]{1,40}$/.test(botao)) return new Response('Link não encontrado.', { status: 404 })
  const contar = !ehRobo((await headers()).get('user-agent'))
  const { data } = await criarClientePublico().rpc('bio_botao', { p_slug: slug, p_botao: botao, p_contar: contar })
  const d = data?.[0]
  const destino = d?.url ?? (d?.whatsapp ? `https://wa.me/${d.whatsapp}?text=${encodeURIComponent(d.mensagem ?? '')}` : null)
  if (!destino) return new Response('Link não encontrado.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  const res = NextResponse.redirect(destino, 302)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('Referrer-Policy', 'no-referrer')
  return res
}
