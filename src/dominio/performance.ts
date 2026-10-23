import { somarDias } from './agenda'

/**
 * Performance dos clientes: leads (pagos e orgânicos), investimento e faturamento por mês.
 * Lead pago no Meta = formulários (cadastro) + conversas iniciadas no WhatsApp/Direct. No Google = conversões.
 */

type Acao = { action_type: string; value: string }

/** Formulários e conversas a partir das "actions" do Meta (sem contar o mesmo lead duas vezes). */
export function leadsDasAcoes(acoes: Acao[] | undefined): { formularios: number; conversas: number } {
  const v = (t: string) => Number(acoes?.find((a) => a.action_type === t)?.value ?? 0)
  // "lead" já soma os leads do site (pixel) e os do próprio Meta; sem ele, soma as partes.
  const formularios = v('lead') || v('onsite_conversion.lead_grouped') + v('offsite_conversion.fb_pixel_lead')
  const conversas = v('onsite_conversion.messaging_conversation_started_7d')
  return { formularios, conversas }
}

const MES = /^\d{4}-(0[1-9]|1[0-2])$/
export const mesDe = (dia: string) => dia.slice(0, 7)

/** ?mes=AAAA-MM (até o mês atual); inválido = mês atual. */
export function lerMes(v: unknown, hoje: string): string {
  return typeof v === 'string' && MES.test(v) && v <= mesDe(hoje) ? v : mesDe(hoje)
}

/** Primeiro e último dia do mês (o mês corrente vai até hoje). */
export function intervaloDoMes(mes: string, hoje: string): { de: string; ate: string } {
  const de = `${mes}-01`
  const [a, m] = mes.split('-').map(Number)
  const ultimo = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10)
  return { de, ate: ultimo > hoje ? hoje : ultimo }
}

/** Os `n` meses que terminam em `mes` (do mais antigo ao mais novo). */
export function mesesAte(mes: string, n: number): string[] {
  const [a, m] = mes.split('-').map(Number)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(a, m - 1 - (n - 1 - i), 1))
    return d.toISOString().slice(0, 7)
  })
}

export const mesAnterior = (mes: string) => mesesAte(mes, 2)[0]
export const rotuloMesCurto = (mes: string) => new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${mes}-01T12:00:00Z`)).replace('.', '')
export const rotuloMesLongo = (mes: string) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${mes}-01T12:00:00Z`))

export type NumerosMes = { investido: number; leadsPagos: number; leadsOrganicos: number; faturamento: number | null; vendas: number | null }

/** Indicadores do mês. null quando falta o dado para calcular. */
export function indicadores(n: NumerosMes) {
  const leads = n.leadsPagos + n.leadsOrganicos
  const div = (a: number | null, b: number | null) => (a === null || b === null || !b ? null : a / b)
  return {
    leads,
    cpl: div(n.investido, n.leadsPagos),
    roas: div(n.faturamento, n.investido),
    custoPorVenda: div(n.investido, n.vendas),
    ticketMedio: div(n.faturamento, n.vendas),
    conversao: n.vendas === null || !leads ? null : (n.vendas / leads) * 100,
  }
}

/** Dias de um intervalo (para somar séries diárias por mês). */
export function diasDe(de: string, ate: string): string[] {
  const r: string[] = []
  for (let d = de; d <= ate && r.length < 400; d = somarDias(d, 1)) r.push(d)
  return r
}
