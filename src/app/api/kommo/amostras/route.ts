import { NextResponse } from 'next/server'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'

/** Só admin: os últimos eventos guardados do webhook do Kommo, em /api/kommo/amostras?limite=20 */
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel !== 'admin') return NextResponse.json({ erro: 'Só o admin.' }, { status: 403 })
  const limite = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get('limite')) || 20))
  const { data, error } = await (await criarClienteServidor()).from('kommo_eventos_teste').select('id, conta, recebido_em, corpo').order('recebido_em', { ascending: false }).limit(limite)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ total: data.length, eventos: data })
}
