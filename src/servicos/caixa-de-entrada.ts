import { createHmac, timingSafeEqual } from 'node:crypto'
import { avisoDeVideoGrande, problemaDoVideo, type StatusDaCaixa, type TipoDoVideo } from '@/dominio/caixa-de-entrada'
import { textoParaDescricao } from '@/dominio/descricao'
import type { Formato } from '@/dominio/conteudo'
import { apagarArquivos, copiarArquivo, enviarEmPartes, gerarChaveCaixa, gerarChaveConteudo, gerarChaveCriativo, tamanhoDoArquivo, urlLeitura, urlUpload } from '@/infra/r2'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Supabase } from '@/infra/supabase/servidor'
import { extrairAudio } from './audio-video'
import { baixarArquivo, dadosDoArquivo } from './google-drive'
import * as conteudo from './conteudo'
import * as tarefas from './tarefas'

export type ItemDaCaixa = {
  id: string
  clienteId: string
  clienteNome: string
  nome: string
  origem: 'upload' | 'drive' | 'ia'
  tipo: TipoDoVideo
  status: StatusDaCaixa
  tamanho: number
  erro: string
  postId: string | null
  criadoEm: string
}

type Linha = { id: string; client_id: string; name: string; source: string; kind: string; status: string; size_bytes: number; error: string; post_task_id: string | null; created_at: string; clients: { name: string } | null }
const COLUNAS = 'id, client_id, name, source, kind, status, size_bytes, error, post_task_id, created_at, clients(name)'
const paraItem = (l: Linha): ItemDaCaixa => ({ id: l.id, clienteId: l.client_id, clienteNome: l.clients?.name ?? '', nome: l.name, origem: l.source as ItemDaCaixa['origem'], tipo: l.kind as TipoDoVideo, status: l.status as StatusDaCaixa, tamanho: Number(l.size_bytes), erro: l.error, postId: l.post_task_id, criadoEm: l.created_at })

export async function listarCaixa(sb: Supabase, f: { clienteId?: string; status?: StatusDaCaixa } = {}): Promise<ItemDaCaixa[]> {
  let q = sb.from('content_inbox').select(COLUNAS).order('created_at', { ascending: false }).limit(200)
  if (f.clienteId) q = q.eq('client_id', f.clienteId)
  if (f.status) q = q.eq('status', f.status)
  const { data, error } = await q
  if (error) return [] // sem a migration, a caixa abre vazia
  return (data as unknown as Linha[]).map(paraItem)
}

/** Item novo que será enviado por quem tem o arquivo (navegador ou IA no computador): devolve a URL para enviar direto ao armazenamento. */
export async function prepararEnvio(sb: Supabase, euId: string, e: { clienteId: string; nome: string; mime: string; tamanho: number; tipo?: TipoDoVideo; origem?: 'upload' | 'ia'; confirmarGrande?: boolean }): Promise<{ id: string; urlEnvio: string }> {
  const problema = problemaDoVideo({ mime: e.mime, tamanho: e.tamanho })
  if (problema) throw new Error(problema)
  const aviso = avisoDeVideoGrande(e.tamanho, e.nome)
  if (aviso && !e.confirmarGrande) throw new Error(`${aviso} Confirme com a pessoa (confirmarVideoGrande=true) antes de enviar.`)
  const chave = gerarChaveCaixa(e.clienteId, e.mime)
  const { data, error } = await sb.from('content_inbox').insert({ client_id: e.clienteId, name: e.nome.slice(0, 255), source: e.origem ?? 'upload', r2_key: chave, mime: e.mime, size_bytes: e.tamanho, kind: e.tipo ?? 'indefinido', status: 'aguardando_envio', created_by: euId }).select('id').single()
  if (error) throw error
  return { id: data.id, urlEnvio: await urlUpload(chave, e.mime, e.tamanho) }
}

/** Depois do envio: confere que o arquivo chegou e libera o item. */
export async function confirmarEnvio(sb: Supabase, itemId: string): Promise<void> {
  const { data, error } = await sb.from('content_inbox').select('id, r2_key, size_bytes, status').eq('id', itemId).single()
  if (error) throw error
  if (data.status !== 'aguardando_envio') return
  const tamanho = await tamanhoDoArquivo(data.r2_key)
  if (tamanho === null || tamanho === 0) throw new Error('O arquivo ainda não chegou ao armazenamento. Envie de novo.')
  const { error: e2 } = await sb.from('content_inbox').update({ status: 'pronto', size_bytes: tamanho, updated_at: new Date().toISOString() }).eq('id', itemId)
  if (e2) throw e2
}

/** Cria o item "importando" para um arquivo do Drive. A cópia em si roda em `executarImportacao`. */
export async function iniciarImportacaoDrive(sb: Supabase, euId: string, e: { clienteId: string; arquivoId: string; tipo?: TipoDoVideo; confirmarGrande?: boolean }): Promise<string> {
  const arq = await dadosDoArquivo(e.arquivoId)
  const problema = problemaDoVideo({ mime: arq.mime, tamanho: arq.tamanho })
  if (problema) throw new Error(problema)
  const aviso = avisoDeVideoGrande(arq.tamanho, arq.nome)
  if (aviso && !e.confirmarGrande) throw new Error(`${aviso} Confirme com a pessoa (confirmarVideoGrande=true) antes de importar.`)
  const { data, error } = await sb.from('content_inbox').insert({ client_id: e.clienteId, name: arq.nome.slice(0, 255), source: 'drive', drive_file_id: arq.id, r2_key: gerarChaveCaixa(e.clienteId, arq.mime), mime: arq.mime, size_bytes: arq.tamanho, kind: e.tipo ?? 'indefinido', status: 'importando', created_by: euId }).select('id').single()
  if (error) {
    if ((error as { code?: string }).code === '23505') throw new Error('Este vídeo do Drive já está na caixa de entrada.')
    throw error
  }
  return data.id
}

/** Copia o arquivo do Drive para o armazenamento. Roda em segundo plano (chave mestra: não depende de quem pediu). */
export async function executarImportacao(itemId: string, depois?: { criarCriativo?: { nome?: string } }): Promise<void> {
  const admin = criarClienteAdmin()
  const { data: item } = await admin.from('content_inbox').select('id, drive_file_id, r2_key, mime').eq('id', itemId).single()
  if (!item?.drive_file_id) return
  try {
    const { corpo } = await baixarArquivo(item.drive_file_id)
    const tamanho = await enviarEmPartes(item.r2_key, item.mime, corpo)
    await admin.from('content_inbox').update({ status: 'pronto', size_bytes: tamanho, error: '', updated_at: new Date().toISOString() }).eq('id', itemId)
  } catch (e) {
    console.error('importação do Drive', e)
    await admin.from('content_inbox').update({ status: 'erro', error: (e instanceof Error ? e.message : 'Falha ao copiar do Drive.').slice(0, 480), updated_at: new Date().toISOString() }).eq('id', itemId)
  }
  // O vídeo já está pronto; se só a ida para a biblioteca falhar, o item continua "pronto" e o motivo fica no aviso.
  if (depois?.criarCriativo) {
    try {
      const { data } = await admin.from('content_inbox').select('status').eq('id', itemId).single()
      if (data?.status === 'pronto') await criativoDaCaixa(admin, itemId, depois.criarCriativo.nome)
    } catch (e) {
      console.error('criativo da caixa', e)
      await admin.from('content_inbox').update({ error: `Importado, mas não entrou na biblioteca de criativos: ${e instanceof Error ? e.message : 'erro'}`.slice(0, 480) }).eq('id', itemId)
    }
  }
}

/** Tenta de novo um item que deu erro (volta a "importando"). */
export async function reiniciarImportacao(sb: Supabase, itemId: string): Promise<void> {
  const { error } = await sb.from('content_inbox').update({ status: 'importando', error: '', updated_at: new Date().toISOString() }).eq('id', itemId).eq('source', 'drive').in('status', ['erro', 'importando'])
  if (error) throw error
}

export async function renomearItem(sb: Supabase, itemId: string, nome: string): Promise<void> {
  const limpo = nome.trim().slice(0, 255)
  if (!limpo) throw new Error('Dê um nome ao vídeo.')
  const { error } = await sb.from('content_inbox').update({ name: limpo, updated_at: new Date().toISOString() }).eq('id', itemId)
  if (error) throw error
}

export async function marcarTipoItem(sb: Supabase, itemId: string, tipo: TipoDoVideo): Promise<void> {
  const { error } = await sb.from('content_inbox').update({ kind: tipo, updated_at: new Date().toISOString() }).eq('id', itemId)
  if (error) throw error
}

/** Link temporário para assistir ao vídeo da caixa no navegador. */
export async function urlDoVideo(sb: Supabase, itemId: string): Promise<string> {
  const { data, error } = await sb.from('content_inbox').select('r2_key, status').eq('id', itemId).single()
  if (error) throw error
  if (data.status !== 'pronto') throw new Error('O vídeo ainda não está pronto.')
  return urlLeitura(data.r2_key)
}

export async function excluirItem(sb: Supabase, itemId: string): Promise<void> {
  const { data } = await sb.from('content_inbox').select('r2_key, status').eq('id', itemId).maybeSingle()
  const { error } = await sb.from('content_inbox').delete().eq('id', itemId)
  if (error) throw error
  if (data && data.status !== 'usado') await apagarArquivos([data.r2_key, chaveDoAudio(data.r2_key)]).catch(() => [])
}

/** Vira post: cria o post na lista de conteúdo, escreve a legenda e leva o vídeo da caixa para o post. Devolve o id do post. */
export async function criarPostDaCaixa(sb: Supabase, e: { itemId: string; listaId: string; titulo: string; formato: Formato; dataPrevista: string; legenda: string; ideia?: string; objetivo?: string; descricao?: string }): Promise<string> {
  const { data: item, error } = await sb.from('content_inbox').select('id, client_id, name, r2_key, mime, size_bytes, status').eq('id', e.itemId).single()
  if (error) throw error
  if (item.status !== 'pronto') throw new Error(item.status === 'usado' ? 'Este vídeo já virou um post.' : 'O vídeo ainda não está pronto (aguarde o envio ou a importação terminar).')
  const tarefaId = await conteudo.criarPost(sb, { listaId: e.listaId, clienteId: item.client_id, titulo: e.titulo, formato: e.formato, dataPrevista: e.dataPrevista })
  await conteudo.salvarTexto(sb, tarefaId, { ideia: e.ideia ?? '', objetivo: e.objetivo ?? '', legenda: e.legenda })
  if (e.descricao) await tarefas.atualizarTarefa(sb, tarefaId, { descricao: textoParaDescricao(e.descricao) })
  const chave = gerarChaveConteudo(tarefaId, item.mime)
  await copiarArquivo(item.r2_key, chave, item.mime)
  await conteudo.registrarMidia(sb, tarefaId, { chave, tipo: 'video', nome: item.name, tamanho: Number(item.size_bytes) })
  await sb.from('content_inbox').update({ status: 'usado', post_task_id: tarefaId, updated_at: new Date().toISOString() }).eq('id', e.itemId)
  await apagarArquivos([item.r2_key, chaveDoAudio(item.r2_key)]).catch(() => [])
  return tarefaId
}

// ───────────────────────────── Ficha de conteúdo do cliente ─────────────────────────────

export type FichaDeConteudo = { clienteId: string; pastaDrive: string; tom: string; hashtags: string; chamada: string; observacoes: string }

export async function buscarFicha(sb: Supabase, clienteId: string): Promise<FichaDeConteudo> {
  const { data } = await sb.from('client_content_profiles').select('drive_folder_id, tone, hashtags, cta, notes').eq('client_id', clienteId).maybeSingle()
  return { clienteId, pastaDrive: data?.drive_folder_id ?? '', tom: data?.tone ?? '', hashtags: data?.hashtags ?? '', chamada: data?.cta ?? '', observacoes: data?.notes ?? '' }
}

export async function salvarFicha(sb: Supabase, f: Partial<Omit<FichaDeConteudo, 'clienteId'>> & { clienteId: string }): Promise<void> {
  const atual = await buscarFicha(sb, f.clienteId)
  const { error } = await sb.from('client_content_profiles').upsert({ client_id: f.clienteId, drive_folder_id: f.pastaDrive ?? atual.pastaDrive, tone: f.tom ?? atual.tom, hashtags: f.hashtags ?? atual.hashtags, cta: f.chamada ?? atual.chamada, notes: f.observacoes ?? atual.observacoes, updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
  if (error) throw error
}

// ───────────────────────────── Áudio do vídeo ─────────────────────────────

/** O áudio extraído fica ao lado do vídeo no R2 (mesma chave + .audio.mp3), sem coluna nova no banco. */
export const chaveDoAudio = (chaveDoVideo: string) => `${chaveDoVideo}.audio.mp3`

/** Garante o áudio (MP3 mono, leve) do vídeo no armazenamento; extrai com o ffmpeg se ainda não existir. Devolve a chave do áudio. */
export async function prepararAudio(sb: Supabase, itemId: string): Promise<string> {
  const { data: item, error } = await sb.from('content_inbox').select('r2_key, status').eq('id', itemId).single()
  if (error) throw error
  if (item.status !== 'pronto') throw new Error(item.status === 'usado' ? 'Este vídeo já virou post e saiu da caixa.' : 'O vídeo ainda não está pronto.')
  const chave = chaveDoAudio(item.r2_key)
  if ((await tamanhoDoArquivo(chave)) !== null) return chave
  const audio = await extrairAudio(await urlLeitura(item.r2_key))
  await enviarEmPartes(chave, 'audio/mpeg', new Blob([new Uint8Array(audio)]).stream())
  return chave
}

/**
 * Extrai o áudio dos vídeos prontos que ainda não têm (os enviados antes desta função). Faz poucos por vez, um depois do outro,
 * para não sobrecarregar o servidor; a caixa chama de novo a cada visita até acabar.
 */
export async function prepararAudiosPendentes(sb: Supabase, limite = 3): Promise<void> {
  const { data } = await sb.from('content_inbox').select('id, r2_key').eq('status', 'pronto').order('created_at', { ascending: false }).limit(100)
  let feitos = 0
  for (const v of data ?? []) {
    if (feitos >= limite) return
    if ((await tamanhoDoArquivo(chaveDoAudio(v.r2_key))) !== null) continue
    await prepararAudio(sb, v.id).catch(() => {})
    feitos++
  }
}

/** Assinatura (HMAC) do id do item: vai no link fixo do áudio e impede que alguém adivinhe o endereço de outro vídeo. */
export const tokenDoAudio = (itemId: string) => createHmac('sha256', process.env.CRON_SECRET ?? '').update(`audio-caixa:${itemId}`).digest('hex')

export function tokenValido(itemId: string, token: string): boolean {
  if (!process.env.CRON_SECRET) return false
  const esperado = Buffer.from(tokenDoAudio(itemId))
  const recebido = Buffer.from(token)
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido)
}

/** Endereço fixo (sem prazo) para baixar o áudio extraído; quem transcreve é a IA conectada pelo MCP, na plataforma dela. */
export async function audioDoVideo(sb: Supabase, itemId: string): Promise<{ nome: string; url: string; mime: 'audio/mpeg'; tamanhoBytes: number }> {
  const chave = await prepararAudio(sb, itemId)
  const { data } = await sb.from('content_inbox').select('name').eq('id', itemId).single()
  const base = (data?.name ?? 'video').replace(/\.[^.]+$/, '')
  const site = (process.env.APP_URL ?? 'https://app.gruposrv.com.br').replace(/\/$/, '')
  return { nome: `${base}.mp3`, url: `${site}/api/caixa/audio/${itemId}?t=${tokenDoAudio(itemId)}`, mime: 'audio/mpeg', tamanhoBytes: (await tamanhoDoArquivo(chave)) ?? 0 }
}

// ───────────────────────────── Vídeo da caixa → biblioteca de criativos de anúncio ─────────────────────────────

/**
 * Copia o vídeo da caixa para a biblioteca de criativos do cliente (aba Anúncios → Criativos), de onde a Meta o recebe.
 * O vídeo continua na caixa, então ainda pode virar post. Devolve o id do criativo (use em criar_campanha_meta e adicionar_anuncio_meta).
 */
export async function criativoDaCaixa(sb: Supabase, itemId: string, nome?: string): Promise<{ criativoId: string; nome: string }> {
  const { data: item, error } = await sb.from('content_inbox').select('id, client_id, name, r2_key, mime, size_bytes, status').eq('id', itemId).single()
  if (error) throw error
  if (item.status !== 'pronto') throw new Error(item.status === 'usado' ? 'Este vídeo já virou post e saiu da caixa. Para usar em anúncio, crie o criativo antes do post.' : 'O vídeo ainda não está pronto (aguarde o envio ou a importação terminar).')
  if ((await tamanhoDoArquivo(item.r2_key)) === null) throw new Error('O arquivo não está mais no armazenamento. Envie o vídeo de novo.')
  const chave = gerarChaveCriativo(item.client_id, item.mime)
  await copiarArquivo(item.r2_key, chave, item.mime)
  const titulo = (nome?.trim() || item.name.replace(/\.[a-z0-9]+$/i, '')).slice(0, 200)
  const { data, error: e2 } = await sb.from('ad_creatives').insert({ client_id: item.client_id, nome: titulo, tipo: 'video', chave, mime: item.mime, tamanho: Number(item.size_bytes) || 1 }).select('id').single()
  if (e2) {
    await apagarArquivos([chave]).catch(() => [])
    throw e2
  }
  return { criativoId: data.id, nome: titulo }
}
