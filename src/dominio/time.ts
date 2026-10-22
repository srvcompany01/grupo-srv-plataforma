/** Aba Time: presença da equipe (site aberto/ativo), status escolhido pela pessoa e minutos ativos por dia. */

export const STATUS_TIME = ['disponivel', 'reuniao', 'intervalo', 'foco', 'gravando', 'externo', 'ausente'] as const
export type StatusTime = (typeof STATUS_TIME)[number]

export const ROTULO_STATUS_TIME: Record<StatusTime, string> = {
  disponivel: 'Disponível',
  reuniao: 'Em reunião',
  intervalo: 'Intervalo',
  foco: 'Foco (não perturbe)',
  gravando: 'Gravando / captação',
  externo: 'Atividade externa',
  ausente: 'Ausente',
}

export const EMOJI_STATUS_TIME: Record<StatusTime, string> = { disponivel: '🟢', reuniao: '📅', intervalo: '☕', foco: '🎧', gravando: '🎬', externo: '🚗', ausente: '🌙' }

/** O navegador avisa a cada minuto; "ativo" = mexeu na tela nos últimos 5 minutos. */
export const INTERVALO_PRESENCA_MS = 60_000
export const OCIOSO_APOS_MS = 5 * 60_000
/** Sem aviso há mais que isso = fechou o site. */
const OFFLINE_APOS_MS = 3 * 60_000

export type Situacao = 'ativo' | 'ocioso' | 'offline'

export function situacao(p: { vistoEm: string | null; ativoEm: string | null }, agora: Date): Situacao {
  if (!p.vistoEm || agora.getTime() - Date.parse(p.vistoEm) > OFFLINE_APOS_MS) return 'offline'
  if (p.ativoEm && agora.getTime() - Date.parse(p.ativoEm) <= OCIOSO_APOS_MS + INTERVALO_PRESENCA_MS) return 'ativo'
  return 'ocioso'
}

/** "3 min", "2 h 05 min", "4 dias". */
export function duracao(minutos: number): string {
  const m = Math.max(0, Math.round(minutos))
  if (m < 60) return `${m} min`
  if (m < 48 * 60) return `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, '0')} min` : ''}`
  return `${Math.floor(m / 1440)} dias`
}

export function minutosDesde(iso: string | null, agora: Date): number | null {
  return iso ? (agora.getTime() - Date.parse(iso)) / 60_000 : null
}
