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

export const TEMA_PADRAO: Tema = { acao: '#202020', acento: '#7612fa', fundo: '#f8f9fa', superficie: '#ffffff' }
/** Tema anterior (neutro com índigo). */
const TEMA_NOVA: Tema = { acao: '#18181b', acento: '#5b5bd6', fundo: '#f6f7f9', superficie: '#ffffff' }
/** Tema antigo (Editorial). Quem nunca trocou o tema (Editorial ou o neutro anterior) migra sozinho para o padrão atual. */
const TEMA_EDITORIAL: Tema = { acao: '#073f3b', acento: '#70262d', fundo: '#f7f3ed', superficie: '#fffcf8' }

export const PREDEFINICOES: { nome: string; tema: Tema }[] = [
  { nome: 'ClickUp', tema: TEMA_PADRAO },
  { nome: 'Neutro índigo', tema: TEMA_NOVA },
  { nome: 'Editorial', tema: TEMA_EDITORIAL },
  { nome: 'SRV clássico', tema: { acao: '#111111', acento: '#d11a22', fundo: '#f8f9fa', superficie: '#ffffff' } },
  { nome: 'Grafite', tema: { acao: '#27272a', acento: '#a5503f', fundo: '#f5f5f4', superficie: '#ffffff' } },
  { nome: 'Floresta', tema: { acao: '#1f4d3a', acento: '#9a4a2a', fundo: '#f4f2ec', superficie: '#fffdf8' } },
  { nome: 'Oceano', tema: { acao: '#1d3f6e', acento: '#356aa5', fundo: '#f3f5f8', superficie: '#ffffff' } },
]

const TEXTO = '#202020'
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
 * texto escuro sobre fundo e superfície, e texto claro sobre a cor de ação e de acento.
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
  const igual = (o: Tema) => (Object.keys(o) as (keyof Tema)[]).every((k) => r.tema[k] === o[k])
  return igual(TEMA_EDITORIAL) || igual(TEMA_NOVA) ? TEMA_PADRAO : r.tema
}

/** Variáveis CSS do tema. Só recebe cores já validadas (#rrggbb), então não há como injetar CSS. */
export function variaveisTema(tema: Tema): Record<string, string> {
  return { '--tema-acao': tema.acao, '--tema-acento': tema.acento, '--tema-fundo': tema.fundo, '--tema-superficie': tema.superficie }
}

export function cssTema(tema: Tema): string {
  return `:root{${Object.entries(variaveisTema(tema)).map(([k, v]) => `${k}:${v}`).join(';')}}`
}
