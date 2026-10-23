import { NextResponse } from 'next/server'
import { z } from 'zod'
import { criarClienteAdmin } from '@/infra/supabase/admin'

const Pedido = z.object({ nome: z.string().trim().max(80).optional().default(''), email: z.string().trim().toLowerCase().email().max(200), origem: z.string().max(120).optional().default(''), website: z.string().optional() })

/** Inscrição pública na newsletter do blog. Repetir o e-mail não dá erro (só reativa, se tinha cancelado). */
export async function POST(req: Request) {
  const bruto = await req.text()
  if (bruto.length > 4000) return NextResponse.json({ ok: false, erro: 'Pedido grande demais.' }, { status: 413 })
  let corpo: unknown
  try {
    corpo = JSON.parse(bruto)
  } catch {
    return NextResponse.json({ ok: false, erro: 'Pedido inválido.' }, { status: 400 })
  }
  const lido = Pedido.safeParse(corpo)
  if (!lido.success) return NextResponse.json({ ok: false, erro: 'Confira o e-mail informado.' }, { status: 400 })
  if (lido.data.website?.trim()) return NextResponse.json({ ok: true }) // isca para robôs
  const { error } = await criarClienteAdmin().from('blog_subscribers').upsert({ email: lido.data.email, name: lido.data.nome, source: lido.data.origem, unsubscribed_at: null }, { onConflict: 'email' })
  if (error) {
    console.error('Newsletter', error)
    return NextResponse.json({ ok: false, erro: 'Não foi possível inscrever agora. Tente de novo.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
