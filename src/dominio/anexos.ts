export type TipoAnexo = 'arquivo' | 'audio' | 'video'

export const LIMITE_ARQUIVO = 104_857_600
export const LIMITE_VIDEO = 524_288_000
export const MAX_ANEXOS = 10
export const DURACAO_MAX_GRAVACAO_S = 600

export const EXTENSAO_ANEXO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/zip': 'zip',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
}

/** `audio/webm;codecs=opus` → `audio/webm`. */
export function normalizarMime(mime: string): string {
  return mime.split(';')[0].trim().toLowerCase()
}

export function tipoDoAnexo(mime: string): TipoAnexo {
  const m = normalizarMime(mime)
  if (m.startsWith('audio/')) return 'audio'
  if (m.startsWith('video/')) return 'video'
  return 'arquivo'
}

export function validarAnexo(a: { mime: string; tamanho: number }): string | null {
  const mime = normalizarMime(a.mime)
  if (!(mime in EXTENSAO_ANEXO)) return 'Tipo de arquivo não permitido'
  if (a.tamanho <= 0) return 'Arquivo vazio'
  if (tipoDoAnexo(mime) === 'video') return a.tamanho > LIMITE_VIDEO ? 'Vídeo maior que 500 MB' : null
  return a.tamanho > LIMITE_ARQUIVO ? 'Arquivo maior que 100 MB' : null
}
