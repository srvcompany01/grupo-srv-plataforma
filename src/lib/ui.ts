import type { Formato, Status } from '@/dominio/tipos'

export const botao =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-4 h-9 text-[13px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/20 active:translate-y-px'
export const botaoPrimario = `${botao} bg-texto text-white hover:bg-carbon`
export const botaoSecundario = `${botao} border border-borda bg-white text-texto hover:border-borda-forte hover:bg-hover`
export const botaoFantasma = `${botao} text-texto-2 hover:bg-hover hover:text-texto`
export const campo =
  'w-full rounded-[9px] border border-borda bg-white px-3 py-2.5 text-sm text-texto outline-none transition placeholder:text-texto-3 hover:border-borda-forte focus:border-marca focus:ring-3 focus:ring-marca/15'
export const rotulo = 'font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-texto-3'

export const COR_STATUS: Record<Status, string> = {
  rascunho: 'bg-st-rascunho',
  aguardando: 'bg-st-aguardando',
  aprovado: 'bg-st-aprovado',
  ajuste: 'bg-st-ajuste',
}

export const COR_FORMATO: Record<Formato, string> = {
  feed: 'bg-sky-50 text-sky-700',
  reels: 'bg-pink-50 text-pink-700',
  stories: 'bg-amber-50 text-amber-700',
  tiktok: 'bg-teal-50 text-teal-700',
}

const CORES_AVATAR = ['bg-violet-500', 'bg-sky-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500']

export function corAvatar(nome: string): string {
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return CORES_AVATAR[h % CORES_AVATAR.length]
}
