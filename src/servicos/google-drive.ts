import 'server-only'
import { createSign } from 'node:crypto'
import { MIME_VIDEO_CAIXA, tipoPelaPasta, type TipoDoVideo } from '@/dominio/caixa-de-entrada'

/**
 * Leitura (só leitura) do Google Drive com uma conta de serviço: o Drive só mostra o que foi compartilhado com o e-mail dela.
 * Variável GOOGLE_DRIVE_SA_JSON = a chave JSON da conta de serviço (ou o JSON em base64). Escopo drive.readonly.
 */

export class ErroDrive extends Error {}

type Chave = { client_email: string; private_key: string }

function chaveDaConta(): Chave {
  const bruto = process.env.GOOGLE_DRIVE_SA_JSON?.trim()
  if (!bruto) throw new ErroDrive('A integração com o Google Drive não está configurada (GOOGLE_DRIVE_SA_JSON).')
  try {
    const texto = bruto.startsWith('{') ? bruto : Buffer.from(bruto, 'base64').toString('utf8')
    const c = JSON.parse(texto) as Partial<Chave>
    if (!c.client_email || !c.private_key) throw new Error()
    return { client_email: c.client_email, private_key: c.private_key.replace(/\\n/g, '\n') }
  } catch {
    throw new ErroDrive('A chave da conta de serviço do Google (GOOGLE_DRIVE_SA_JSON) está inválida.')
  }
}

export const driveConfigurado = () => !!process.env.GOOGLE_DRIVE_SA_JSON?.trim()
export const emailDaContaDoDrive = (): string | null => {
  try {
    return chaveDaConta().client_email
  } catch {
    return null
  }
}

const b64 = (o: unknown) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
let guardado: { valor: string; expira: number } | undefined

async function token(): Promise<string> {
  if (guardado && guardado.expira > Date.now() + 60_000) return guardado.valor
  const c = chaveDaConta()
  const agora = Math.floor(Date.now() / 1000)
  const corpo = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: c.client_email, scope: 'https://www.googleapis.com/auth/drive.readonly', aud: 'https://oauth2.googleapis.com/token', iat: agora, exp: agora + 3600 })}`
  const assinatura = createSign('RSA-SHA256').update(corpo).sign(c.private_key, 'base64url')
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${corpo}.${assinatura}` }), cache: 'no-store' })
  const j = (await r.json()) as { access_token?: string; expires_in?: number; error_description?: string }
  if (!j.access_token) throw new ErroDrive(`O Google recusou a conta de serviço: ${j.error_description ?? 'erro desconhecido'}.`)
  guardado = { valor: j.access_token, expira: Date.now() + (j.expires_in ?? 3600) * 1000 }
  return guardado.valor
}

const API = 'https://www.googleapis.com/drive/v3'

async function api<T>(caminho: string, params: Record<string, string> = {}): Promise<T> {
  const r = await fetch(`${API}/${caminho}?${new URLSearchParams({ supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', ...params })}`, { headers: { authorization: `Bearer ${await token()}` }, cache: 'no-store' })
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: { message?: string } }
    if (r.status === 404) throw new ErroDrive('Pasta ou arquivo não encontrado. Confira se a pasta foi compartilhada com o e-mail da conta de serviço.')
    throw new ErroDrive(`Google Drive: ${j.error?.message ?? r.status}`)
  }
  return (await r.json()) as T
}

export type ArquivoDrive = { id: string; nome: string; mime: string; tamanho: number; modificadoEm: string; caminho: string; tipo: TipoDoVideo }
type Item = { id: string; name: string; mimeType: string; size?: string; modifiedTime?: string }

async function filhos(pastaId: string): Promise<Item[]> {
  const itens: Item[] = []
  let pagina: string | undefined
  do {
    const r = await api<{ files: Item[]; nextPageToken?: string }>('files', { q: `'${pastaId}' in parents and trashed = false`, fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime)', pageSize: '200', orderBy: 'modifiedTime desc', ...(pagina ? { pageToken: pagina } : {}) })
    itens.push(...r.files)
    pagina = r.nextPageToken
  } while (pagina && itens.length < 1000)
  return itens
}

const ehPasta = (i: Item) => i.mimeType === 'application/vnd.google-apps.folder'
const sem = (t: string) => t.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Vídeos (MP4 e MOV) da pasta do cliente e das subpastas (até 3 níveis), do mais novo para o mais antigo. `busca` filtra pelo nome. */
export async function listarVideos(pastaId: string, o: { busca?: string; tipo?: TipoDoVideo; limite?: number } = {}): Promise<ArquivoDrive[]> {
  const achados: ArquivoDrive[] = []
  const fila: { id: string; caminho: string[]; nivel: number }[] = [{ id: pastaId, caminho: [], nivel: 0 }]
  const termo = o.busca ? sem(o.busca) : ''
  while (fila.length && achados.length < 500) {
    const { id, caminho, nivel } = fila.shift()!
    for (const i of await filhos(id)) {
      if (ehPasta(i)) {
        if (nivel < 3) fila.push({ id: i.id, caminho: [...caminho, i.name], nivel: nivel + 1 })
        continue
      }
      if (!(MIME_VIDEO_CAIXA as readonly string[]).includes(i.mimeType)) continue
      if (termo && !sem(i.name).includes(termo)) continue
      const tipo = tipoPelaPasta(caminho)
      if (o.tipo && o.tipo !== 'indefinido' && tipo !== o.tipo) continue
      achados.push({ id: i.id, nome: i.name, mime: i.mimeType, tamanho: Number(i.size ?? 0), modificadoEm: i.modifiedTime ?? '', caminho: caminho.join(' / '), tipo })
    }
  }
  return achados.sort((a, b) => b.modificadoEm.localeCompare(a.modificadoEm)).slice(0, o.limite ?? 100)
}

/** Dados de um arquivo (nome, tipo, tamanho). Recusa pasta e arquivo que não é vídeo MP4/MOV. */
export async function dadosDoArquivo(arquivoId: string): Promise<ArquivoDrive> {
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(arquivoId)) throw new ErroDrive('Id do arquivo inválido.')
  const i = await api<Item>(`files/${arquivoId}`, { fields: 'id,name,mimeType,size,modifiedTime' })
  if (!(MIME_VIDEO_CAIXA as readonly string[]).includes(i.mimeType)) throw new ErroDrive(`Este arquivo não é MP4 nem MOV (${i.mimeType}).`)
  return { id: i.id, nome: i.name, mime: i.mimeType, tamanho: Number(i.size ?? 0), modificadoEm: i.modifiedTime ?? '', caminho: '', tipo: 'indefinido' }
}

/** Baixa o arquivo como fluxo (não carrega tudo na memória). */
export async function baixarArquivo(arquivoId: string): Promise<{ corpo: ReadableStream<Uint8Array>; tamanho: number | null }> {
  const r = await fetch(`${API}/files/${arquivoId}?${new URLSearchParams({ alt: 'media', supportsAllDrives: 'true' })}`, { headers: { authorization: `Bearer ${await token()}` }, cache: 'no-store' })
  if (!r.ok || !r.body) throw new ErroDrive(`Não consegui baixar o arquivo do Google Drive (${r.status}).`)
  const t = Number(r.headers.get('content-length'))
  return { corpo: r.body, tamanho: Number.isFinite(t) && t > 0 ? t : null }
}
