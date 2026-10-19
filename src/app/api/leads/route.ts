import { NextResponse } from 'next/server'
import { PedidoLead } from '@/dominio/leads'
import { registrarLead } from '@/servicos/leads'

const LIMITE_BYTES = 60_000

/** Recebe os formulários das landing pages (público, sem login). Só entra o que passa na validação. */
export async function POST(req: Request) {
  const bruto = await req.text()
  if (bruto.length > LIMITE_BYTES) return NextResponse.json({ ok: false, erro: 'Pedido grande demais.' }, { status: 413 })
  let corpo: unknown
  try {
    corpo = JSON.parse(bruto)
  } catch {
    return NextResponse.json({ ok: false, erro: 'Pedido inválido.' }, { status: 400 })
  }
  // Isca para robôs: campo escondido preenchido. Responde "ok" para o robô não insistir, mas não guarda nada.
  if (typeof (corpo as { website?: unknown })?.website === 'string' && (corpo as { website: string }).website.trim() !== '') return NextResponse.json({ ok: true })

  const lido = PedidoLead.safeParse(corpo)
  if (!lido.success) return NextResponse.json({ ok: false, erro: 'Confira os dados informados.' }, { status: 400 })
  try {
    await registrarLead(lido.data.payload)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Lead: falha', e)
    return NextResponse.json({ ok: false, erro: 'Não foi possível enviar agora. Tente de novo.' }, { status: 500 })
  }
}
