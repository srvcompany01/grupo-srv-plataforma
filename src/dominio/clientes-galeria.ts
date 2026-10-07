import { formatarData } from './formatar'

export type TipoCampoCliente = 'texto' | 'numero' | 'data' | 'link'
export const TIPOS_CAMPO_CLIENTE: { tipo: TipoCampoCliente; rotulo: string }[] = [
  { tipo: 'texto', rotulo: 'Texto' },
  { tipo: 'numero', rotulo: 'Número' },
  { tipo: 'data', rotulo: 'Data' },
  { tipo: 'link', rotulo: 'Link' },
]

export const LIMITE_CAPA = 5 * 1024 * 1024
export const EXTENSAO_CAPA: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export function validarCapa(a: { mime: string; tamanho: number }): string | null {
  if (!Object.hasOwn(EXTENSAO_CAPA, a.mime)) return 'Use uma imagem JPG, PNG ou WebP.'
  if (a.tamanho <= 0) return 'Arquivo vazio.'
  if (a.tamanho > LIMITE_CAPA) return 'A imagem deve ter até 5 MB.'
  return null
}

/** Chave de capa enviada: só aceita o formato que nós mesmos geramos para aquele cliente. */
export function chaveDeCapaValida(chave: string, clienteId: string): boolean {
  return new RegExp(`^clientes/${clienteId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(chave)
}

function host(url: string): string | null {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' ? u.hostname : null
  } catch {
    return null
  }
}
export const ehImagemUnsplash = (url: string) => host(url) === 'images.unsplash.com'
export const ehDownloadUnsplash = (url: string) => host(url) === 'api.unsplash.com'

/** Valor mostrado no cartão da galeria. */
export function formatarCampoCliente(tipo: TipoCampoCliente, valor: string): string {
  if (tipo === 'data' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return formatarData(valor)
  if (tipo === 'link') return host(valor)?.replace(/^www\./, '') ?? valor
  return valor
}

export function iniciais(nome: string): string {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}
