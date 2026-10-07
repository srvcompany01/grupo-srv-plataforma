export const COOKIE_LATERAL = 'srv-lateral'
export const COR_LATERAL_PADRAO = '#F6F6F7'

export const CORES_LATERAL = [
  { nome: 'Cinza claro', hex: '#F6F6F7' },
  { nome: 'Branco', hex: '#FFFFFF' },
  { nome: 'Cinza', hex: '#E4E4E7' },
  { nome: 'Rosa claro', hex: '#FDF0F0' },
  { nome: 'Vermelho SRV', hex: '#D11A22' },
  { nome: 'Vinho', hex: '#7A0F14' },
  { nome: 'Grafite', hex: '#27272A' },
  { nome: 'Preto', hex: '#111111' },
] as const

const HEX = /^#[0-9a-f]{6}$/i

/** Aceita "abc123", "#abc123" ou "#ABC"; devolve "#RRGGBB" em maiúsculas ou null. */
export function normalizarHex(entrada: string): string | null {
  let h = entrada.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = [...h].map((c) => c + c).join('')
  const hex = `#${h}`
  return HEX.test(hex) ? hex.toUpperCase() : null
}

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Variáveis CSS da barra lateral; o texto troca entre escuro e claro conforme o fundo. */
export function variaveisLateral(hex: string): Record<string, string> {
  const fundo = normalizarHex(hex) ?? COR_LATERAL_PADRAO
  // Limiar 0.4: abaixo disso o texto branco tem mais contraste que o preto.
  const claro = luminancia(fundo) > 0.4
  const t = claro ? '17, 17, 17' : '255, 255, 255'
  const v = claro ? '0, 0, 0' : '255, 255, 255'
  return {
    '--lat-bg': fundo,
    '--lat-fg': claro ? '#111111' : '#FFFFFF',
    '--lat-2': `rgba(${t}, 0.72)`,
    '--lat-3': `rgba(${t}, 0.52)`,
    '--lat-hover': `rgba(${v}, ${claro ? 0.05 : 0.1})`,
    '--lat-ativo': `rgba(${v}, ${claro ? 0.09 : 0.16})`,
    '--lat-borda': `rgba(${v}, ${claro ? 0.1 : 0.14})`,
  }
}

export function cssLateral(hex: string): string {
  return `:root{${Object.entries(variaveisLateral(hex)).map(([k, v]) => `${k}:${v}`).join(';')}}`
}

export type ModoLateral = 'fixa' | 'recolhida'
export const COOKIE_MODO_LATERAL = 'srv-lateral-modo'
export const COOKIE_LARGURA_LATERAL = 'srv-lateral-largura'
export const LARGURA_LATERAL = { padrao: 272, minima: 208, maxima: 440 } as const

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
