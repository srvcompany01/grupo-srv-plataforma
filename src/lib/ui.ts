import type { Formato, Status } from '@/dominio/tipos'

export const botao =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-4 h-9 text-corpo font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/20 active:translate-y-px'
export const botaoPrimario = `${botao} bg-texto text-white hover:bg-carbon`
export const botaoSecundario = `${botao} border border-borda bg-white text-texto hover:border-borda-forte hover:bg-hover`
export const botaoPerigo = `${botao} bg-perigo text-white hover:bg-perigo-forte`
export const botaoFantasma = `${botao} text-texto-2 hover:bg-hover hover:text-texto`
export const campo =
  'w-full rounded-[9px] border border-borda bg-white px-3 py-2.5 text-sm text-texto outline-none transition placeholder:text-texto-3 hover:border-borda-forte focus:border-marca focus:ring-3 focus:ring-marca/15'
export const rotulo = 'font-mono text-legenda font-medium uppercase tracking-[0.08em] text-texto-3'

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
