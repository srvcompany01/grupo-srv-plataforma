export const TIPOS_LANCAMENTO = ['entrada', 'saida'] as const
export type TipoLancamento = (typeof TIPOS_LANCAMENTO)[number]

export const CATEGORIAS: Record<TipoLancamento, string[]> = {
  entrada: ['Mensalidade', 'Projeto', 'Serviço avulso', 'Comissão', 'Outras entradas'],
  saida: ['Equipe', 'Tráfego pago', 'Ferramentas', 'Impostos', 'Freelancers', 'Escritório', 'Marketing', 'Outras despesas'],
}

export const ROTULO_TIPO: Record<TipoLancamento, string> = { entrada: 'Entrada', saida: 'Despesa' }

export type Lancamento = {
  id: string
  tipo: TipoLancamento
  categoria: string
  descricao: string
  centavos: number
  data: string
  pago: boolean
  clienteId: string | null
  clienteNome: string | null
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatarReais = (centavos: number): string => moeda.format(centavos / 100)

/** "1.234,56", "1234.5", "R$ 10" → centavos; null se não for um valor positivo válido. */
export function lerReais(texto: string): number | null {
  const limpo = texto.replace(/[R$\s]/g, '')
  if (!limpo) return null
  // Com vírgula, ela é o decimal e os pontos são milhar; sem vírgula, o ponto só é decimal se tiver 1 ou 2 casas depois dele.
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : /^\d+\.\d{1,2}$/.test(limpo) ? limpo : limpo.replace(/\./g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return null
  const centavos = Math.round(Number(normal) * 100)
  return centavos > 0 && centavos < 100_000_000_000 ? centavos : null
}

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/

/** Mês pedido na URL (AAAA-MM); qualquer outra coisa vira o mês de `hoje` (AAAA-MM-DD). */
export const lerMes = (valor: string | undefined, hoje: string): string => (valor && MES.test(valor) ? valor : hoje.slice(0, 7))

export function mesVizinho(mes: string, passo: number): string {
  const [a, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1 + passo, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function limitesDoMes(mes: string): { de: string; ate: string } {
  return { de: `${mes}-01`, ate: `${mesVizinho(mes, 1)}-01` } // ate é exclusivo
}

/** Datas mensais a partir de `inicio` (AAAA-MM-DD), mantendo o dia (31 vira o último dia dos meses curtos). */
export function repetirMensal(inicio: string, vezes: number): string[] {
  const [a, m, d] = inicio.split('-').map(Number)
  return Array.from({ length: Math.min(Math.max(vezes, 1), 36) }, (_, i) => {
    const alvo = new Date(Date.UTC(a, m - 1 + i, 1))
    const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate()
    return `${alvo.getUTCFullYear()}-${String(alvo.getUTCMonth() + 1).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`
  })
}

export type ResumoFinanceiro = {
  entradas: number
  despesas: number
  /** Entradas e despesas já pagas/recebidas. */
  saldo: number
  aReceber: number
  aPagar: number
  /** Resultado previsto: tudo o que está lançado no mês, pago ou não. */
  previsto: number
  /** `centavos` = previsto (pago + pendente); `pagos` e `pendentes` separam. */
  porCategoria: { tipo: TipoLancamento; categoria: string; centavos: number; pagos: number; pendentes: number }[]
}

export function resumir(lancamentos: Lancamento[]): ResumoFinanceiro {
  const r: ResumoFinanceiro = { entradas: 0, despesas: 0, saldo: 0, aReceber: 0, aPagar: 0, previsto: 0, porCategoria: [] }
  const categorias = new Map<string, { pagos: number; pendentes: number }>()
  for (const l of lancamentos) {
    const sinal = l.tipo === 'entrada' ? 1 : -1
    r.previsto += sinal * l.centavos
    if (l.pago) {
      r.saldo += sinal * l.centavos
      if (l.tipo === 'entrada') r.entradas += l.centavos
      else r.despesas += l.centavos
    } else if (l.tipo === 'entrada') r.aReceber += l.centavos
    else r.aPagar += l.centavos
    const chave = `${l.tipo}|${l.categoria}`
    const c = categorias.get(chave) ?? { pagos: 0, pendentes: 0 }
    if (l.pago) c.pagos += l.centavos
    else c.pendentes += l.centavos
    categorias.set(chave, c)
  }
  r.porCategoria = [...categorias].map(([chave, c]) => ({ tipo: chave.split('|')[0] as TipoLancamento, categoria: chave.slice(chave.indexOf('|') + 1), centavos: c.pagos + c.pendentes, ...c })).sort((a, b) => b.centavos - a.centavos)
  return r
}

/** Totais lançados (pagos ou não) de cada um dos `quantos` meses que terminam em `mesFinal`, do mais antigo ao mais novo. */
export function serieMensal(lancamentos: Lancamento[], mesFinal: string, quantos = 6): { mes: string; entradas: number; despesas: number }[] {
  const meses = Array.from({ length: quantos }, (_, i) => mesVizinho(mesFinal, i - quantos + 1))
  const serie = new Map(meses.map((mes) => [mes, { mes, entradas: 0, despesas: 0 }]))
  for (const l of lancamentos) {
    const m = serie.get(l.data.slice(0, 7))
    if (!m) continue
    if (l.tipo === 'entrada') m.entradas += l.centavos
    else m.despesas += l.centavos
  }
  return meses.map((mes) => serie.get(mes)!)
}

export const ABAS_FINANCEIRO = ['todos', 'entradas', 'despesas', 'pendentes'] as const
export type AbaFinanceiro = (typeof ABAS_FINANCEIRO)[number]
export const ROTULO_ABA_FINANCEIRO: Record<AbaFinanceiro, string> = { todos: 'Todos', entradas: 'Entradas', despesas: 'Despesas', pendentes: 'Pendentes' }
export const lerAbaFinanceiro = (v: string | undefined): AbaFinanceiro => ABAS_FINANCEIRO.find((a) => a === v) ?? 'todos'

export function filtrarLancamentos(lancamentos: Lancamento[], aba: AbaFinanceiro): Lancamento[] {
  if (aba === 'entradas') return lancamentos.filter((l) => l.tipo === 'entrada')
  if (aba === 'despesas') return lancamentos.filter((l) => l.tipo === 'saida')
  if (aba === 'pendentes') return lancamentos.filter((l) => !l.pago)
  return lancamentos
}
