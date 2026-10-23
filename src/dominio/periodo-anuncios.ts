import { somarDias } from './agenda'

/**
 * Período dos resultados de anúncios (Meta, Google Ads e Meu Negócio): os atalhos de 7 e 30 dias ou um intervalo
 * escolhido. Sempre vira um intervalo de datas (AAAA-MM-DD, fuso de Belém). Os atalhos terminam ontem, como o
 * "últimos 7 dias" das próprias plataformas (o dia de hoje ainda está incompleto).
 */
export type PeriodoAnuncios = { de: string; ate: string; atalho: 7 | 30 | null }

const DATA = /^\d{4}-\d{2}-\d{2}$/
/** O Meta guarda até 37 meses de resultados; 2 anos por consulta já sobra. */
export const MAX_DIAS_PERIODO = 730

const valida = (d: unknown): d is string => typeof d === 'string' && DATA.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`))

export function atalhoPeriodo(dias: 7 | 30, hoje: string): PeriodoAnuncios {
  const ate = somarDias(hoje, -1)
  return { de: somarDias(ate, -(dias - 1)), ate, atalho: dias }
}

/** Lê ?dias=7|30 ou ?de=…&ate=… da URL. Intervalo inválido (fora de ordem, no futuro, longo demais) volta a 7 dias. */
export function lerPeriodo(sp: { dias?: unknown; de?: unknown; ate?: unknown }, hoje: string): PeriodoAnuncios {
  if (valida(sp.de) && valida(sp.ate)) {
    const ate = sp.ate > hoje ? hoje : sp.ate
    const dias = (Date.parse(ate) - Date.parse(sp.de)) / 86_400_000 + 1
    if (sp.de <= ate && dias <= MAX_DIAS_PERIODO) return { de: sp.de, ate, atalho: null }
  }
  return atalhoPeriodo(sp.dias === '30' ? 30 : 7, hoje)
}

/** Parte da URL do período (sem "?"); vazio = padrão (7 dias). */
export function consultaPeriodo(p: PeriodoAnuncios): string {
  if (p.atalho === 7) return ''
  return p.atalho ? `dias=${p.atalho}` : `de=${p.de}&ate=${p.ate}`
}

const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
export function rotuloPeriodo(p: PeriodoAnuncios): string {
  if (p.atalho) return `últimos ${p.atalho} dias`
  if (p.de === p.ate) return `${dm(p.de)}/${p.de.slice(0, 4)}`
  return p.de.slice(0, 4) === p.ate.slice(0, 4) ? `${dm(p.de)} a ${dm(p.ate)}/${p.ate.slice(0, 4)}` : `${dm(p.de)}/${p.de.slice(0, 4)} a ${dm(p.ate)}/${p.ate.slice(0, 4)}`
}
