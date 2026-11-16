/** Resumo semanal dos anúncios de um cliente (vai ao sino toda segunda): semana que passou × a anterior. */

export type NumerosSemana = { gasto: number; cliques: number; leads: number }

const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const variacao = (atual: number, antes: number) => (antes > 0 ? ((atual - antes) / antes) * 100 : null)
const seta = (v: number | null) => (v === null ? '' : ` (${v >= 0 ? '▲' : '▼'} ${pct(Math.abs(v))})`)

/** Queda de leads ou alta do custo por lead acima disso vira "Atenção". */
const LIMITE = 25

/** Texto do aviso, ou null se não houve investimento nas duas semanas. Começa com "Atenção" quando piorou além do limite. */
export function resumoSemanal(nome: string, atual: NumerosSemana, anterior: NumerosSemana): string | null {
  if (atual.gasto <= 0 && anterior.gasto <= 0) return null
  const cpl = (n: NumerosSemana) => (n.leads > 0 ? n.gasto / n.leads : null)
  const taxa = (n: NumerosSemana) => (n.cliques > 0 ? (n.leads / n.cliques) * 100 : null)
  const vLeads = variacao(atual.leads, anterior.leads)
  const [cplA, cplB] = [cpl(atual), cpl(anterior)]
  const vCpl = cplA !== null && cplB !== null ? variacao(cplA, cplB) : null
  const [tA, tB] = [taxa(atual), taxa(anterior)]
  const piorou = (vLeads !== null && vLeads <= -LIMITE) || (vCpl !== null && vCpl >= LIMITE) || (atual.leads === 0 && anterior.leads > 0)
  const partes = [
    `${atual.leads} lead${atual.leads === 1 ? '' : 's'}${seta(vLeads)}`,
    `investido ${reais(atual.gasto)}`,
    cplA !== null ? `custo por lead ${reais(cplA)}${cplB !== null ? ` (era ${reais(cplB)})` : ''}` : 'sem leads na semana',
    ...(tA !== null ? [`conversão de clique para lead ${pct(tA)}${tB !== null ? ` (era ${pct(tB)})` : ''}`] : []),
  ]
  return `${piorou ? 'Atenção · ' : ''}Resumo da semana · ${nome}: ${partes.join(', ')}.`.slice(0, 300)
}
