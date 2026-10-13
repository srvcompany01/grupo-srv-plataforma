import { gerarToken } from './token'

export type EscopoToken = 'read' | 'write'
export const ESCOPOS_TOKEN: readonly EscopoToken[] = ['read', 'write']
export const PREFIXO_TOKEN = 'srv_'

/** O token completo só existe no momento da criação; o banco guarda só o hash. */
export const gerarTokenApi = () => `${PREFIXO_TOKEN}${gerarToken()}`

export const pareceTokenApi = (valor: string) => /^srv_[A-Za-z0-9]{32}$/.test(valor)

/** SHA-256 em hex (Web Crypto: igual no Node e no navegador). */
export async function hashToken(token: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** `Authorization: Bearer srv_…` → token ou null. */
export function tokenDoCabecalho(cabecalho: string | null): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(cabecalho?.trim() ?? '')
  return m && pareceTokenApi(m[1]) ? m[1] : null
}
