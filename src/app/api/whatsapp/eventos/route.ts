import { NextResponse } from 'next/server'
import { ignorarEvento, limparEvento, segredoValido } from '@/dominio/whatsapp'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Json } from '@/infra/supabase/tipos'

/**
 * Webhook da Evolution API (fase de teste): confere o segredo (cabeçalho `x-segredo` ou ?segredo=) e guarda o evento
 * bruto para a equipe ver o formato real. Ainda não interpreta nada. Configurar com WHATSAPP_WEBHOOK_SEGREDO.
 */
export async function POST(req: Request) {
  const esperado = process.env.WHATSAPP_WEBHOOK_SEGREDO
  if (!esperado) return NextResponse.json({ erro: 'Webhook não configurado.' }, { status: 503 })
  const u = new URL(req.url)
  if (!segredoValido(req.headers.get('x-segredo') ?? u.searchParams.get('segredo') ?? '', esperado)) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  const texto = await req.text()
  if (texto.length > 1_000_000) return NextResponse.json({ erro: 'Corpo grande demais.' }, { status: 413 })
  let corpo: Json
  try {
    corpo = JSON.parse(texto) as Json
  } catch {
    return NextResponse.json({ erro: 'JSON inválido.' }, { status: 400 })
  }
  const c = (corpo && typeof corpo === 'object' && !Array.isArray(corpo) ? corpo : {}) as Record<string, unknown>
  if (ignorarEvento(corpo)) return NextResponse.json({ ok: true, ignorado: true })
  const guardar = limparEvento(corpo) as Json
  const sb = criarClienteAdmin()
  const { error } = await sb.from('wa_eventos_teste').insert({ instancia: String(u.searchParams.get('instancia') ?? c.instance ?? c.instanceName ?? '').slice(0, 80), evento: String(c.event ?? '').slice(0, 80), corpo: guardar })
  if (error) {
    console.error('whatsapp eventos', error)
    return NextResponse.json({ erro: 'Não foi possível guardar.' }, { status: 500 })
  }
  // Limpeza barata de vez em quando: nada fica mais de 7 dias.
  if (Math.random() < 0.05) await sb.from('wa_eventos_teste').delete().lt('recebido_em', new Date(Date.now() - 7 * 86_400_000).toISOString())
  return NextResponse.json({ ok: true })
}
