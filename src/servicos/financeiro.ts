import { repetirMensal, type Lancamento, type TipoLancamento } from '@/dominio/financeiro'
import type { Supabase } from '@/infra/supabase/servidor'

const COLUNAS = 'id, kind, category, description, amount_cents, occurred_on, paid, client_id, client:clients(name)'

type Linha = { id: string; kind: string; category: string; description: string; amount_cents: number; occurred_on: string; paid: boolean; client_id: string | null; client: { name: string } | null }

const paraLancamento = (l: Linha): Lancamento => ({
  id: l.id,
  tipo: l.kind as TipoLancamento,
  categoria: l.category,
  descricao: l.description,
  centavos: Number(l.amount_cents),
  data: l.occurred_on,
  pago: l.paid,
  clienteId: l.client_id,
  clienteNome: l.client?.name ?? null,
})

/** Lançamentos de [de, ate) (ate exclusivo), do mais recente para o mais antigo. Só o admin enxerga (RLS). */
export async function listarLancamentos(sb: Supabase, de: string, ate: string): Promise<Lancamento[]> {
  const { data, error } = await sb.from('finance_entries').select(COLUNAS).gte('occurred_on', de).lt('occurred_on', ate).order('occurred_on', { ascending: false }).order('created_at', { ascending: false }).limit(2000)
  if (error) throw error
  return (data as unknown as Linha[]).map(paraLancamento)
}

export type NovoLancamento = { tipo: TipoLancamento; categoria: string; descricao: string; centavos: number; data: string; pago: boolean; clienteId: string | null }

/** Cria o lançamento; com `meses` > 1 repete todo mês (custos fixos como equipe e ferramentas). Os repetidos futuros ficam pendentes. */
export async function criarLancamentos(sb: Supabase, n: NovoLancamento, meses = 1): Promise<number> {
  const linhas = repetirMensal(n.data, meses).map((data, i) => ({
    kind: n.tipo,
    category: n.categoria.trim(),
    description: n.descricao.trim(),
    amount_cents: n.centavos,
    occurred_on: data,
    paid: i === 0 ? n.pago : false,
    client_id: n.clienteId,
  }))
  const { error } = await sb.from('finance_entries').insert(linhas)
  if (error) throw error
  return linhas.length
}

export async function atualizarLancamento(sb: Supabase, id: string, n: Partial<NovoLancamento>): Promise<void> {
  const campos = {
    ...(n.tipo !== undefined && { kind: n.tipo }),
    ...(n.categoria !== undefined && { category: n.categoria.trim() }),
    ...(n.descricao !== undefined && { description: n.descricao.trim() }),
    ...(n.centavos !== undefined && { amount_cents: n.centavos }),
    ...(n.data !== undefined && { occurred_on: n.data }),
    ...(n.pago !== undefined && { paid: n.pago }),
    ...(n.clienteId !== undefined && { client_id: n.clienteId }),
  }
  if (Object.keys(campos).length === 0) return
  const { data, error } = await sb.from('finance_entries').update(campos).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('lancamento_nao_encontrado')
}

export async function excluirLancamento(sb: Supabase, id: string): Promise<void> {
  const { error } = await sb.from('finance_entries').delete().eq('id', id)
  if (error) throw error
}
