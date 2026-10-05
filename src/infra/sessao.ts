import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const COOKIE_SESSAO = 'admin_sessao'
export const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000

function assinar(expiraEm: string, segredo: string): string {
  return createHmac('sha256', segredo).update(expiraEm).digest('base64url')
}

function iguais(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/** Formato: `<expiraEm>.<hmac>`. Não guarda estado no servidor. */
export function criarCookieSessao(segredo: string, agora: number): string {
  const expiraEm = String(agora + DURACAO_SESSAO_MS)
  return `${expiraEm}.${assinar(expiraEm, segredo)}`
}

export function sessaoValida(valor: string | undefined, segredo: string, agora: number): boolean {
  if (!valor || !segredo) return false
  const [expiraEm, assinatura, ...resto] = valor.split('.')
  if (!expiraEm || !assinatura || resto.length > 0) return false
  if (!iguais(assinatura, assinar(expiraEm, segredo))) return false
  return Number(expiraEm) > agora
}

export function senhaConfere(digitada: string, correta: string): boolean {
  if (!digitada || !correta) return false
  return iguais(digitada, correta)
}
