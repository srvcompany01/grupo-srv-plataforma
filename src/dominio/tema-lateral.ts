export type ModoLateral = 'fixa' | 'recolhida'
export const COOKIE_MODO_LATERAL = 'srv-lateral-modo'
export const COOKIE_LARGURA_LATERAL = 'srv-lateral-largura'
export const LARGURA_LATERAL = { padrao: 264, minima: 208, maxima: 440 } as const

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
