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
