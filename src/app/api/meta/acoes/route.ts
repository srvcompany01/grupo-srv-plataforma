import { NextResponse } from 'next/server'
import { dataDeHoje } from '@/dominio/filtros'
import { lerPeriodo } from '@/dominio/periodo-anuncios'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarCliente } from '@/servicos/clientes-plataforma'
import { diagnosticoAcoesMeta } from '@/servicos/meta-anuncios'

/** Diagnóstico da contagem de leads da Meta de um cliente (só admin): /api/meta/acoes?cliente=<id>&de=AAAA-MM-DD&ate=AAAA-MM-DD */
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel !== 'admin') return NextResponse.json({ erro: 'Só o admin.' }, { status: 403 })
  const u = new URL(req.url).searchParams
  const c = await buscarCliente(await criarClienteServidor(), u.get('cliente') ?? '')
  if (!c?.metaContaId) return NextResponse.json({ erro: 'Cliente sem conta de anúncios da Meta.' }, { status: 404 })
  const periodo = lerPeriodo({ de: u.get('de') ?? undefined, ate: u.get('ate') ?? undefined, dias: u.get('dias') ?? '7' }, dataDeHoje(new Date()))
  return NextResponse.json({ cliente: c.nome, periodo, ...(await diagnosticoAcoesMeta(c.metaContaId, periodo)) })
}
