import { NextResponse } from 'next/server'
import { contaDoEvento, lerFormularioKommo } from '@/dominio/kommo'
import { segredoValido } from '@/dominio/whatsapp'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Json } from '@/infra/supabase/tipos'

/**
 * Webhook do Kommo (fase de teste): o Kommo só aceita uma URL, então o segredo vai em ?segredo=. Guarda o evento (JSON ou
 * formulário) para a equipe ver o formato real. Ainda não interpreta nada. Configurar com KOMMO_WEBHOOK_SEGREDO.
 */
export async function POST(req: Request) {
  const esperado = process.env.KOMMO_WEBHOOK_SEGREDO
  if (!esperado) return NextResponse.json({ erro: 'Webhook não configurado.' }, { status: 503 })
  const u = new URL(req.url)
  if (!segredoValido(u.searchParams.get('segredo') ?? req.headers.get('x-segredo') ?? '', esperado)) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  const texto = await req.text()
  if (texto.length > 1_000_000) return NextResponse.json({ erro: 'Corpo grande demais.' }, { status: 413 })
  let corpo: Json
  try {
    corpo = (req.headers.get('content-type') ?? '').includes('json') ? (JSON.parse(texto) as Json) : (lerFormularioKommo(texto) as Json)
  } catch {
    return NextResponse.json({ erro: 'Corpo ilegível.' }, { status: 400 })
  }
  const sb = criarClienteAdmin()
  const { error } = await sb.from('kommo_eventos_teste').insert({ conta: contaDoEvento(corpo), corpo })
  if (error) {
    console.error('kommo webhook', error)
    return NextResponse.json({ erro: 'Não foi possível guardar.' }, { status: 500 })
  }
  if (Math.random() < 0.05) await sb.from('kommo_eventos_teste').delete().lt('recebido_em', new Date(Date.now() - 7 * 86_400_000).toISOString())
  return NextResponse.json({ ok: true })
}
