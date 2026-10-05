import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const EXPIRA_UPLOAD = 60 * 60
const EXPIRA_LEITURA = 6 * 60 * 60

function exigir(nome: string): string {
  const v = process.env[nome]
  if (!v) throw new Error(`${nome} não configurada`)
  return v
}

let cliente: S3Client | undefined
function s3(): S3Client {
  cliente ??= new S3Client({
    region: 'auto',
    endpoint: `https://${exigir('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId: exigir('R2_ACCESS_KEY_ID'), secretAccessKey: exigir('R2_SECRET_ACCESS_KEY') },
  })
  return cliente
}

export function gerarChave(postId: string, nomeOriginal: string): string {
  const ponto = nomeOriginal.lastIndexOf('.')
  const ext = ponto > 0 ? nomeOriginal.slice(ponto + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  return `posts/${postId}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`
}

export async function urlUpload(chave: string, tipoMime: string, tamanhoBytes: number): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: exigir('R2_BUCKET'),
    Key: chave,
    ContentType: tipoMime,
    ContentLength: tamanhoBytes,
  })
  return getSignedUrl(s3(), cmd, { expiresIn: EXPIRA_UPLOAD })
}

export async function urlLeitura(chave: string, opcoes: { download?: string } = {}): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: exigir('R2_BUCKET'),
    Key: chave,
    ResponseContentDisposition: opcoes.download ? dispositionDownload(opcoes.download) : undefined,
  })
  return getSignedUrl(s3(), cmd, { expiresIn: EXPIRA_LEITURA })
}

function dispositionDownload(nome: string): string {
  const ascii = nome.normalize('NFD').replace(/[^\x20-\x7e]/g, '').replace(/["\\]/g, '_') || 'arquivo'
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nome)}`
}
