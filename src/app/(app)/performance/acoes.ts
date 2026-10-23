'use server'

import { revalidatePath } from 'next/cache'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { buscarCliente } from '@/servicos/clientes-plataforma'
import * as perf from '@/servicos/performance'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MES = /^\d{4}-(0[1-9]|1[0-2])$/
const DIA = /^\d{4}-\d{2}-\d{2}$/
/** "12.345,67" ou "12345.67" → número; vazio → null; inválido → undefined. */
const numero = (v: string) => {
  const t = String(v ?? '').trim().replace(/[R$\s]/g, '')
  if (!t) return null
  const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export async function salvarResultadoMesAcao(clienteId: string, mes: string, r: { faturamento: string; vendas: string; notas: string }): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(clienteId) || !MES.test(mes)) return { erro: 'Dados inválidos.' }
  const faturamento = numero(r.faturamento)
  const vendas = numero(r.vendas)
  if (faturamento === undefined) return { erro: 'Faturamento inválido (ex.: 25.000,00).' }
  if (vendas === undefined || (vendas !== null && !Number.isInteger(vendas))) return { erro: 'Número de vendas inválido.' }
  const res = await tentar(async () => perf.salvarResultadoMes(await criarClienteServidor(), clienteId, mes, { faturamento, vendas, notas: String(r.notas ?? '') }), 'Resultado do mês salvo.')
  revalidatePath('/performance')
  return res
}

export async function confirmarLeadAcao(clienteId: string, dia: string, observacao: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(clienteId) || !DIA.test(dia)) return { erro: 'Dados inválidos.' }
  const res = await tentar(async () => perf.confirmarLead(await criarClienteServidor(), clienteId, dia, String(observacao ?? '')), 'Lead confirmado.')
  revalidatePath('/performance')
  return res
}

export async function removerLeadAcao(id: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Lead inválido.' }
  const res = await tentar(async () => perf.removerLeadConfirmado(await criarClienteServidor(), id), 'Lead removido.')
  revalidatePath('/performance')
  return res
}

export async function configurarLinkBioAcao(clienteId: string, mensagem: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  const sb = await criarClienteServidor()
  const c = await buscarCliente(sb, clienteId)
  if (!c) return { erro: 'Cliente não encontrado.' }
  if (!c.whatsapp) return { erro: 'Cadastre o WhatsApp do cliente primeiro (página do cliente → Cadastro).' }
  const res = await tentar(() => perf.configurarLinkBio(sb, { id: c.id, nome: c.nome }, String(mensagem ?? '')), 'Link da bio pronto.')
  revalidatePath('/performance')
  return res
}
