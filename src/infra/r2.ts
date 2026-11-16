import { AbortMultipartUploadCommand, CompleteMultipartUploadCommand, CopyObjectCommand, CreateMultipartUploadCommand, DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, UploadPartCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { EXTENSAO_ANEXO, normalizarMime } from '@/dominio/anexos'
import { EXTENSAO_CAPA } from '@/dominio/clientes-galeria'
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
  const m = normalizarMime(mime)
  const ext = Object.hasOwn(EXTENSAO_ANEXO, m) ? EXTENSAO_ANEXO[m] : undefined
  if (!ext) throw new Error(`Tipo sem extensão conhecida: ${mime}`)
  return `tarefas/${tarefaId}/${crypto.randomUUID()}.${ext}`
}

/** Mídias de post de conteúdo: `conteudo/<tarefa>/<uuid>.<ext>`; a extensão vem do mime já validado. */
export function gerarChaveConteudo(tarefaId: string, mime: string): string {
  const ext = EXTENSAO_POR_TIPO[mime]
  if (!ext) throw new Error(`Tipo sem extensão conhecida: ${mime}`)
  return `conteudo/${tarefaId}/${crypto.randomUUID()}.${ext}`
}

/** Caixa de entrada de vídeos do cliente: `caixa/<cliente>/<uuid>.<ext>`; a extensão vem do mime já validado. */
export function gerarChaveCaixa(clienteId: string, mime: string): string {
  const ext = EXTENSAO_POR_TIPO[mime]
  if (!ext) throw new Error(`Tipo sem extensão conhecida: ${mime}`)
  return `caixa/${clienteId}/${crypto.randomUUID()}.${ext}`
}

/** Anexos do chat: `chat/<canal>/<uuid>.<ext>`; a extensão vem do mime já validado. */
export function gerarChaveChat(canalId: string, mime: string): string {
  const m = normalizarMime(mime)
  const ext = Object.hasOwn(EXTENSAO_ANEXO, m) ? EXTENSAO_ANEXO[m] : undefined
  if (!ext) throw new Error(`Tipo sem extensão conhecida: ${mime}`)
  return `chat/${canalId}/${crypto.randomUUID()}.${ext}`
}

/** Capas de cliente: `clientes/<id>/<uuid>.<ext>`; a extensão vem do mime já validado. */
export function gerarChaveCliente(clienteId: string, mime: string): string {
  const ext = EXTENSAO_CAPA[mime]
  if (!ext) throw new Error(`Tipo sem extensão conhecida: ${mime}`)
  return `clientes/${clienteId}/${crypto.randomUUID()}.${ext}`
}

/** Criativos de anúncio do cliente: `criativos/<cliente>/<uuid>.<ext>`; a extensão vem do mime já validado. */
export function gerarChaveCriativo(clienteId: string, mime: string): string {
  const ext = EXTENSAO_POR_TIPO[mime]
  if (!ext) throw new Error(`Tipo sem extensão conhecida: ${mime}`)
  return `criativos/${clienteId}/${crypto.randomUUID()}.${ext}`
}

/** Imagens do blog (capas e fotos dos artigos): servidas publicamente por /blog/imagem/<chave>. */
export function gerarChaveBlog(mime: string): string {
  const ext = EXTENSAO_CAPA[mime]
  if (!ext) throw new Error(`Tipo sem extensão conhecida: ${mime}`)
  return `blog/${crypto.randomUUID()}.${ext}`
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

/** Imagem mostrada no lugar de um arquivo que o ciclo de renovação já apagou. */
export const ARQUIVO_ARQUIVADO = '/arquivo-arquivado.svg'

/** `arquivado`: data em que o ciclo apagou o arquivo (aí devolve a imagem de "arquivado"). */
export async function urlLeitura(chave: string, opcoes: { download?: string; arquivado?: string | null } = {}): Promise<string> {
  if (opcoes.arquivado) return ARQUIVO_ARQUIVADO
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

/** Apaga os arquivos (de 1.000 em 1.000). Devolve as chaves que o R2 não conseguiu apagar. */
export async function apagarArquivos(chaves: string[]): Promise<string[]> {
  if (armazenamentoLocal()) {
    const { rm } = await import('node:fs/promises')
    const path = await import('node:path')
    await Promise.all(chaves.map((c) => rm(path.join(process.cwd(), '.dados', 'arquivos', c), { force: true })))
    return []
  }
  const falhas: string[] = []
  for (let i = 0; i < chaves.length; i += 1000) {
    const r = await s3().send(new DeleteObjectsCommand({ Bucket: exigir('R2_BUCKET'), Delete: { Objects: chaves.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true } }))
    falhas.push(...(r.Errors ?? []).map((e) => e.Key ?? ''))
  }
  return falhas
}

/** Arquivos de uma pasta enviados antes de `antes` (para limpar o que não tem registro no banco). */
export async function arquivosAntigos(prefixo: string, antes: Date): Promise<{ chave: string; bytes: number }[]> {
  if (armazenamentoLocal()) return []
  const lista: { chave: string; bytes: number }[] = []
  let token: string | undefined
  do {
    const r = await s3().send(new ListObjectsV2Command({ Bucket: exigir('R2_BUCKET'), Prefix: prefixo, ContinuationToken: token }))
    for (const o of r.Contents ?? []) if (o.Key && o.LastModified && o.LastModified < antes) lista.push({ chave: o.Key, bytes: o.Size ?? 0 })
    token = r.NextContinuationToken
  } while (token)
  return lista
}

/** Tamanho do arquivo no R2, ou null se não existe. */
export async function tamanhoDoArquivo(chave: string): Promise<number | null> {
  if (armazenamentoLocal()) return null
  try {
    const r = await s3().send(new HeadObjectCommand({ Bucket: exigir('R2_BUCKET'), Key: chave }))
    return r.ContentLength ?? 0
  } catch {
    return null
  }
}

/** Copia um arquivo dentro do bucket (do lado do servidor do R2, sem baixar). Até 5 GB. */
export async function copiarArquivo(origem: string, destino: string, tipoMime: string): Promise<void> {
  if (armazenamentoLocal()) throw new Error('Copiar arquivos só funciona com o R2.')
  const bucket = exigir('R2_BUCKET')
  await s3().send(new CopyObjectCommand({ Bucket: bucket, Key: destino, CopySource: `${bucket}/${origem.split('/').map(encodeURIComponent).join('/')}`, ContentType: tipoMime, MetadataDirective: 'REPLACE' }))
}

const PARTE = 32 * 1024 * 1024

/**
 * Grava no R2 um arquivo que chega aos poucos (ex.: download do Google Drive), em partes de 32 MB, sem guardar o arquivo inteiro na memória.
 * Se algo falhar, a gravação em partes é cancelada e nada fica no bucket.
 */
export async function enviarEmPartes(chave: string, tipoMime: string, corpo: ReadableStream<Uint8Array>): Promise<number> {
  if (armazenamentoLocal()) throw new Error('Enviar em partes só funciona com o R2.')
  const bucket = exigir('R2_BUCKET')
  const { UploadId } = await s3().send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: chave, ContentType: tipoMime }))
  if (!UploadId) throw new Error('O R2 não iniciou o envio.')
  const partes: { ETag: string; PartNumber: number }[] = []
  let total = 0
  let atual: Uint8Array[] = []
  let tamanhoAtual = 0
  const enviar = async (bytes: Uint8Array) => {
    const numero = partes.length + 1
    const r = await s3().send(new UploadPartCommand({ Bucket: bucket, Key: chave, UploadId, PartNumber: numero, Body: bytes, ContentLength: bytes.byteLength }))
    partes.push({ ETag: r.ETag ?? '', PartNumber: numero })
  }
  try {
    const leitor = corpo.getReader()
    for (;;) {
      const { done, value } = await leitor.read()
      if (done) break
      atual.push(value)
      tamanhoAtual += value.byteLength
      total += value.byteLength
      if (tamanhoAtual >= PARTE) {
        await enviar(Buffer.concat(atual))
        atual = []
        tamanhoAtual = 0
      }
    }
    if (tamanhoAtual > 0 || partes.length === 0) await enviar(Buffer.concat(atual))
    await s3().send(new CompleteMultipartUploadCommand({ Bucket: bucket, Key: chave, UploadId, MultipartUpload: { Parts: partes } }))
    return total
  } catch (e) {
    await s3().send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: chave, UploadId })).catch(() => {})
    throw e
  }
}
