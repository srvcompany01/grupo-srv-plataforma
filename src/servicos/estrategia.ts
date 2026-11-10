import { METODOS, VAZIO, mesclar, normalizar, type DadosEstrategia, type Metodo, type NumerosReais } from '@/dominio/estrategia'
import { intervaloDoMes, mesAnterior } from '@/dominio/performance'
import type { Json } from '@/infra/supabase/tipos'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Cliente } from './clientes-plataforma'

export type EstrategiaDoCliente = Record<Metodo, DadosEstrategia>

const vazia = (): EstrategiaDoCliente => Object.fromEntries(METODOS.map((m) => [m.id, VAZIO])) as EstrategiaDoCliente

/** Os 5 métodos do cliente (os que ainda não foram preenchidos vêm vazios; sem a migration, tudo vazio). */
export async function estrategiaDoCliente(sb: Supabase, clienteId: string): Promise<EstrategiaDoCliente> {
  const r = vazia()
  const { data } = await sb.from('client_strategy').select('method, data').eq('client_id', clienteId)
  for (const l of data ?? []) if (l.method in r) r[l.method as Metodo] = normalizar(l.data)
  return r
}

/** Estratégia de todos os clientes (para o panorama). */
export async function estrategiasDeTodos(sb: Supabase): Promise<Record<string, EstrategiaDoCliente>> {
  const r: Record<string, EstrategiaDoCliente> = {}
  const { data } = await sb.from('client_strategy').select('client_id, method, data')
  for (const l of data ?? []) {
    r[l.client_id] ??= vazia()
    if (l.method in r[l.client_id]) r[l.client_id][l.method as Metodo] = normalizar(l.data)
  }
  return r
}

// ponytail: grava o documento inteiro (último a salvar vence); se duas pessoas editarem o mesmo método ao mesmo tempo, salvar por chave.
export async function salvarEstrategia(sb: Supabase, clienteId: string, metodo: Metodo, dados: DadosEstrategia): Promise<void> {
  const { error } = await sb.from('client_strategy').upsert({ client_id: clienteId, method: metodo, data: normalizar(dados) as unknown as Json, updated_at: new Date().toISOString() }, { onConflict: 'client_id,method' })
  if (error) throw error
}

/** Altera só as chaves enviadas (uso da IA). */
export async function alterarEstrategia(sb: Supabase, clienteId: string, metodo: Metodo, parcial: Partial<DadosEstrategia>): Promise<DadosEstrategia> {
  const atual = (await estrategiaDoCliente(sb, clienteId))[metodo]
  const novo = mesclar(atual, parcial)
  await salvarEstrategia(sb, clienteId, metodo, novo)
  return novo
}

/** Números reais do último mês fechado (anúncios + resultado lançado em Performance), para a Arquitetura de Receita. null = sem dados. */
export async function numerosReaisDoCliente(sb: Supabase, c: Cliente, hoje: string): Promise<NumerosReais | null> {
  try {
    const mes = mesAnterior(hoje.slice(0, 7))
    const [{ historicoDoCliente, investido, leadsPagos }, { situacaoGoogle }, { totaisDoPeriodoMeta }] = await Promise.all([import('./performance'), import('./google-agencia'), import('./meta-anuncios')])
    const [h, totais] = await Promise.all([
      historicoDoCliente(sb, c, [mes], hoje, (await situacaoGoogle()).conectado),
      c.metaContaId ? totaisDoPeriodoMeta(c.metaContaId, intervaloDoMes(mes, hoje)) : null,
    ])
    const m = h.meses[0]
    if (!m) return null
    const n = { mes, impressoes: totais && !('erro' in totais) ? totais.impressoes : null, leads: leadsPagos(m) + m.leadsOrganicos, vendas: m.vendas, investido: investido(m), faturamento: m.faturamento }
    return n.leads || n.investido || n.vendas ? n : null
  } catch {
    return null
  }
}
