'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { idDaPastaDoDrive, type TipoDoVideo } from '@/dominio/caixa-de-entrada'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as caixa from '@/servicos/caixa-de-entrada'
import { listarVideos, type ArquivoDrive } from '@/servicos/google-drive'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const atualizar = () => revalidatePath('/caixa-de-entrada')
const msg = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado.')

/** Cria o item e devolve a URL para o navegador enviar o vídeo direto ao armazenamento. */
export async function prepararEnvioCaixaAcao(e: { clienteId: string; nome: string; mime: string; tamanho: number; tipo: TipoDoVideo; confirmarGrande?: boolean }): Promise<{ id: string; urlEnvio: string } | { erro: string }> {
  const eu = await exigirEquipe()
  if (!UUID.test(e.clienteId)) return { erro: 'Cliente inválido.' }
  try {
    return await caixa.prepararEnvio(await criarClienteServidor(), eu.id, e)
  } catch (err) {
    return { erro: msg(err) }
  }
}

export async function confirmarEnvioCaixaAcao(itemId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(itemId)) return { erro: 'Item inválido.' }
  const r = await tentar(async () => caixa.confirmarEnvio(await criarClienteServidor(), itemId), 'Vídeo enviado.')
  // Já deixa o áudio extraído; se falhar, ele é extraído na hora em que a IA pedir.
  if (r && !('erro' in r)) { const sb = await criarClienteServidor(); after(async () => void (await caixa.pedirTranscricaoSeConfigurado(sb, itemId).catch(() => {}))) }
  atualizar()
  return r
}

export async function buscarDriveAcao(clienteId: string, busca: string, tipo: 'todos' | 'organico' | 'anuncio'): Promise<{ arquivos: ArquivoDrive[] } | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  try {
    const ficha = await caixa.buscarFicha(await criarClienteServidor(), clienteId)
    if (!ficha.pastaDrive) return { erro: 'Este cliente ainda não tem a pasta do Google Drive. Cole o link da pasta na ficha de conteúdo (Caixa de entrada > Configurações).' }
    return { arquivos: await listarVideos(ficha.pastaDrive, { busca: busca.trim() || undefined, tipo: tipo === 'todos' ? undefined : tipo, limite: 80 }) }
  } catch (err) {
    return { erro: msg(err) }
  }
}

export async function importarDriveAcao(clienteId: string, arquivoId: string, tipo: TipoDoVideo, confirmarGrande = false): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  try {
    const sb = await criarClienteServidor()
    const itemId = await caixa.iniciarImportacaoDrive(sb, eu.id, { clienteId, arquivoId, tipo: tipo === 'indefinido' ? undefined : tipo, confirmarGrande })
    after(async () => { await caixa.executarImportacao(itemId); await caixa.pedirTranscricaoSeConfigurado(sb, itemId).catch(() => {}) })
    atualizar()
    return { ok: 'Importando do Drive… aparece na lista quando terminar.' }
  } catch (err) {
    return { erro: msg(err) }
  }
}

export async function tentarDeNovoAcao(itemId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(itemId)) return { erro: 'Item inválido.' }
  try {
    await caixa.reiniciarImportacao(await criarClienteServidor(), itemId)
    after(() => caixa.executarImportacao(itemId))
    atualizar()
    return { ok: 'Tentando de novo.' }
  } catch (err) {
    return { erro: msg(err) }
  }
}

export async function renomearItemCaixaAcao(itemId: string, nome: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(itemId)) return { erro: 'Item inválido.' }
  const r = await tentar(async () => caixa.renomearItem(await criarClienteServidor(), itemId, nome), 'Vídeo renomeado.')
  atualizar()
  return r
}

export async function marcarTipoCaixaAcao(itemId: string, tipo: TipoDoVideo): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(itemId) || !['organico', 'anuncio', 'indefinido'].includes(tipo)) return { erro: 'Item inválido.' }
  const r = await tentar(async () => caixa.marcarTipoItem(await criarClienteServidor(), itemId, tipo), 'Tag atualizada.')
  atualizar()
  return r
}

/** Pede (ou refaz) o áudio e a transcrição de um vídeo pronto. A transcrição chega alguns minutos depois. */
export async function transcreverCaixaAcao(itemId: string, refazer = false): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(itemId)) return { erro: 'Item inválido.' }
  const r = await tentar(async () => caixa.pedirTranscricao(await criarClienteServidor(), itemId, refazer), 'Transcrição pedida. Chega em alguns minutos.')
  atualizar()
  return r
}

/** O texto transcrito, para ler na lista. */
export async function textoDaTranscricaoAcao(itemId: string): Promise<{ texto: string } | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(itemId)) return { erro: 'Item inválido.' }
  const { data } = await (await criarClienteServidor()).from('content_inbox').select('transcript, transcript_state').eq('id', itemId).maybeSingle()
  return data?.transcript_state === 'pronta' ? { texto: data.transcript } : { erro: 'A transcrição ainda não está pronta.' }
}

export async function urlDoVideoCaixaAcao(itemId: string): Promise<{ url: string } | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(itemId)) return { erro: 'Item inválido.' }
  try {
    return { url: await caixa.urlDoVideo(await criarClienteServidor(), itemId) }
  } catch (err) {
    return { erro: msg(err) }
  }
}

export async function excluirItemCaixaAcao(itemId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(itemId)) return { erro: 'Item inválido.' }
  const r = await tentar(async () => caixa.excluirItem(await criarClienteServidor(), itemId), 'Removido da caixa.')
  atualizar()
  return r
}

export async function salvarFichaAcao(e: { clienteId: string; pastaDrive: string; tom: string; hashtags: string; chamada: string; observacoes: string }): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(e.clienteId)) return { erro: 'Cliente inválido.' }
  const pasta = e.pastaDrive.trim() === '' ? '' : idDaPastaDoDrive(e.pastaDrive)
  if (e.pastaDrive.trim() && !pasta) return { erro: 'Não reconheci a pasta do Drive: cole o link da pasta (…/folders/…).' }
  const r = await tentar(async () => caixa.salvarFicha(await criarClienteServidor(), { clienteId: e.clienteId, pastaDrive: pasta, tom: e.tom.slice(0, 2000), hashtags: e.hashtags.slice(0, 2000), chamada: e.chamada.slice(0, 500), observacoes: e.observacoes.slice(0, 4000) }), 'Ficha salva.')
  atualizar()
  return r
}
