import type { Formato, Status } from '@/dominio/tipos'

export const botao =
  'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 h-8 text-rotulo font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-petroleo-700/25 active:translate-y-px'
export const botaoPrimario = `${botao} bg-petroleo text-claro hover:bg-petroleo-700`
export const botaoSecundario = `${botao} bg-suave text-texto hover:bg-suave-hover`
export const botaoPerigo = `${botao} bg-perigo text-claro hover:bg-perigo-forte`
export const botaoFantasma = `${botao} text-texto-2 hover:bg-hover hover:text-texto`
export const campo =
  'w-full rounded-xl border border-transparent bg-suave px-3 py-2.5 text-sm text-texto outline-none transition placeholder:text-texto-3 hover:bg-suave-hover focus:border-marca focus:ring-3 focus:ring-marca/15'
export const rotulo = 'text-legenda font-medium text-texto-3'

export const COR_STATUS: Record<Status, string> = {
  rascunho: 'bg-st-rascunho',
  aguardando: 'bg-st-aguardando',
  aprovado: 'bg-st-aprovado',
  ajuste: 'bg-st-ajuste',
}

export const COR_FORMATO: Record<Formato, string> = {
  feed: 'bg-marca-fundo text-marca-escura',
  reels: 'bg-marca-fundo text-marca-escura',
  stories: 'bg-aviso-fundo text-aviso-forte',
  tiktok: 'bg-marca-fundo text-marca-escura',
}

const CORES_AVATAR = ['bg-marca', 'bg-marca', 'bg-marca', 'bg-aviso', 'bg-sucesso', 'bg-perigo', 'bg-marca']

export function corAvatar(nome: string): string {
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return CORES_AVATAR[h % CORES_AVATAR.length]
}
