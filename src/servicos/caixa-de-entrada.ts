import { createHmac, timingSafeEqual } from 'node:crypto'
import { avisoDeVideoGrande, problemaDoVideo, type DestinoDoVideo, type ModoDoDestino, type StatusDaCaixa, type TipoDoVideo } from '@/dominio/caixa-de-entrada'
import { textoParaDescricao } from '@/dominio/descricao'
import type { Formato } from '@/dominio/conteudo'
import { apagarArquivos, copiarArquivo, enviarEmPartes, gerarChaveCaixa, gerarChaveConteudo, gerarChaveCriativo, tamanhoDoArquivo, urlLeitura, urlUpload } from '@/infra/r2'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Supabase } from '@/infra/supabase/servidor'
import { extrairAudio } from './audio-video'
import { baixarArquivo, dadosDoArquivo } from './google-drive'
import * as conteudo from './conteudo'
import { hashtagsDoCliente, salvarHashtagsDoCliente } from './hashtags-cliente'
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
  /** O áudio já foi extraído do vídeo. */
  audioPronto: boolean
  /** Andamento da transcrição (Whisper). */
  transcricao: EstadoTranscricao
  transcricaoErro: string
  /** Para onde a pessoa mandou o vídeo (null = ainda não escolheu). */
  destino: DestinoDoVideo | null
}

export type EstadoTranscricao = 'nao_pedida' | 'processando' | 'pronta' | 'erro'

/** Passou deste tempo "processando" sem resposta do GitHub: conta como falha, para o item não ficar preso para sempre. */
const PRAZO_TRANSCRICAO_MIN = 45

type Linha = { dest_list_id?: string | null; dest_task_id?: string | null; dest_mode?: string | null; dest_list?: { name: string } | null; dest_task?: { title: string } | null; audio_ready?: boolean; transcript_state?: string; transcript_error?: string; transcript_requested_at?: string | null; id: string; client_id: string; name: string; source: string; kind: string; status: string; size_bytes: number; error: string; post_task_id: string | null; created_at: string; clients: { name: string } | null }
const COLUNAS_ANTIGAS = 'id, client_id, name, source, kind, status, size_bytes, error, post_task_id, created_at, clients(name)'
const COLUNAS = `${COLUNAS_ANTIGAS}, audio_ready, transcript_state, transcript_error, transcript_requested_at, dest_list_id, dest_task_id, dest_mode, dest_list:lists!content_inbox_dest_list_id_fkey(name), dest_task:tasks!content_inbox_dest_task_id_fkey(title)`
function estadoDaTranscricao(l: Linha): Pick<ItemDaCaixa, 'audioPronto' | 'transcricao' | 'transcricaoErro'> {
  let transcricao = (l.transcript_state ?? 'nao_pedida') as EstadoTranscricao
  let transcricaoErro = l.transcript_error ?? ''
  if (transcricao === 'processando' && l.transcript_requested_at && Date.now() - new Date(l.transcript_requested_at).getTime() > PRAZO_TRANSCRICAO_MIN * 60_000) {
    transcricao = 'erro'
    transcricaoErro = 'A transcrição demorou demais. Tente de novo.'
  }
  return { audioPronto: !!l.audio_ready, transcricao, transcricaoErro }
}

const paraItem = (l: Linha): ItemDaCaixa => ({ id: l.id, clienteId: l.client_id, clienteNome: l.clients?.name ?? '', nome: l.name, origem: l.source as ItemDaCaixa['origem'], tipo: l.kind as TipoDoVideo, status: l.status as StatusDaCaixa, tamanho: Number(l.size_bytes), erro: l.error, postId: l.post_task_id, criadoEm: l.created_at, ...estadoDaTranscricao(l), destino: l.dest_list_id && l.dest_mode ? { listaId: l.dest_list_id, listaNome: l.dest_list?.name ?? '', tarefaId: l.dest_task_id ?? null, tarefaTitulo: l.dest_task?.title ?? '', modo: l.dest_mode as ModoDoDestino } : null })

export async function listarCaixa(sb: Supabase, f: { clienteId?: string; status?: StatusDaCaixa } = {}): Promise<ItemDaCaixa[]> {
  const buscar = async (colunas: string) => {
    let q = sb.from('content_inbox').select(colunas).order('created_at', { ascending: false }).limit(200)
    if (f.clienteId) q = q.eq('client_id', f.clienteId)
    if (f.status) q = q.eq('status', f.status)
    return q
  }
  let { data, error } = await buscar(COLUNAS)
  if (error) ({ data, error } = await buscar(COLUNAS_ANTIGAS)) // sem a migration da transcrição, a caixa abre sem o andamento
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

/** A pessoa escolhe para onde o vídeo vai. `null` limpa a escolha. A lista precisa ser de conteúdo (é onde as subtarefas viram posts). */
export async function definirDestino(sb: Supabase, itemId: string, d: { listaId: string; tarefaId: string | null; modo: ModoDoDestino } | null): Promise<void> {
  if (d) {
    const { data: lista } = await sb.from('lists').select('kind').eq('id', d.listaId).maybeSingle()
    if (!lista) throw new Error('Lista não encontrada.')
    if (lista.kind !== 'conteudo') throw new Error('Essa lista não é de conteúdo. Escolha uma lista de conteúdo (ou mude o tipo da lista nas configurações dela).')
    if (d.modo !== 'mae') {
      if (!d.tarefaId) throw new Error(d.modo === 'subtarefa' ? 'Escolha a tarefa onde a subtarefa será criada.' : 'Escolha a tarefa que vai receber o vídeo.')
      const { data: t } = await sb.from('tasks').select('list_id').eq('id', d.tarefaId).maybeSingle()
      if (!t || t.list_id !== d.listaId) throw new Error('Essa tarefa não está na lista escolhida.')
      if (d.modo === 'existente' && !(await conteudo.buscarConteudo(sb, d.tarefaId))) throw new Error('Essa tarefa ainda não é um post. Escolha uma subtarefa da lista de conteúdo.')
    }
  }
  const { error } = await sb.from('content_inbox').update({ dest_list_id: d?.listaId ?? null, dest_task_id: d && d.modo !== 'mae' ? d.tarefaId : null, dest_mode: d?.modo ?? null, updated_at: new Date().toISOString() }).eq('id', itemId).eq('status', 'pronto')
  if (error) throw error
}

/** Tarefas de uma lista, para escolher onde o vídeo entra (tarefas-mãe primeiro, cada uma seguida das suas subtarefas). `post`: já é um post de conteúdo (aceita o vídeo "na tarefa que já existe"). */
export async function tarefasParaDestino(sb: Supabase, listaId: string): Promise<{ id: string; titulo: string; subtarefa: boolean; post: boolean }[]> {
  const [tarefasDaLista, posts] = await Promise.all([
    sb.from('tasks').select('id, title, parent_task_id, position').eq('list_id', listaId).is('archived_at', null).order('position').limit(500),
    sb.from('content_posts').select('task_id, tasks!inner(list_id)').eq('tasks.list_id', listaId),
  ])
  if (tarefasDaLista.error) throw tarefasDaLista.error
  const ehPost = new Set((posts.data ?? []).map((p) => p.task_id))
  const data = tarefasDaLista.data ?? []
  const item = (t: (typeof data)[number], subtarefa: boolean) => ({ id: t.id, titulo: t.title, subtarefa, post: ehPost.has(t.id) })
  return data.filter((t) => !t.parent_task_id).flatMap((m) => [item(m, false), ...data.filter((t) => t.parent_task_id === m.id).map((t) => item(t, true))])
}

/**
 * Vira post: escreve a legenda e leva o vídeo da caixa para o post. Devolve o id do post.
 * Com `tarefaId` usa um post que já existe (ex.: a subtarefa "Post 01" de uma lista de conteúdo, onde toda subtarefa já é um post);
 * sem ele, cria um post novo em `listaId`.
 */
export async function criarPostDaCaixa(sb: Supabase, e: { itemId: string; titulo?: string; formato: Formato; dataPrevista: string; legenda: string; ideia?: string; objetivo?: string; descricao?: string }): Promise<string> {
  const { data: item, error } = await sb.from('content_inbox').select('id, client_id, name, r2_key, mime, size_bytes, status, dest_list_id, dest_task_id, dest_mode').eq('id', e.itemId).single()
  if (error) throw error
  if (item.status !== 'pronto') throw new Error(item.status === 'usado' ? 'Este vídeo já virou um post.' : 'O vídeo ainda não está pronto (aguarde o envio ou a importação terminar).')
  // O destino é escolhido pela pessoa na caixa de entrada; a IA nunca decide sozinha.
  if (!item.dest_list_id || !item.dest_mode) throw new Error('Este vídeo ainda não tem destino. Pergunte à pessoa onde a tarefa deve ficar (lista e tarefa) e como criar (tarefa-mãe, subtarefa ou na tarefa existente); ela também pode escolher na Caixa de entrada (botão Destino). Depois informe listaId e modo, ou chame definir_destino_video_caixa.')
  let tarefaId: string
  if (item.dest_mode === 'existente') {
    if (!item.dest_task_id) throw new Error('O destino escolhido para este vídeo perdeu a tarefa (ela foi removida). Peça para a pessoa escolher o destino de novo.')
    const existente = await conteudo.buscarConteudo(sb, item.dest_task_id)
    if (!existente) throw new Error('A tarefa escolhida como destino não é um post de conteúdo. Peça para a pessoa escolher outro destino.')
    if (existente.versoes.find((v) => v.numero === existente.versaoAtual)?.midias.length) throw new Error('O post escolhido como destino já tem mídia. Peça para a pessoa escolher outro destino.')
    tarefaId = item.dest_task_id
    if (existente.formato !== e.formato) await conteudo.alterarFormato(sb, tarefaId, e.formato)
    await tarefas.atualizarTarefa(sb, tarefaId, { prazo: e.dataPrevista })
  } else if (item.dest_mode === 'subtarefa') {
    if (!item.dest_task_id) throw new Error('O destino escolhido para este vídeo perdeu a tarefa (ela foi removida). Peça para a pessoa escolher o destino de novo.')
    if (!e.titulo) throw new Error('Informe o título do post (ele vira uma subtarefa nova).')
    const { data: eu } = await sb.auth.getUser()
    tarefaId = await tarefas.criarTarefa(sb, { listaId: item.dest_list_id, titulo: e.titulo, responsaveis: eu.user ? [eu.user.id] : [], paiId: item.dest_task_id })
    await tarefas.definirTagCliente(sb, tarefaId, item.client_id)
    await conteudo.alterarFormato(sb, tarefaId, e.formato)
    await tarefas.atualizarTarefa(sb, tarefaId, { prazo: e.dataPrevista })
  } else {
    if (!e.titulo) throw new Error('Informe o título do post (ele vira uma tarefa nova).')
    tarefaId = await conteudo.criarPost(sb, { listaId: item.dest_list_id, clienteId: item.client_id, titulo: e.titulo, formato: e.formato, dataPrevista: e.dataPrevista })
  }
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
  const instagram = await hashtagsDoCliente(sb, clienteId, 'instagram') // fonte única das hashtags: a aba Hashtags do cliente
  return { clienteId, pastaDrive: data?.drive_folder_id ?? '', tom: data?.tone ?? '', hashtags: instagram.length ? instagram.join(' ') : (data?.hashtags ?? ''), chamada: data?.cta ?? '', observacoes: data?.notes ?? '' }
}

export async function salvarFicha(sb: Supabase, f: Partial<Omit<FichaDeConteudo, 'clienteId'>> & { clienteId: string }): Promise<void> {
  const atual = await buscarFicha(sb, f.clienteId)
  if (f.hashtags !== undefined) await salvarHashtagsDoCliente(sb, f.clienteId, 'instagram', f.hashtags)
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
  if ((await tamanhoDoArquivo(chave)) === null) {
    const audio = await extrairAudio(await urlLeitura(item.r2_key))
    await enviarEmPartes(chave, 'audio/mpeg', new Blob([new Uint8Array(audio)]).stream())
  }
  await sb.from('content_inbox').update({ audio_ready: true }).eq('id', itemId)
  return chave
}

const PARTE_AUDIO = 2_400_000 // ~10 min de áudio a 32 kbps

/** O próprio áudio (em partes de ~10 min), para a IA ouvir pela conexão do MCP, sem precisar abrir endereço nenhum. */
export async function parteDoAudio(sb: Supabase, itemId: string, parte: number): Promise<{ nome: string; parte: number; totalPartes: number; base64: string; mime: 'audio/mpeg' }> {
  const chave = await prepararAudio(sb, itemId)
  const r = await fetch(await urlLeitura(chave))
  if (!r.ok) throw new Error('Não consegui ler o áudio no armazenamento.')
  const bytes = Buffer.from(await r.arrayBuffer())
  const totalPartes = Math.max(1, Math.ceil(bytes.length / PARTE_AUDIO))
  if (parte < 1 || parte > totalPartes) throw new Error(`Este áudio tem ${totalPartes} parte(s); peça de 1 a ${totalPartes}.`)
  const { data } = await sb.from('content_inbox').select('name').eq('id', itemId).single()
  return { nome: (data?.name ?? 'video').replace(/\.[^.]+$/, ''), parte, totalPartes, base64: bytes.subarray((parte - 1) * PARTE_AUDIO, parte * PARTE_AUDIO).toString('base64'), mime: 'audio/mpeg' }
}

/** Assinatura (HMAC) do id do item: vai no link fixo do áudio e impede que alguém adivinhe o endereço de outro vídeo. */
type Finalidade = 'audio-caixa' | 'transcricao-caixa'
export const tokenDoAudio = (itemId: string, finalidade: Finalidade = 'audio-caixa') => createHmac('sha256', process.env.CRON_SECRET ?? '').update(`${finalidade}:${itemId}`).digest('hex')

export function tokenValido(itemId: string, token: string, finalidade: Finalidade = 'audio-caixa'): boolean {
  if (!process.env.CRON_SECRET) return false
  const esperado = Buffer.from(tokenDoAudio(itemId, finalidade))
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

// ───────────────────────────── Transcrição (Whisper no GitHub Actions) ─────────────────────────────

/** O Whisper roda num repositório do GitHub (workflow `transcrever`), de graça nos minutos do GitHub Actions. */
export const whisperConfigurado = () => !!(process.env.WHISPER_REPO && process.env.WHISPER_GITHUB_TOKEN)

const marcar = (sb: Supabase, itemId: string, campos: Record<string, unknown>) => sb.from('content_inbox').update({ ...campos, updated_at: new Date().toISOString() }).eq('id', itemId)

/**
 * Extrai o áudio e pede a transcrição ao GitHub, que baixa o áudio, transcreve e devolve o texto em /api/caixa/transcricao.
 * `refazer`: pede de novo mesmo que já exista (ou esteja em andamento). Sem ele, quem chegou primeiro leva: dois pedidos ao mesmo tempo não duplicam.
 */
export async function pedirTranscricao(sb: Supabase, itemId: string, refazer = false): Promise<void> {
  if (!whisperConfigurado()) throw new Error('A transcrição ainda não foi configurada (WHISPER_REPO e WHISPER_GITHUB_TOKEN na Vercel).')
  let reserva = sb.from('content_inbox').update({ transcript_state: 'processando', transcript_error: '', transcript_requested_at: new Date().toISOString() }).eq('id', itemId).eq('status', 'pronto')
  if (!refazer) reserva = reserva.in('transcript_state', ['nao_pedida', 'erro'])
  const { data: reservado, error } = await reserva.select('id')
  if (error) throw error
  if (!reservado?.length) return
  try {
    await prepararAudio(sb, itemId)
    const site = (process.env.APP_URL ?? 'https://app.gruposrv.com.br').replace(/\/$/, '')
    const r = await fetch(`https://api.github.com/repos/${process.env.WHISPER_REPO}/actions/workflows/transcrever.yml/dispatches`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHISPER_GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: JSON.stringify({ ref: 'main', inputs: { audio: `${site}/api/caixa/audio/${itemId}?t=${tokenDoAudio(itemId)}`, retorno: `${site}/api/caixa/transcricao/${itemId}`, token: tokenDoAudio(itemId, 'transcricao-caixa') } }),
    })
    if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'O GitHub recusou o token (WHISPER_GITHUB_TOKEN).' : r.status === 404 ? 'Não achei o repositório ou o workflow "transcrever" no GitHub.' : `O GitHub respondeu com erro (${r.status}).`)
  } catch (e) {
    await marcar(sb, itemId, { transcript_state: 'erro', transcript_error: (e instanceof Error ? e.message : 'Falha ao pedir a transcrição.').slice(0, 300) })
    throw e
  }
}

/** Ao chegar um vídeo: extrai o áudio e, se o Whisper estiver configurado, já pede a transcrição. */
export async function pedirTranscricaoSeConfigurado(sb: Supabase, itemId: string): Promise<void> {
  if (whisperConfigurado()) await pedirTranscricao(sb, itemId)
  else await prepararAudio(sb, itemId)
}

/**
 * Põe em dia os vídeos prontos que ainda não passaram pelo processo (os enviados antes, ou os que ficaram para trás): poucos por vez,
 * para não sobrecarregar o servidor nem gastar os minutos do GitHub de uma vez. A caixa chama de novo a cada visita até acabar.
 * Os que falharam não voltam sozinhos (botão "Tentar de novo"), para não repetir o mesmo erro sem parar.
 */
export async function processarPendentes(sb: Supabase, limite = 3): Promise<void> {
  const { data, error } = await sb.from('content_inbox').select('id, audio_ready, transcript_state').eq('status', 'pronto').order('created_at', { ascending: false }).limit(100)
  if (error) return // sem a migration
  const pendentes = (data ?? []).filter((v) => (whisperConfigurado() ? v.transcript_state === 'nao_pedida' : !v.audio_ready)).slice(0, limite)
  for (const v of pendentes) await pedirTranscricaoSeConfigurado(sb, v.id).catch(() => {})
}

/** Chamada pelo GitHub quando termina. Usa a chave de serviço porque quem chama não tem login. `erro` = a transcrição falhou. */
export async function registrarTranscricao(itemId: string, r: { texto: string } | { erro: string }): Promise<void> {
  const campos = 'texto' in r ? { transcript_state: 'pronta', transcript: r.texto.slice(0, 200_000), transcript_error: '' } : { transcript_state: 'erro', transcript_error: r.erro.slice(0, 300) }
  const { error } = await criarClienteAdmin().from('content_inbox').update({ ...campos, updated_at: new Date().toISOString() }).eq('id', itemId).eq('status', 'pronto')
  if (error) throw error
}

export type Transcricao = { estado: EstadoTranscricao | 'indisponivel'; texto?: string; erro?: string }

/** O que o Codex lê: o texto guardado, ou o andamento. Pede a transcrição sozinha se ainda ninguém pediu (refazer=true pede de novo). */
export async function transcricaoDoVideo(sb: Supabase, itemId: string, refazer = false): Promise<Transcricao> {
  const { data, error } = await sb.from('content_inbox').select('status, transcript_state, transcript, transcript_error, transcript_requested_at').eq('id', itemId).single()
  if (error) throw error
  if (data.status !== 'pronto') throw new Error(data.status === 'usado' ? 'Este vídeo já virou post e saiu da caixa.' : 'O vídeo ainda não está pronto.')
  const { transcricao, transcricaoErro } = estadoDaTranscricao({ id: itemId, ...data } as unknown as Linha)
  if (transcricao === 'pronta' && !refazer) return { estado: 'pronta', texto: data.transcript }
  if (transcricao === 'processando' && !refazer) return { estado: 'processando' }
  if (!whisperConfigurado()) return { estado: 'indisponivel' }
  if (transcricao === 'erro' && !refazer) {
    await pedirTranscricao(sb, itemId)
    return { estado: 'processando', erro: `A tentativa anterior falhou (${transcricaoErro}); pedi de novo.` }
  }
  await pedirTranscricao(sb, itemId, refazer)
  return { estado: 'processando' }
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
