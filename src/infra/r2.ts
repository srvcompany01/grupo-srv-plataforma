import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { EXTENSAO_ANEXO, normalizarMime } from '@/dominio/anexos'
import { EXTENSAO_POR_TIPO } from '@/dominio/midias'

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
    // SDK >= 3.729 assina um checksum do corpo; numa URL pré-assinada seria o de um corpo vazio.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: { accessKeyId: exigir('R2_ACCESS_KEY_ID'), secretAccessKey: exigir('R2_SECRET_ACCESS_KEY') },
  })
  return cliente
}

/** A extensão vem do tipo já validado, não do nome que o usuário deu ao arquivo. */
export function gerarChave(postId: string, tipoMime: string): string {
  const ext = EXTENSAO_POR_TIPO[tipoMime]
  if (!ext) throw new Error(`Tipo sem extensão conhecida: ${tipoMime}`)
  return `posts/${postId}/${crypto.randomUUID()}.${ext}`
}

/** Anexos de comentário: `tarefas/<id>/<uuid>.<ext>`; a extensão vem do mime já validado. */
export function gerarChaveTarefa(tarefaId: string, mime: string): string {
  const ext = EXTENSAO_ANEXO[normalizarMime(mime)]
  if (!ext) throw new Error(`Tipo sem extensão conhecida: ${mime}`)
  return `tarefas/${tarefaId}/${crypto.randomUUID()}.${ext}`
}

/** `ARMAZENAMENTO_LOCAL=1` grava em .dados/arquivos via /api/dev-arquivos. Nunca em produção. */
export function armazenamentoLocal(): boolean {
  return process.env.ARMAZENAMENTO_LOCAL === '1' && process.env.NODE_ENV !== 'production'
}

export async function urlUpload(chave: string, tipoMime: string, tamanhoBytes: number): Promise<string> {
  if (armazenamentoLocal()) return `/api/dev-arquivos/${chave}`
  const cmd = new PutObjectCommand({
    Bucket: exigir('R2_BUCKET'),
    Key: chave,
    ContentType: tipoMime,
    ContentLength: tamanhoBytes,
  })
  return getSignedUrl(s3(), cmd, { expiresIn: EXPIRA_UPLOAD })
}

export async function urlLeitura(chave: string, opcoes: { download?: string } = {}): Promise<string> {
  if (armazenamentoLocal()) {
    return `/api/dev-arquivos/${chave}${opcoes.download ? `?download=${encodeURIComponent(opcoes.download)}` : ''}`
  }
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
