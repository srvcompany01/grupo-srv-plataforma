import 'server-only'
import { configIA } from './modelo'

/**
 * Gemini direto (API de arquivos + generateContent): lê áudio, vídeo e imagem. Usado pelo notetaker (atas) e pela
 * análise dos posts. Chave: GEMINI_API_KEY ou a IA_API_KEY quando a IA da plataforma já é o Gemini.
 */
export const GEMINI = 'https://generativelanguage.googleapis.com'

export type ConfigGemini = { chave: string; modelos: string[] }

/** `variavelModelos`: variável de ambiente com os modelos próprios desse uso (separados por vírgula). */
export function configGemini(variavelModelos: string): ConfigGemini | null {
  const ia = configIA()
  const iaEhGemini = ia?.baseUrl.includes('generativelanguage.googleapis.com')
  const chave = process.env.GEMINI_API_KEY || (iaEhGemini ? ia!.chave : '')
  if (!chave) return null
  const proprios = (process.env[variavelModelos] ?? '').split(',').map((m) => m.trim()).filter(Boolean)
  return { chave, modelos: proprios.length ? proprios : iaEhGemini ? ia!.modelos : ['gemini-2.5-flash'] }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Envia o arquivo para a API de arquivos do Gemini e espera o processamento (vídeo e áudio longos demoram). */
export async function enviarAoGemini(chave: string, bytes: ArrayBuffer, mime: string, nome = 'arquivo'): Promise<{ uri: string; nome: string }> {
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
    body: JSON.stringify({ file: { display_name: nome } }),
  })
  const destino = inicio.headers.get('x-goog-upload-url')
  if (!inicio.ok || !destino) throw new Error(`Gemini (envio) ${inicio.status}: ${await inicio.text()}`)
  const envio = await fetch(destino, { method: 'POST', headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' }, body: bytes })
  if (!envio.ok) throw new Error(`Gemini (envio) ${envio.status}: ${await envio.text()}`)
  let arquivo = ((await envio.json()) as { file: { uri: string; name: string; state?: string } }).file
  for (let i = 0; arquivo.state === 'PROCESSING' && i < 90; i++) {
    await esperar(2000)
    const r = await fetch(`${GEMINI}/v1beta/${arquivo.name}`, { headers: { 'x-goog-api-key': chave } })
    arquivo = (await r.json()) as typeof arquivo
  }
  if (arquivo.state === 'FAILED') throw new Error('O Gemini não conseguiu ler este arquivo.')
  return { uri: arquivo.uri, nome: arquivo.name }
}

export function apagarDoGemini(chave: string, nome: string): Promise<unknown> {
  return fetch(`${GEMINI}/v1beta/${nome}`, { method: 'DELETE', headers: { 'x-goog-api-key': chave } }).catch(() => null)
}

/** Pede JSON ao Gemini com o arquivo e o texto; tenta o próximo modelo se um estiver fora ou sobrecarregado. */
export async function gerarJsonGemini<T>(cfg: ConfigGemini, arquivo: { uri: string; mime: string } | null, texto: string, ler: (resposta: string) => T | null): Promise<T> {
  let ultimoErro = ''
  for (const modelo of cfg.modelos) {
    const r = await fetch(`${GEMINI}/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': cfg.chave, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [...(arquivo ? [{ file_data: { mime_type: arquivo.mime, file_uri: arquivo.uri } }] : []), { text: texto }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    })
    if (!r.ok) {
      ultimoErro = `${r.status}: ${(await r.text()).slice(0, 300)}`
      if ([404, 429, 500, 503].includes(r.status)) continue
      break
    }
    const corpo = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const lido = ler(corpo.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '')
    if (lido) return lido
    ultimoErro = 'resposta fora do formato'
  }
  throw new Error(`O Gemini não respondeu (${ultimoErro}).`)
}
