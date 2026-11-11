import { somarDias } from './agenda'
import { diasDoPeriodo } from './periodo-anuncios'

/** Um dia de uma plataforma (Meta ou Google): o que a tela de Anúncios soma, compara e desenha. */
export type DiaPago = { dia: string; gasto: number; impressoes: number; cliques: number; conversoes: number; valor: number }
type Totais = Omit<DiaPago, 'dia'>

export const METRICAS = {
  investimento: { nome: 'Investimento', tipo: 'reais', melhorSobe: true, ajuda: 'Quanto foi gasto em anúncios no período.' },
  impressoes: { nome: 'Impressões', tipo: 'inteiro', melhorSobe: true, ajuda: 'Quantas vezes os anúncios apareceram.' },
  cliques: { nome: 'Cliques', tipo: 'inteiro', melhorSobe: true, ajuda: 'Cliques nos anúncios.' },
  ctr: { nome: 'CTR', tipo: 'pct', melhorSobe: true, ajuda: 'Cliques ÷ impressões.' },
  cpc: { nome: 'CPC médio', tipo: 'reais', melhorSobe: false, ajuda: 'Investimento ÷ cliques.' },
  conversoes: { nome: 'Conversões', tipo: 'inteiro', melhorSobe: true, ajuda: 'Meta: conversas, formulários, leads e compras do site. Google: conversões da conta.' },
  cpa: { nome: 'Custo por conversão', tipo: 'reais', melhorSobe: false, ajuda: 'Investimento ÷ conversões.' },
  roas: { nome: 'ROAS', tipo: 'vezes', melhorSobe: true, ajuda: 'Valor das conversões ÷ investimento. Só aparece quando a conta envia o valor das vendas.' },
} as const
export type Metrica = keyof typeof METRICAS

const VAZIO: Totais = { gasto: 0, impressoes: 0, cliques: 0, conversoes: 0, valor: 0 }
export const somar = (dias: Totais[]): Totais =>
  dias.reduce((s, d) => ({ gasto: s.gasto + d.gasto, impressoes: s.impressoes + d.impressoes, cliques: s.cliques + d.cliques, conversoes: s.conversoes + d.conversoes, valor: s.valor + d.valor }), VAZIO)

type Acao = { action_type: string; value: string }
/**
 * Conversões de um dia da conta Meta: conversas, formulários, leads do site e compras. Na conta inteira não há o destino
 * do conjunto para escolher um tipo só (como leadsDasAcoes faz por anúncio), então soma os quatro.
 */
export function conversoesMeta(acoes: Acao[] | undefined, valores: Acao[] | undefined): { conversoes: number; valor: number } {
  const v = (xs: Acao[] | undefined, t: string) => Number(xs?.find((a) => a.action_type === t)?.value ?? 0)
  const tipos = ['onsite_conversion.messaging_conversation_started_7d', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead', 'omni_purchase']
  return { conversoes: tipos.reduce((s, t) => s + v(acoes, t), 0), valor: v(valores, 'omni_purchase') }
}

/** Valor da métrica para um conjunto de dias somados; null quando não dá para calcular (divisão por zero). */
export function valorDe(m: Metrica, t: Totais): number | null {
  const div = (a: number, b: number) => (b ? a / b : null)
  switch (m) {
    case 'investimento': return t.gasto
    case 'impressoes': return t.impressoes
    case 'cliques': return t.cliques
    case 'conversoes': return t.conversoes
    case 'ctr': return div(t.cliques * 100, t.impressoes)
    case 'cpc': return div(t.gasto, t.cliques)
    case 'cpa': return div(t.gasto, t.conversoes)
    case 'roas': return div(t.valor, t.gasto)
  }
}

/** Variação em % contra o período anterior; null sem base de comparação. */
export const variacao = (atual: number | null, anterior: number | null) => (atual === null || !anterior ? null : ((atual - anterior) / anterior) * 100)

/** O período imediatamente antes, com o mesmo número de dias. */
export function periodoAnterior(p: { de: string; ate: string }) {
  const n = diasDoPeriodo(p).length
  return { de: somarDias(p.de, -n), ate: somarDias(p.de, -1) }
}

/** Os dias do período em ordem, com zero onde a plataforma não mandou linha. */
export function diasCompletos(p: { de: string; ate: string }, linhas: DiaPago[]): DiaPago[] {
  const por = new Map(linhas.map((l) => [l.dia, l]))
  return diasDoPeriodo(p).map((dia) => por.get(dia) ?? { dia, ...VAZIO })
}

/** Barras do gráfico: no máximo `maximo` barras, cada uma somando dias seguidos (rótulo = primeiro dia). */
export function barras(m: Metrica, dias: DiaPago[], maximo = 12): { dia: string; valor: number }[] {
  const tamanho = Math.max(1, Math.ceil(dias.length / maximo))
  const r: { dia: string; valor: number }[] = []
  for (let i = 0; i < dias.length; i += tamanho) r.push({ dia: dias[i].dia, valor: valorDe(m, somar(dias.slice(i, i + tamanho))) ?? 0 })
  return r
}
