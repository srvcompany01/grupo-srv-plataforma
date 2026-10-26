'use server'

import { revalidatePath } from 'next/cache'
import { chaveDeCapaValida, validarCapa } from '@/dominio/clientes-galeria'
import { gerarChaveCliente, urlUpload } from '@/infra/r2'
import * as bio from '@/servicos/bio'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { buscarCliente } from '@/servicos/clientes-plataforma'
import * as perf from '@/servicos/performance'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MES = /^\d{4}-(0[1-9]|1[0-2])$/
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
  if (faturamento === null) return { erro: 'Informe o faturamento do mês: é o único campo obrigatório (o número de vendas é opcional).' }
  if (vendas === undefined || (vendas !== null && !Number.isInteger(vendas))) return { erro: 'Número de vendas inválido.' }
  const res = await tentar(async () => perf.salvarResultadoMes(await criarClienteServidor(), clienteId, mes, { faturamento, vendas, notas: String(r.notas ?? '') }), 'Resultado do mês salvo.')
  revalidatePath('/performance')
  return res
}

export async function configurarLinkBioAcao(clienteId: string, mensagem: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  const sb = await criarClienteServidor()
  const c = await buscarCliente(sb, clienteId)
  if (!c) return { erro: 'Cliente não encontrado.' }
  const res = await tentar(() => perf.configurarLinkBio(sb, { id: c.id, nome: c.nome }, String(mensagem ?? '')), 'Link da bio pronto.')
  revalidatePath('/performance')
  return res
}

async function exigirGestaoBio(clienteId: string) {
  const eu = await exigirEquipe()
  return (eu.papel === 'admin' || eu.papel === 'gestor') && UUID.test(clienteId)
}

export async function iniciarUploadLogoBioAcao(clienteId: string, mime: string, tamanho: number): Promise<{ url: string; chave: string } | { erro: string }> {
  if (!(await exigirGestaoBio(clienteId))) return { erro: 'Sem permissão.' }
  const erro = validarCapa({ mime, tamanho })
  if (erro) return { erro }
  try {
    const chave = gerarChaveCliente(clienteId, mime)
    return { url: await urlUpload(chave, mime, tamanho), chave }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível preparar o envio da imagem.' }
  }
}

export async function salvarLogoBioAcao(clienteId: string, chave: string | null): Promise<Resultado> {
  if (!(await exigirGestaoBio(clienteId))) return { erro: 'Sem permissão.' }
  if (chave !== null && !chaveDeCapaValida(chave, clienteId)) return { erro: 'Imagem inválida.' }
  const res = await tentar(async () => bio.definirLogoBio(await criarClienteServidor(), clienteId, chave), chave ? 'Logo atualizada.' : 'Logo removida.')
  revalidatePath('/performance')
  return res
}

export async function adicionarLinkBioAcao(clienteId: string, rotulo: string, url: string): Promise<Resultado> {
  if (!(await exigirGestaoBio(clienteId))) return { erro: 'Sem permissão.' }
  const res = await tentar(async () => bio.adicionarLinkBio(await criarClienteServidor(), clienteId, String(rotulo ?? ''), String(url ?? '')), 'Botão adicionado.')
  revalidatePath('/performance')
  return res
}

export async function removerLinkBioAcao(clienteId: string, id: string): Promise<Resultado> {
  if (!(await exigirGestaoBio(clienteId)) || !UUID.test(id)) return { erro: 'Sem permissão.' }
  const res = await tentar(async () => bio.removerLinkBio(await criarClienteServidor(), id), 'Botão removido.')
  revalidatePath('/performance')
  return res
}
