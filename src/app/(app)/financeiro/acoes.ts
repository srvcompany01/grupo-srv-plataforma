'use server'

import { revalidatePath } from 'next/cache'
import { TIPOS_LANCAMENTO, lerReais, type TipoLancamento } from '@/dominio/financeiro'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as financeiro from '@/servicos/financeiro'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

export type EntradaLancamento = { tipo: TipoLancamento; categoria: string; descricao: string; valor: string; data: string; pago: boolean; clienteId: string | null; repetirMeses?: number }

/** Valida o formulário (valor em texto, como a pessoa digitou) e devolve os campos prontos ou o erro. */
function validar(e: EntradaLancamento): { erro: string } | { campos: financeiro.NovoLancamento } {
  if (!TIPOS_LANCAMENTO.includes(e.tipo)) return { erro: 'Tipo inválido.' }
  const centavos = lerReais(e.valor)
  if (centavos === null) return { erro: 'Informe um valor maior que zero, por exemplo 1.500,00.' }
  if (!DATA.test(e.data) || Number.isNaN(Date.parse(e.data))) return { erro: 'Data inválida.' }
  const categoria = e.categoria.trim()
  if (!categoria || categoria.length > 60) return { erro: 'Escolha uma categoria.' }
  if (e.descricao.length > 200) return { erro: 'A descrição passa de 200 caracteres.' }
  if (e.clienteId && !UUID.test(e.clienteId)) return { erro: 'Cliente inválido.' }
  return { campos: { tipo: e.tipo, categoria, descricao: e.descricao, centavos, data: e.data, pago: e.pago, clienteId: e.clienteId || null } }
}

async function executar(fn: (sb: Awaited<ReturnType<typeof criarClienteServidor>>) => Promise<unknown>, ok: string): Promise<Resultado> {
  await exigirAdmin() // o financeiro é só do admin (a RLS também recusa os demais)
  const sb = await criarClienteServidor()
  const r = await tentar(() => fn(sb), ok)
  revalidatePath('/financeiro')
  return r
}

export async function criarLancamentoAcao(e: EntradaLancamento): Promise<Resultado> {
  const v = validar(e)
  if ('erro' in v) return { erro: v.erro }
  const meses = Math.min(Math.max(Math.trunc(e.repetirMeses ?? 1) || 1, 1), 36)
  return executar((sb) => financeiro.criarLancamentos(sb, v.campos, meses), meses > 1 ? `${meses} lançamentos criados.` : 'Lançamento criado.')
}

export async function atualizarLancamentoAcao(id: string, e: EntradaLancamento): Promise<Resultado> {
  if (!UUID.test(id)) return { erro: 'Lançamento inválido.' }
  const v = validar(e)
  if ('erro' in v) return { erro: v.erro }
  return executar((sb) => financeiro.atualizarLancamento(sb, id, v.campos), 'Lançamento atualizado.')
}

export async function marcarPagoAcao(id: string, pago: boolean): Promise<Resultado> {
  if (!UUID.test(id)) return { erro: 'Lançamento inválido.' }
  return executar((sb) => financeiro.atualizarLancamento(sb, id, { pago }), pago ? 'Marcado como pago.' : 'Marcado como pendente.')
}

export async function excluirLancamentoAcao(id: string): Promise<Resultado> {
  if (!UUID.test(id)) return { erro: 'Lançamento inválido.' }
  return executar((sb) => financeiro.excluirLancamento(sb, id), 'Lançamento excluído.')
}
