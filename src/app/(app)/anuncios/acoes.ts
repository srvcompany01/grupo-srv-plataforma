'use server'

import { revalidatePath } from 'next/cache'
import { validarArquivo } from '@/dominio/midias'
import { gerarChaveCriativo, urlUpload } from '@/infra/r2'
import { exigirAdmin, exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { buscarCliente } from '@/servicos/clientes-plataforma'
import * as controle from '@/servicos/controle-anuncios'
import { desconectarAgencia } from '@/servicos/google-agencia'
import { dados } from '@/servicos/resultado'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function desconectarGoogleAgenciaAcao(): Promise<Resultado> {
  await exigirAdmin()
  const r = await tentar(desconectarAgencia, 'Google da agência desconectado.')
  revalidatePath('/anuncios')
  return r
}

/** Pausar, ativar ou mudar o orçamento direto pela tela (admin e gestor). */
export async function alterarAnuncioAcao(clienteId: string, p: controle.Pedido): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (!UUID.test(clienteId) || !['meta', 'google'].includes(p.plataforma) || !['campanha', 'conjunto', 'anuncio'].includes(p.nivel) || !['pausar', 'ativar', 'orcamento'].includes(p.acao)) return { erro: 'Pedido inválido.' }
  const sb = await criarClienteServidor()
  const cliente = await buscarCliente(sb, clienteId)
  if (!cliente) return { erro: 'Cliente não encontrado.' }
  let msg = ''
  const r = await tentar(async () => { msg = await controle.executarAlteracao(sb, eu, cliente, { plataforma: p.plataforma, nivel: p.nivel, objetoId: String(p.objetoId), acao: p.acao, valor: Number(p.valor) || undefined }) })
  revalidatePath('/anuncios')
  return r?.erro ? r : { ok: msg }
}

export async function decidirPropostaAcao(id: string, aprovar: boolean): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Proposta inválida.' }
  const sb = await criarClienteServidor()
  let msg = ''
  const r = await tentar(async () => { msg = await controle.decidirProposta(sb, eu, id, aprovar === true, (c) => buscarCliente(sb, c)) })
  revalidatePath('/anuncios')
  return r?.erro ? r : { ok: msg }
}

/** Prepara o envio do arquivo do criativo direto para o armazenamento. */
export async function enviarCriativoAcao(clienteId: string, mime: string, tamanho: number): Promise<{ chave: string; url: string } | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  try {
    validarArquivo({ tipoMime: mime, tamanhoBytes: tamanho })
    const chave = gerarChaveCriativo(clienteId, mime)
    return { chave, url: await urlUpload(chave, mime, tamanho) }
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'Não foi possível preparar o envio.' }
  }
}

export async function registrarCriativoAcao(clienteId: string, c: { nome: string; chave: string; mime: string; tamanho: number }): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(clienteId) || !c.chave.startsWith(`criativos/${clienteId}/`)) return { erro: 'Criativo inválido.' }
  let tipo: 'imagem' | 'video'
  try {
    tipo = validarArquivo({ tipoMime: c.mime, tamanhoBytes: c.tamanho })
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'Arquivo inválido.' }
  }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => dados(await sb.from('ad_creatives').insert({ client_id: clienteId, nome: c.nome.trim().slice(0, 200) || 'Criativo', tipo, chave: c.chave, mime: c.mime, tamanho: c.tamanho }).select('id')), 'Criativo adicionado.')
  revalidatePath('/anuncios')
  return r
}

export async function removerCriativoAcao(id: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Criativo inválido.' }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => dados(await sb.from('ad_creatives').delete().eq('id', id).select('id')), 'Criativo removido da biblioteca.')
  revalidatePath('/anuncios')
  return r
}
