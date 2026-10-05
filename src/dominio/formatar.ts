import type { Formato, Status } from './tipos'

/** Recebe YYYY-MM-DD. Não usa Date para não deslocar o dia por fuso. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export const ROTULO_STATUS: Record<Status, string> = {
  rascunho: 'Rascunho',
  aguardando: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  ajuste: 'Ajuste solicitado',
}

export const ROTULO_FORMATO: Record<Formato, string> = {
  feed: 'Feed',
  reels: 'Reels',
  stories: 'Stories',
  tiktok: 'TikTok',
}

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Belem',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatarDataHora(d: Date): string {
  const p = Object.fromEntries(DATA_HORA.formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.day}/${p.month}/${p.year} às ${p.hour}:${p.minute}`
}
