import 'server-only'
import { CHAVE_REUNIAO, PROMPT_ATA, conteudoDaAta, conteudoDaTranscricao, extensaoDaGravacao, lerAta, type Ata } from '@/dominio/ata'
import { dataDeHoje } from '@/dominio/filtros'
import { configIA } from '@/ia/modelo'
import { urlLeitura, urlUpload } from '@/infra/r2'
import type { Supabase } from '@/infra/supabase/servidor'
import { buscarCliente } from './clientes-plataforma'
import { criarDocumento } from './documentos'
import * as tarefas from './tarefas'

/**
 * Notetaker: a gravação vai para o R2, o servidor manda o áudio para a API de arquivos do Gemini (aceita reuniões
 * longas) e pede a ata em JSON. Chave: GEMINI_API_KEY ou a IA_API_KEY quando a IA da plataforma já é o Gemini.
 */
const GEMINI = 'https://generativelanguage.googleapis.com'

function configGemini(): { chave: string; modelos: string[] } | null {
  const ia = configIA()
  const iaEhGemini = ia?.baseUrl.includes('generativelanguage.googleapis.com')
  const chave = process.env.GEMINI_API_KEY || (iaEhGemini ? ia!.chave : '')
  if (!chave) return null
  const proprios = (process.env.NOTETAKER_MODELO ?? '').split(',').map((m) => m.trim()).filter(Boolean)
  return { chave, modelos: proprios.length ? proprios : iaEhGemini ? ia!.modelos : ['gemini-2.5-flash'] }
}
export const notetakerConfigurado = () => configGemini() !== null

/** URL para o navegador enviar a gravação direto ao armazenamento. */
export async function urlEnvioReuniao(mime: string, tamanho: number): Promise<{ chave: string; url: string }> {
  const chave = `reunioes/${crypto.randomUUID()}.${extensaoDaGravacao(mime)}`
  return { chave, url: await urlUpload(chave, mime, tamanho) }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function enviarAoGemini(chave: string, bytes: ArrayBuffer, mime: string): Promise<{ uri: string; nome: string }> {
  const inicio = await fetch(`${GEMINI}/upload/v1beta/files`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': chave,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(bytes.byteLength),
      'X-Goog-Upload-Header-Content-Type': mime,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'reuniao' } }),
  })
  const destino = inicio.headers.get('x-goog-upload-url')
  if (!inicio.ok || !destino) throw new Error(`Gemini (envio) ${inicio.status}: ${await inicio.text()}`)
  const envio = await fetch(destino, { method: 'POST', headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' }, body: bytes })
  if (!envio.ok) throw new Error(`Gemini (envio) ${envio.status}: ${await envio.text()}`)
  let arquivo = ((await envio.json()) as { file: { uri: string; name: string; state?: string } }).file
  // Vídeo e áudio longos passam por processamento antes de poder ser usados.
  for (let i = 0; arquivo.state === 'PROCESSING' && i < 90; i++) {
    await esperar(2000)
    const r = await fetch(`${GEMINI}/v1beta/${arquivo.name}`, { headers: { 'x-goog-api-key': chave } })
    arquivo = (await r.json()) as typeof arquivo
  }
  if (arquivo.state === 'FAILED') throw new Error('O Gemini não conseguiu ler o áudio desta gravação.')
  return { uri: arquivo.uri, nome: arquivo.name }
}

async function gerarAta(cfg: { chave: string; modelos: string[] }, arquivo: { uri: string }, mime: string, data: string): Promise<Ata> {
  let ultimoErro = ''
  for (const modelo of cfg.modelos) {
    const r = await fetch(`${GEMINI}/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': cfg.chave, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ file_data: { mime_type: mime, file_uri: arquivo.uri } }, { text: `${PROMPT_ATA}\nData da reunião: ${data}.` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    })
    if (!r.ok) {
      ultimoErro = `${r.status}: ${(await r.text()).slice(0, 300)}`
      if ([404, 429, 500, 503].includes(r.status)) continue // modelo indisponível ou sobrecarregado: tenta o próximo
      break
    }
    const corpo = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const ata = lerAta(corpo.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '')
    if (ata) return ata
    ultimoErro = 'resposta sem ata'
  }
  throw new Error(`O Gemini não gerou a ata (${ultimoErro}).`)
}

export type EntradaReuniao = { chave: string; mime: string; titulo: string; clienteId: string | null; listaId: string | null; criarTarefas: boolean; duracaoMin: number | null }

/** Gera a ata da gravação e cria o documento (e, se pedido, as tarefas dos próximos passos na lista). */
export async function processarReuniao(sb: Supabase, euId: string, e: EntradaReuniao): Promise<{ documentoId: string; tarefasCriadas: number }> {
  if (!CHAVE_REUNIAO.test(e.chave)) throw new Error('Gravação inválida.')
  const cfg = configGemini()
  if (!cfg) throw new Error('O notetaker precisa de uma chave do Gemini (GEMINI_API_KEY).')
  const audio = await fetch(await urlLeitura(e.chave))
  if (!audio.ok) throw new Error('Não encontrei a gravação enviada.')
  const bytes = await audio.arrayBuffer()
  const data = dataDeHoje(new Date())
  const arquivo = await enviarAoGemini(cfg.chave, bytes, e.mime)
  let ata: Ata
  try {
    ata = await gerarAta(cfg, arquivo, e.mime, data)
  } finally {
    await fetch(`${GEMINI}/v1beta/${arquivo.nome}`, { method: 'DELETE', headers: { 'x-goog-api-key': cfg.chave } }).catch(() => null)
  }
  const cliente = e.clienteId ? await buscarCliente(sb, e.clienteId) : null
  const titulo = `Ata — ${e.titulo.trim() || ata.titulo || 'Reunião'} — ${data.split('-').reverse().slice(0, 2).join('/')}`
  const documentoId = await criarDocumento(sb, euId, {
    titulo,
    clienteId: cliente?.id ?? null,
    listaId: e.listaId ?? undefined,
    paginas: [
      { titulo: 'Ata', conteudo: conteudoDaAta(ata, { data, duracaoMin: e.duracaoMin, cliente: cliente?.nome ?? null }) },
      { titulo: 'Transcrição', conteudo: conteudoDaTranscricao(ata.transcricao) },
    ],
  })
  let tarefasCriadas = 0
  if (e.criarTarefas && e.listaId) {
    for (const p of ata.proximosPassos) {
      const id = await tarefas.criarTarefa(sb, { listaId: e.listaId, titulo: p.responsavel ? `${p.acao} (${p.responsavel})` : p.acao, responsaveis: [euId] })
      if (p.prazo) await tarefas.atualizarTarefa(sb, id, { prazo: p.prazo })
      if (cliente) await tarefas.definirTagCliente(sb, id, cliente.id)
      tarefasCriadas++
    }
  }
  return { documentoId, tarefasCriadas }
}
