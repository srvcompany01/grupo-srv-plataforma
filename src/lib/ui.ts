import type { Status } from '@/dominio/tipos'

export const botao =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'
export const botaoPrimario = `${botao} bg-neutral-900 text-white hover:bg-neutral-700`
export const botaoSecundario = `${botao} border border-neutral-300 bg-white hover:bg-neutral-100`
export const campo =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900'

export const COR_STATUS: Record<Status, string> = {
  rascunho: 'bg-neutral-200 text-neutral-700',
  aguardando: 'bg-amber-100 text-amber-800',
  aprovado: 'bg-emerald-100 text-emerald-800',
  ajuste: 'bg-rose-100 text-rose-800',
}
