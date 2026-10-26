import { NextResponse } from 'next/server'
import { resumoDoEvento } from '@/dominio/whatsapp'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'

/** Só admin: os últimos eventos guardados do webhook (resumo + corpo bruto) em /api/whatsapp/amostras?instancia=&evento=&limite=20 */
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel !== 'admin') return NextResponse.json({ erro: 'Só o admin.' }, { status: 403 })
  const u = new URL(req.url).searchParams
  const limite = Math.min(100, Math.max(1, Number(u.get('limite')) || 20))
  let q = (await criarClienteServidor()).from('wa_eventos_teste').select('id, instancia, evento, recebido_em, corpo').order('recebido_em', { ascending: false }).limit(limite)
  if (u.get('instancia')) q = q.eq('instancia', u.get('instancia')!)
  if (u.get('evento')) q = q.eq('evento', u.get('evento')!)
  const { data, error } = await q
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ total: data.length, eventos: data.map((e) => ({ id: e.id, recebidoEm: e.recebido_em, resumo: resumoDoEvento(e.corpo), corpo: e.corpo })) })
}
