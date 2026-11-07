import { METODOS, VAZIO, mesclar, normalizar, type DadosEstrategia, type Metodo } from '@/dominio/estrategia'
import type { Json } from '@/infra/supabase/tipos'
import type { Supabase } from '@/infra/supabase/servidor'

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
