import { NextResponse } from 'next/server'
import { papelPodeUsarIA } from '@/ia/acesso'
import { executarConfirmada } from '@/ia/executar'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'

export const maxDuration = 60

/** Executa uma ação que a IA propôs e a pessoa confirmou (uma por chamada, para mostrar o andamento e não estourar o tempo). */
export async function POST(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || !papelPodeUsarIA(eu.papel)) return NextResponse.json({ ok: false, erro: 'Sem acesso.' }, { status: 403 })
  const corpo = (await req.json().catch(() => null)) as { nome?: string; argumentos?: unknown } | null
  if (!corpo?.nome) return NextResponse.json({ ok: false, erro: 'Pedido inválido.' }, { status: 400 })
  const r = await executarConfirmada({ sb: await criarClienteServidor(), userId: eu.id, nome: eu.nome, papel: eu.papel, escopo: 'write' }, corpo.nome, corpo.argumentos)
  return NextResponse.json(r, { status: r.ok ? 200 : 422 })
}
