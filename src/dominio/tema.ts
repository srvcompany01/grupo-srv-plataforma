import { normalizarHex } from './campos-gestao'

/**
 * Cores-base da interface. As variações (hover, fundo suave, borda) saem delas por color-mix no CSS,
 * então basta escolher quatro cores para repintar o app inteiro.
 */
export type Tema = {
  /** Botão principal, navegação global, foco. */
  acao: string
  /** Destaques, item ativo, links. */
  acento: string
  /** Fundo das páginas. */
  fundo: string
  /** Cartões, menus, campos. */
  superficie: string
}

export const ROTULO_COR_TEMA: Record<keyof Tema, { nome: string; dica: string }> = {
  acao: { nome: 'Ação principal', dica: 'Botões principais e navegação' },
  acento: { nome: 'Acento', dica: 'Item ativo, links e destaques' },
  fundo: { nome: 'Fundo', dica: 'Fundo das páginas' },
  superficie: { nome: 'Superfície', dica: 'Cartões, menus e campos' },
}

export const TEMA_PADRAO: Tema = { acao: '#111111', acento: '#3b5bdb', fundo: '#ffffff', superficie: '#ffffff' }

export const PREDEFINICOES: { nome: string; tema: Tema }[] = [
  { nome: 'ElevenLabs', tema: TEMA_PADRAO },
  { nome: 'Reddit', tema: { acao: '#d93900', acento: '#d93900', fundo: '#f6f9fb', superficie: '#ffffff' } },
  { nome: 'Floresta', tema: { acao: '#0f7a5c', acento: '#0f7a5c', fundo: '#f4f8f6', superficie: '#ffffff' } },
  { nome: 'Grafite', tema: { acao: '#27272a', acento: '#d93900', fundo: '#f5f5f4', superficie: '#ffffff' } },
]

const TEXTO = '#111111'
const TEXTO_CLARO = '#ffffff'

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste WCAG entre duas cores #rrggbb (1 a 21). */
export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/**
 * Normaliza as cores e confere a legibilidade mínima (WCAG AA 4,5:1) dos pares que a interface usa:
 * texto escuro sobre fundo e superfície, e texto branco sobre a cor de ação e de acento.
 */
export function validarTema(entrada: Record<string, unknown>): { tema: Tema } | { erros: string[] } {
  const tema = {} as Tema
  const erros: string[] = []
  for (const chave of Object.keys(TEMA_PADRAO) as (keyof Tema)[]) {
    const hex = typeof entrada[chave] === 'string' ? normalizarHex(entrada[chave] as string) : null
    if (!hex) erros.push(`${ROTULO_COR_TEMA[chave].nome}: cor inválida, use #RRGGBB.`)
    else tema[chave] = hex
  }
  if (erros.length) return { erros }
  const pares: [string, string, string][] = [
    [tema.fundo, TEXTO, 'O texto fica ilegível sobre o fundo. Escolha um fundo mais claro.'],
    [tema.superficie, TEXTO, 'O texto fica ilegível sobre a superfície. Escolha uma superfície mais clara.'],
    [tema.acao, TEXTO_CLARO, 'O texto dos botões fica ilegível sobre a cor de ação. Escolha uma cor mais escura.'],
    [tema.acento, TEXTO_CLARO, 'O texto claro fica ilegível sobre o acento. Escolha um acento mais escuro.'],
  ]
  for (const [cor, texto, mensagem] of pares) if (contraste(cor, texto) < 4.5) erros.push(mensagem)
  return erros.length ? { erros } : { tema }
}

/** Tema salvo (JSON do banco) ou o padrão, se faltar ou estiver inválido. */
export function lerTema(valor: unknown): Tema {
  if (!valor || typeof valor !== 'object') return TEMA_PADRAO
  const r = validarTema(valor as Record<string, unknown>)
  if (!('tema' in r)) return TEMA_PADRAO
  return r.tema
}

/** Variáveis CSS do tema. Só recebe cores já validadas (#rrggbb), então não há como injetar CSS. */
export function variaveisTema(tema: Tema): Record<string, string> {
  return { '--tema-acao': tema.acao, '--tema-acento': tema.acento, '--tema-fundo': tema.fundo, '--tema-superficie': tema.superficie }
}

export function cssTema(tema: Tema): string {
  return `body:has(.app-ui){${Object.entries(variaveisTema(tema)).map(([k, v]) => `${k}:${v}`).join(';')}}`
}
