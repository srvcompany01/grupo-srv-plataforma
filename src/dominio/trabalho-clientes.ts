/** Relatório do botão "já trabalhei neste cliente hoje": ranking de dias trabalhados por cliente num período. */

export type MarcaTrabalho = { clienteId: string; dia: string }
export type ClienteRelatorio = { id: string; nome: string; cor: string }
export type LinhaRanking = ClienteRelatorio & { dias: number; ultimo: string | null; saudavel: boolean }

export const PERIODOS = [7, 14, 30] as const

export function lerPeriodo(v: string | undefined): number {
  const n = Number(v)
  return (PERIODOS as readonly number[]).includes(n) ? n : 7
}

/** Os `n` dias (AAAA-MM-DD) que terminam em `hoje`, do mais antigo ao mais recente. */
export function diasDoPeriodo(hoje: string, n: number): string[] {
  const base = Date.parse(`${hoje}T00:00:00Z`)
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10))
}

/** Saudável = trabalhado pelo menos 2 dias a cada 7 do período (7 dias → 2, 14 → 4, 30 → 9). */
export const minimoSaudavel = (n: number) => Math.ceil((n * 2) / 7)

export function rankingDeTrabalho(clientes: ClienteRelatorio[], marcas: MarcaTrabalho[], dias: string[]) {
  const noPeriodo = new Set(dias)
  const porCliente = new Map<string, string[]>()
  const porDia = new Map(dias.map((d) => [d, 0]))
  for (const m of marcas) {
    if (!noPeriodo.has(m.dia)) continue
    porCliente.set(m.clienteId, [...(porCliente.get(m.clienteId) ?? []), m.dia])
    porDia.set(m.dia, porDia.get(m.dia)! + 1)
  }
  const minimo = minimoSaudavel(dias.length)
  const ranking: LinhaRanking[] = clientes
    .map((c) => {
      const ds = porCliente.get(c.id) ?? []
      return { ...c, dias: ds.length, ultimo: ds.length ? ds.reduce((a, b) => (a > b ? a : b)) : null, saudavel: ds.length >= minimo }
    })
    .sort((a, b) => b.dias - a.dias || (b.ultimo ?? '').localeCompare(a.ultimo ?? '') || a.nome.localeCompare(b.nome))
  return { ranking, minimo, porDia: dias.map((dia) => ({ dia, total: porDia.get(dia)! })) }
}
