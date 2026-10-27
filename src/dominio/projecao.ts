import type { Analise, Item } from './insights'

/**
 * Projeção dos próximos 3 meses de um cliente, a partir da média dos últimos meses fechados (investimento, leads pagos e
 * orgânicos, vendas e faturamento). Compara manter o ritmo com cada alavanca (investir mais, mais leads orgânicos,
 * melhor conversão) e com todas juntas. É uma estimativa para decidir, não uma garantia.
 */

/** O quanto cada real a mais de anúncio rende em leads: 0,85 = rendimento decrescente (dobrar a verba não dobra os leads). */
export const ELASTICIDADE_INVESTIMENTO = 0.85
/** As melhorias entram aos poucos: 1/3 no primeiro mês, 2/3 no segundo e tudo no terceiro. */
export const RAMPA = [1 / 3, 2 / 3, 1] as const
export const AJUSTES_PADRAO = { investimento: 30, organico: 50, conversao: 20 } as const

export type MesDaBase = { investidoMeta: number; investidoMetaMarca?: number; investidoGoogle: number; leadsMeta: number; leadsGoogle: number; leadsOrganicos: number; faturamento: number | null; vendas: number | null }

export type BaseProjecao = {
  /** Meses usados (só os que têm faturamento e vendas lançados). */
  meses: number
  investimento: number
  leadsPagos: number
  leadsOrganicos: number
  vendas: number
  faturamento: number
  /** Totais dos meses usados: dão a confiança da conversão. */
  vendasNoPeriodo: number
  cpl: number | null
  conversao: number | null
  ticket: number | null
  cpa: number | null
  roas: number | null
  cplMeta: number | null
  cplGoogle: number | null
  investidoMeta: number
  investidoGoogle: number
  marcaNoMeta: number
}

const div = (a: number, b: number) => (b > 0 ? a / b : null)

/** Média mensal dos meses que têm faturamento e vendas lançados; null se nenhum tem. */
export function baseDaProjecao(meses: MesDaBase[]): BaseProjecao | null {
  const usados = meses.filter((m) => m.faturamento !== null && m.vendas !== null && (m.investidoMeta + m.investidoGoogle > 0 || m.leadsMeta + m.leadsGoogle + m.leadsOrganicos > 0))
  if (!usados.length) return null
  const media = (f: (m: MesDaBase) => number) => usados.reduce((s, m) => s + f(m), 0) / usados.length
  const investidoMeta = media((m) => m.investidoMeta)
  const investidoGoogle = media((m) => m.investidoGoogle)
  const investimento = investidoMeta + investidoGoogle
  const leadsMeta = media((m) => m.leadsMeta)
  const leadsGoogle = media((m) => m.leadsGoogle)
  const leadsPagos = leadsMeta + leadsGoogle
  const leadsOrganicos = media((m) => m.leadsOrganicos)
  const vendas = media((m) => m.vendas ?? 0)
  const faturamento = media((m) => m.faturamento ?? 0)
  const leads = leadsPagos + leadsOrganicos
  return {
    meses: usados.length, investimento, leadsPagos, leadsOrganicos, vendas, faturamento,
    vendasNoPeriodo: usados.reduce((s, m) => s + (m.vendas ?? 0), 0),
    cpl: div(investimento, leadsPagos), conversao: leads > 0 ? (vendas / leads) * 100 : null, ticket: div(faturamento, vendas), cpa: div(investimento, vendas), roas: div(faturamento, investimento),
    cplMeta: div(investidoMeta, leadsMeta), cplGoogle: div(investidoGoogle, leadsGoogle),
    investidoMeta, investidoGoogle, marcaNoMeta: media((m) => m.investidoMetaMarca ?? 0),
  }
}

export type Ajustes = { investimento: number; organico: number; conversao: number }
export type MesProjetado = { investimento: number; leads: number; vendas: number; faturamento: number }
export type Cenario = {
  id: 'manter' | 'investir' | 'organico' | 'conversao' | 'combinado'
  nome: string
  ajustes: Ajustes
  meses: MesProjetado[]
  total: MesProjetado & { roas: number | null; cpa: number | null }
}

/** Um mês projetado: `f` = quanto da melhoria já está valendo (0 a 1). */
function mesProjetado(b: BaseProjecao, a: Ajustes, f: number): MesProjetado {
  const inv = 1 + (a.investimento / 100) * f
  const investimento = b.investimento * inv
  const leadsPagos = b.leadsPagos * Math.pow(inv, ELASTICIDADE_INVESTIMENTO)
  const leadsOrganicos = b.leadsOrganicos * (1 + (a.organico / 100) * f)
  const leads = leadsPagos + leadsOrganicos
  const conversao = Math.min(100, (b.conversao ?? 0) * (1 + (a.conversao / 100) * f))
  const vendas = (leads * conversao) / 100
  return { investimento, leads, vendas, faturamento: vendas * (b.ticket ?? 0) }
}

export function projetar(b: BaseProjecao, ajustes: Ajustes = AJUSTES_PADRAO): Cenario[] {
  const def: [Cenario['id'], string, Ajustes][] = [
    ['manter', 'Manter o ritmo atual', { investimento: 0, organico: 0, conversao: 0 }],
    ['investir', `Investir ${ajustes.investimento}% a mais em anúncios`, { investimento: ajustes.investimento, organico: 0, conversao: 0 }],
    ['organico', `${ajustes.organico}% mais leads orgânicos`, { investimento: 0, organico: ajustes.organico, conversao: 0 }],
    ['conversao', `Conversão ${ajustes.conversao}% melhor`, { investimento: 0, organico: 0, conversao: ajustes.conversao }],
    ['combinado', 'Tudo junto', ajustes],
  ]
  return def.map(([id, nome, a]) => {
    const meses = RAMPA.map((f) => mesProjetado(b, a, id === 'manter' ? 0 : f))
    const soma = (k: keyof MesProjetado) => meses.reduce((s, m) => s + m[k], 0)
    const total = { investimento: soma('investimento'), leads: soma('leads'), vendas: soma('vendas'), faturamento: soma('faturamento') }
    return { id, nome, ajustes: a, meses, total: { ...total, roas: div(total.faturamento, total.investimento), cpa: div(total.investimento, total.vendas) } }
  })
}

/** Lê os ajustes digitados (texto da URL): números dentro de limites; inválido volta ao padrão. */
export function lerAjustes(v: { inv?: string; org?: string; conv?: string }): Ajustes {
  const n = (x: string | undefined, padrao: number, max: number) => {
    const t = Number(String(x ?? '').replace(',', '.'))
    return x !== undefined && x !== '' && Number.isFinite(t) && t >= 0 && t <= max ? Math.round(t) : padrao
  }
  return { investimento: n(v.inv, AJUSTES_PADRAO.investimento, 300), organico: n(v.org, AJUSTES_PADRAO.organico, 500), conversao: n(v.conv, AJUSTES_PADRAO.conversao, 100) }
}

const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const num = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** Leitura da projeção: confiança, o que mais rende, onde está o gargalo e o que fazer. */
export function analisarProjecao(b: BaseProjecao, cenarios: Cenario[]): Analise {
  const destaques: Item[] = []
  const recomendacoes: Item[] = []
  const manter = cenarios.find((c) => c.id === 'manter')!
  const alavancas = cenarios.filter((c) => ['investir', 'organico', 'conversao'].includes(c.id)).map((c) => ({ c, ganho: c.total.faturamento - manter.total.faturamento })).sort((x, y) => y.ganho - x.ganho)
  const combinado = cenarios.find((c) => c.id === 'combinado')!

  if (b.meses < 2) destaques.push({ tom: 'atencao', texto: `A projeção usa só ${b.meses} mês com faturamento e vendas lançados. Com 3 meses lançados ela fica mais confiável.` })
  if (b.vendasNoPeriodo < 10) destaques.push({ tom: 'atencao', texto: `A taxa de conversão vem de apenas ${num(b.vendasNoPeriodo)} vendas: pouca amostra, então ela pode variar bastante.` })
  destaques.push({ tom: 'neutro', texto: `Mantendo o ritmo (${reais(b.investimento)}/mês de anúncios, ${num(b.leadsPagos + b.leadsOrganicos)} leads/mês, ${b.conversao !== null ? `${num(b.conversao)}% de conversão` : 'conversão sem dado'}), a projeção é de ${reais(manter.total.faturamento)} em 3 meses.` })
  if (alavancas[0] && alavancas[0].ganho > 0) destaques.push({ tom: 'bom', texto: `A alavanca que mais rende é "${alavancas[0].c.nome.toLowerCase()}": ${reais(alavancas[0].ganho)} a mais em 3 meses.` })
  if (combinado.total.faturamento > manter.total.faturamento) destaques.push({ tom: 'bom', texto: `Com tudo junto o faturamento projetado vai a ${reais(combinado.total.faturamento)} (${reais(combinado.total.faturamento - manter.total.faturamento)} a mais).` })

  if (b.ticket !== null && b.cpa !== null && b.cpa > b.ticket * 0.5) recomendacoes.push({ tom: 'ruim', texto: `Conquistar um cliente custa ${reais(b.cpa)}, mais da metade do ticket médio (${reais(b.ticket)}). Antes de investir mais, melhore a conversão ou o custo por lead.` })
  if (b.roas !== null) {
    if (b.roas >= 4) recomendacoes.push({ tom: 'bom', texto: `O retorno está em ${num(b.roas)}x o investimento: há folga para aumentar a verba, o que rende ${alavancas.find((a) => a.c.id === 'investir') ? reais(alavancas.find((a) => a.c.id === 'investir')!.ganho) : '—'} a mais em 3 meses (com rendimento decrescente).` })
    else if (b.roas < 2) recomendacoes.push({ tom: 'ruim', texto: `O retorno está em ${num(b.roas)}x: antes de aumentar a verba, conserte a conversão ou o custo por lead, senão o prejuízo cresce junto.` })
  }
  if (b.conversao !== null) {
    const leads = b.leadsPagos + b.leadsOrganicos
    if (b.conversao < 8 && leads >= 20) recomendacoes.push({ tom: 'atencao', texto: `Só ${num(b.conversao)}% dos leads viram venda. Revise a velocidade e a qualidade do atendimento: melhorar a conversão é a alavanca mais barata, pois não custa mais verba.` })
  }
  const total = b.leadsPagos + b.leadsOrganicos
  if (total > 0 && b.leadsOrganicos / total < 0.15) recomendacoes.push({ tom: 'atencao', texto: `Só ${num((b.leadsOrganicos / total) * 100)}% dos leads são orgânicos. Divulgue o link da bio (stories, posts fixados e destaques) e use o quiz do Biolytics: lead orgânico não custa verba.` })
  if (b.cplMeta !== null && b.cplGoogle !== null) {
    const [melhor, pior, nomeM, nomeP] = b.cplMeta < b.cplGoogle ? [b.cplMeta, b.cplGoogle, 'Meta', 'Google'] : [b.cplGoogle, b.cplMeta, 'Google', 'Meta']
    if (melhor < pior * 0.7) recomendacoes.push({ tom: 'atencao', texto: `O lead da ${nomeM} custa ${reais(melhor)} contra ${reais(pior)} da ${nomeP}. Considere mover parte da verba da ${nomeP} para a ${nomeM}, e só mantenha a ${nomeP} se os leads dela vendem melhor.` })
  }
  if (b.investidoMeta > 0 && b.marcaNoMeta / b.investidoMeta > 0.3) recomendacoes.push({ tom: 'atencao', texto: `${num((b.marcaNoMeta / b.investidoMeta) * 100)}% da verba da Meta vai para campanhas de marca (seguidores e tráfego), que não geram lead direto. Se o objetivo é vender, reveja essa proporção.` })
  if (!recomendacoes.length) recomendacoes.push({ tom: 'neutro', texto: 'Os números estão equilibrados. Teste as alavancas uma de cada vez para saber qual realmente move o resultado.' })
  return { destaques, recomendacoes }
}
