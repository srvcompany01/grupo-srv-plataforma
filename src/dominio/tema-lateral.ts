export type ModoLateral = 'fixa' | 'recolhida'
export const COOKIE_MODO_LATERAL = 'srv-lateral-modo'
export const COOKIE_LARGURA_LATERAL = 'srv-lateral-largura'
export const LARGURA_LATERAL = { padrao: 240, minima: 208, maxima: 440 } as const

export function lerModoLateral(valor: string | undefined): ModoLateral {
  return valor === 'recolhida' ? 'recolhida' : 'fixa'
}

export function limitarLargura(valor: number): number {
  const { minima, maxima, padrao } = LARGURA_LATERAL
  return Number.isFinite(valor) ? Math.min(maxima, Math.max(minima, Math.round(valor))) : padrao
}

export function lerLarguraLateral(valor: string | undefined): number {
  return valor ? limitarLargura(Number(valor)) : LARGURA_LATERAL.padrao
}

export const COOKIE_NAV_FECHADOS = 'srv-nav-fechados'
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_FECHADOS = 60

/** Ids de espaços e pastas recolhidos na barra (separados por "."), sem repetidos nem valores inválidos. */
export function lerFechados(valor: string | undefined): string[] {
  return [...new Set((valor ?? '').split('.').filter((id) => ID.test(id)))].slice(0, MAX_FECHADOS)
}

export const escreverFechados = (ids: Iterable<string>): string => [...ids].slice(-MAX_FECHADOS).join('.')
