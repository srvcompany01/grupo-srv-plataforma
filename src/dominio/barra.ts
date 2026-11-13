import { normalizarHex } from './campos-gestao'
import { contraste } from './tema'

/** Cookie com a cor da barra de ícones (por navegador; não precisa de banco). */
export const COOKIE_COR_BARRA = 'srv-barra-cor'
export const COR_BARRA_PADRAO = '#0b0b0c'

export const CORES_BARRA: { nome: string; hex: string }[] = [
  { nome: 'Preto', hex: COR_BARRA_PADRAO },
  { nome: 'Grafite', hex: '#27272a' },
  { nome: 'Vermelho', hex: '#d80d12' },
  { nome: 'Azul-marinho', hex: '#14233a' },
  { nome: 'Verde-floresta', hex: '#0f3d2e' },
  { nome: 'Roxo', hex: '#2e1a47' },
  { nome: 'Creme', hex: '#f0eee9' },
  { nome: 'Branco', hex: '#ffffff' },
]

const VERMELHO = '#e5232a'
const BRANCO = '#ffffff'
const PRETO = '#111113'
const melhor = (fundo: string, opcoes: string[]) => opcoes.reduce((a, b) => (contraste(fundo, b) > contraste(fundo, a) ? b : a))

/** Cor válida (#rrggbb) ou, se vier lixo/vazio, a padrão. */
export const lerCorBarra = (valor: string | undefined): string => (valor ? normalizarHex(decodeURIComponent(valor)) : null) ?? COR_BARRA_PADRAO

/**
 * Variáveis da faixa a partir da cor de fundo. Os ícones ficam vermelhos quando enxergam bem sobre a cor
 * (contraste ≥ 3); senão trocam para branco ou preto, o que der mais contraste. O item ativo inverte: ladrilho na cor do ícone.
 */
export function variaveisBarra(fundo: string): Record<string, string> {
  const icone = contraste(fundo, VERMELHO) >= 3 ? VERMELHO : melhor(fundo, [BRANCO, PRETO])
  const ativo = icone === VERMELHO ? '#d80d12' : icone
  return {
    '--faixa-fundo': fundo,
    '--faixa-icone': icone,
    '--faixa-hover': `color-mix(in srgb, ${icone} 16%, ${fundo})`,
    '--faixa-ativo': ativo,
    '--faixa-ativo-icone': melhor(ativo, [BRANCO, PRETO]),
    '--faixa-aviso': melhor(fundo, [BRANCO, PRETO]),
  }
}

export const cssBarra = (fundo: string): string =>
  `.cs-faixa{${Object.entries(variaveisBarra(fundo)).map(([k, v]) => `${k}:${v}`).join(';')}}`
