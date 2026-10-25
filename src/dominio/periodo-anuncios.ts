import { somarDias } from './agenda'

/**
 * Período dos resultados de anúncios (Meta, Google Ads e Meu Negócio): hoje, os atalhos de 7 e 30 dias ou um
 * intervalo escolhido. Sempre vira um intervalo de datas (AAAA-MM-DD, fuso de Belém). Os atalhos de 7 e 30 dias
 * terminam ontem; "hoje" consulta separadamente o dia ainda em andamento.
 */
export type AtalhoPeriodo = 'hoje' | 7 | 30
export type PeriodoAnuncios = { de: string; ate: string; atalho: AtalhoPeriodo | null }

const DATA = /^\d{4}-\d{2}-\d{2}$/
/** O Meta guarda até 37 meses de resultados; 2 anos por consulta já sobra. */
export const MAX_DIAS_PERIODO = 730

const valida = (d: unknown): d is string => typeof d === 'string' && DATA.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`))

export function atalhoPeriodo(dias: AtalhoPeriodo, hoje: string): PeriodoAnuncios {
  if (dias === 'hoje') return { de: hoje, ate: hoje, atalho: 'hoje' }
  const ate = somarDias(hoje, -1)
  return { de: somarDias(ate, -(dias - 1)), ate, atalho: dias }
}

/** Lê ?dias=hoje|7|30 ou ?de=…&ate=… da URL. Intervalo inválido volta a 7 dias. */
export function lerPeriodo(sp: { dias?: unknown; de?: unknown; ate?: unknown }, hoje: string): PeriodoAnuncios {
  if (valida(sp.de) && valida(sp.ate)) {
    const ate = sp.ate > hoje ? hoje : sp.ate
    const dias = (Date.parse(ate) - Date.parse(sp.de)) / 86_400_000 + 1
    if (sp.de <= ate && dias <= MAX_DIAS_PERIODO) return { de: sp.de, ate, atalho: null }
  }
  return atalhoPeriodo(sp.dias === 'hoje' ? 'hoje' : sp.dias === '30' ? 30 : 7, hoje)
}

/** Parte da URL do período (sem "?"); vazio = padrão (7 dias). */
export function consultaPeriodo(p: PeriodoAnuncios): string {
  if (p.atalho === 7) return ''
  return p.atalho ? `dias=${p.atalho}` : `de=${p.de}&ate=${p.ate}`
}

const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
export function rotuloPeriodo(p: PeriodoAnuncios): string {
  if (p.atalho === 'hoje') return 'hoje'
  if (p.atalho) return `últimos ${p.atalho} dias`
  if (p.de === p.ate) return `${dm(p.de)}/${p.de.slice(0, 4)}`
  return p.de.slice(0, 4) === p.ate.slice(0, 4) ? `${dm(p.de)} a ${dm(p.ate)}/${p.ate.slice(0, 4)}` : `${dm(p.de)}/${p.de.slice(0, 4)} a ${dm(p.ate)}/${p.ate.slice(0, 4)}`
}

/** O atalho de hoje não usa cache de métricas: pede o dado mais recente disponível ao provedor. */
export function periodoEhHoje(p: Pick<PeriodoAnuncios, 'de' | 'ate'>, hoje: string): boolean {
  return p.de === hoje && p.ate === hoje
}

/** Todos os dias do período (AAAA-MM-DD), para os gráficos. */
export function diasDoPeriodo(p: Pick<PeriodoAnuncios, 'de' | 'ate'>): string[] {
  const dias: string[] = []
  for (let d = p.de; d <= p.ate && dias.length <= MAX_DIAS_PERIODO; d = somarDias(d, 1)) dias.push(d)
  return dias
}
