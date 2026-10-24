/** Regras do OAuth do MCP (app do Claude): endereços de retorno aceitos, PKCE e escopo. */

/** https em qualquer domínio (ex.: claude.ai) ou http só no próprio computador (apps de desktop). */
export function retornoValido(uri: string): boolean {
  try {
    const u = new URL(uri)
    if (u.hash) return false
    if (u.protocol === 'https:') return true
    return u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)
  } catch {
    return false
  }
}

const base64url = (bytes: ArrayBuffer) => Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** PKCE S256: base64url(sha256(verifier)) precisa ser igual ao challenge enviado no início. */
export async function pkceConfere(verifier: string, challenge: string): Promise<boolean> {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false
  return base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))) === challenge
}

/** O app pede "mcp" (ou nada): vale leitura e escrita, como as permissões da pessoa. "read" limita a leitura. */
export const escopoPedido = (scope: string | null | undefined): 'read' | 'write' => (scope?.split(/\s+/).includes('read') && !scope.split(/\s+/).includes('write') ? 'read' : 'write')

export const DURACAO_ACESSO_SEG = 30 * 86_400
export const DURACAO_RENOVACAO_SEG = 180 * 86_400
export const DURACAO_CODIGO_SEG = 600
