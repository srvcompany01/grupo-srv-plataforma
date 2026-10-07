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

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** '2026-10-01' → 'out/26'. */
export function rotuloMes(iso: string): string {
  const [ano, mes] = iso.split('-')
  return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`
}

/** Duração em minutos inteiros: '45min', '1h 20min', '2h'. */
export function formatarDuracao(segundos: number): string {
  const min = Math.floor(segundos / 60)
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m}min`
  return m ? `${h}h ${m}min` : `${h}h`
}

/** Relógio do cronômetro: '1:02:03'. */
export function formatarRelogio(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${Math.floor(s / 3600)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`
}
