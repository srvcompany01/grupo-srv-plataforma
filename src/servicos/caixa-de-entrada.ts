import { problemaDoVideo, type StatusDaCaixa, type TipoDoVideo } from '@/dominio/caixa-de-entrada'
import type { Formato } from '@/dominio/conteudo'
import { apagarArquivos, copiarArquivo, enviarEmPartes, gerarChaveCaixa, gerarChaveConteudo, tamanhoDoArquivo, urlLeitura, urlUpload } from '@/infra/r2'
import { apagarDoGemini, configGemini, enviarAoGemini, gerarJsonGemini } from '@/ia/gemini'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Supabase } from '@/infra/supabase/servidor'
import { baixarArquivo, dadosDoArquivo } from './google-drive'
import * as conteudo from './conteudo'

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
export async function prepararEnvio(sb: Supabase, euId: string, e: { clienteId: string; nome: string; mime: string; tamanho: number; tipo?: TipoDoVideo; origem?: 'upload' | 'ia' }): Promise<{ id: string; urlEnvio: string }> {
  const problema = problemaDoVideo({ mime: e.mime, tamanho: e.tamanho })
  if (problema) throw new Error(problema)
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
export async function iniciarImportacaoDrive(sb: Supabase, euId: string, e: { clienteId: string; arquivoId: string; tipo?: TipoDoVideo }): Promise<string> {
  const arq = await dadosDoArquivo(e.arquivoId)
  const problema = problemaDoVideo({ mime: arq.mime, tamanho: arq.tamanho })
  if (problema) throw new Error(problema)
  const { data, error } = await sb.from('content_inbox').insert({ client_id: e.clienteId, name: arq.nome.slice(0, 255), source: 'drive', drive_file_id: arq.id, r2_key: gerarChaveCaixa(e.clienteId, arq.mime), mime: arq.mime, size_bytes: arq.tamanho, kind: e.tipo ?? 'indefinido', status: 'importando', created_by: euId }).select('id').single()
  if (error) {
    if ((error as { code?: string }).code === '23505') throw new Error('Este vídeo do Drive já está na caixa de entrada.')
    throw error
  }
  return data.id
}

/** Copia o arquivo do Drive para o armazenamento. Roda em segundo plano (chave mestra: não depende de quem pediu). */
export async function executarImportacao(itemId: string): Promise<void> {
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
}

/** Tenta de novo um item que deu erro (volta a "importando"). */
export async function reiniciarImportacao(sb: Supabase, itemId: string): Promise<void> {
  const { error } = await sb.from('content_inbox').update({ status: 'importando', error: '', updated_at: new Date().toISOString() }).eq('id', itemId).eq('source', 'drive').in('status', ['erro', 'importando'])
  if (error) throw error
}

export async function excluirItem(sb: Supabase, itemId: string): Promise<void> {
  const { data } = await sb.from('content_inbox').select('r2_key, status').eq('id', itemId).maybeSingle()
  const { error } = await sb.from('content_inbox').delete().eq('id', itemId)
  if (error) throw error
  if (data && data.status !== 'usado') await apagarArquivos([data.r2_key]).catch(() => [])
}

/** Vira post: cria o post na lista de conteúdo, escreve a legenda e leva o vídeo da caixa para o post. Devolve o id do post. */
export async function criarPostDaCaixa(sb: Supabase, e: { itemId: string; listaId: string; titulo: string; formato: Formato; dataPrevista: string; legenda: string; ideia?: string; objetivo?: string }): Promise<string> {
  const { data: item, error } = await sb.from('content_inbox').select('id, client_id, name, r2_key, mime, size_bytes, status').eq('id', e.itemId).single()
  if (error) throw error
  if (item.status !== 'pronto') throw new Error(item.status === 'usado' ? 'Este vídeo já virou um post.' : 'O vídeo ainda não está pronto (aguarde o envio ou a importação terminar).')
  const tarefaId = await conteudo.criarPost(sb, { listaId: e.listaId, clienteId: item.client_id, titulo: e.titulo, formato: e.formato, dataPrevista: e.dataPrevista })
  await conteudo.salvarTexto(sb, tarefaId, { ideia: e.ideia ?? '', objetivo: e.objetivo ?? '', legenda: e.legenda })
  const chave = gerarChaveConteudo(tarefaId, item.mime)
  await copiarArquivo(item.r2_key, chave, item.mime)
  await conteudo.registrarMidia(sb, tarefaId, { chave, tipo: 'video', nome: item.name, tamanho: Number(item.size_bytes) })
  await sb.from('content_inbox').update({ status: 'usado', post_task_id: tarefaId, updated_at: new Date().toISOString() }).eq('id', e.itemId)
  await apagarArquivos([item.r2_key]).catch(() => [])
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

// ───────────────────────────── A IA assiste ao vídeo ─────────────────────────────

const LIMITE_PARA_IA = 200 * 1024 * 1024

export type DescricaoDoVideo = { resumo: string; fala: string; temas: string[]; tom: string; ganchos: string[] }

const lerDescricao = (texto: string): DescricaoDoVideo | null => {
  try {
    const j = JSON.parse(texto.replace(/^```(?:json)?|```$/g, '').trim()) as Partial<DescricaoDoVideo>
    if (typeof j.resumo !== 'string') return null
    const lista = (v: unknown) => (Array.isArray(v) ? v.map(String).slice(0, 6) : [])
    return { resumo: j.resumo.slice(0, 600), fala: String(j.fala ?? '').slice(0, 4000), temas: lista(j.temas), tom: String(j.tom ?? '').slice(0, 200), ganchos: lista(j.ganchos).slice(0, 3) }
  } catch {
    return null
  }
}

/**
 * A IA da plataforma (Gemini) assiste ao vídeo e devolve resumo, fala transcrita, temas, tom e ideias de abertura de legenda.
 * Serve para quem escreve a legenda (a IA conectada pelo MCP não consegue ver o vídeo). O resultado fica guardado no item.
 */
export async function descreverVideo(sb: Supabase, itemId: string, refazer = false): Promise<DescricaoDoVideo> {
  const { data: item, error } = await sb.from('content_inbox').select('id, name, r2_key, mime, size_bytes, status, ai_summary, client_id').eq('id', itemId).single()
  if (error) throw error
  if (item.ai_summary && !refazer) {
    const guardado = lerDescricao(item.ai_summary)
    if (guardado) return guardado
  }
  if (item.status !== 'pronto' && item.status !== 'usado') throw new Error('O vídeo ainda não está pronto.')
  if (item.status === 'usado') throw new Error('Este vídeo já virou post e saiu da caixa.')
  if (Number(item.size_bytes) > LIMITE_PARA_IA) throw new Error('Vídeo grande demais para a IA assistir (limite de 200 MB). Descreva o conteúdo à mão.')
  const cfg = configGemini('ANALISE_POST_MODELO')
  if (!cfg) throw new Error('A análise de vídeo precisa da chave do Gemini (GEMINI_API_KEY).')
  const r = await fetch(await urlLeitura(item.r2_key))
  if (!r.ok) throw new Error('Não consegui ler o vídeo no armazenamento.')
  const arquivo = await enviarAoGemini(cfg.chave, await r.arrayBuffer(), item.mime === 'video/quicktime' ? 'video/mov' : item.mime, 'caixa')
  try {
    const prompt = `Assista ao vídeo "${item.name}" (conteúdo de Instagram de uma agência de marketing, em português do Brasil) e responda SÓ com JSON neste formato:
{"resumo": "o que acontece no vídeo, em até 400 caracteres", "fala": "transcrição fiel do que é falado, ou vazio se não houver fala", "temas": ["até 6 temas ou palavras-chave"], "tom": "tom do vídeo em poucas palavras (ex.: descontraído, técnico, emocional)", "ganchos": ["até 3 primeiras frases possíveis para a legenda"]}
Não invente nada que não esteja no vídeo.`
    const d = await gerarJsonGemini(cfg, { uri: arquivo.uri, mime: item.mime === 'video/quicktime' ? 'video/mov' : item.mime }, prompt, lerDescricao)
    await sb.from('content_inbox').update({ ai_summary: JSON.stringify(d), updated_at: new Date().toISOString() }).eq('id', itemId)
    return d
  } finally {
    await apagarDoGemini(cfg.chave, arquivo.nome).catch(() => {})
  }
}
