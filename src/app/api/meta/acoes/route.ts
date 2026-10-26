import { NextResponse } from 'next/server'
import { dataDeHoje } from '@/dominio/filtros'
import { lerPeriodo } from '@/dominio/periodo-anuncios'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarCliente } from '@/servicos/clientes-plataforma'
import { diagnosticoAcoesMeta, sondaCampanhaMeta } from '@/servicos/meta-anuncios'

/** Diagnóstico da Meta de um cliente (só admin): /api/meta/acoes?cliente=<id>&de=AAAA-MM-DD&ate=AAAA-MM-DD; com &sonda=<id da campanha>, os campos de resultado dela (e &campos=a,b para testar outros nomes de campo). */
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel !== 'admin') return NextResponse.json({ erro: 'Só o admin.' }, { status: 403 })
  const u = new URL(req.url).searchParams
  const c = await buscarCliente(await criarClienteServidor(), u.get('cliente') ?? '')
  if (!c?.metaContaId) return NextResponse.json({ erro: 'Cliente sem conta de anúncios da Meta.' }, { status: 404 })
  const periodo = lerPeriodo({ de: u.get('de') ?? undefined, ate: u.get('ate') ?? undefined, dias: u.get('dias') ?? '7' }, dataDeHoje(new Date()))
  const sonda = u.get('sonda') ?? ''
  if (sonda) return NextResponse.json(/^\d{5,25}$/.test(sonda) ? { cliente: c.nome, periodo, ...(await sondaCampanhaMeta(c.metaContaId, sonda, periodo, (u.get('campos') ?? '').split(',').filter((x) => /^[a-z_]{3,60}$/.test(x)).slice(0, 12))) } : { erro: 'sonda = id numérico da campanha.' }, { status: /^\d{5,25}$/.test(sonda) ? 200 : 400 })
  return NextResponse.json({ cliente: c.nome, periodo, ...(await diagnosticoAcoesMeta(c.metaContaId, periodo)) })
}
