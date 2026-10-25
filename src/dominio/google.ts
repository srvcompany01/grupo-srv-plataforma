/**
 * Google Ads e Google Meu Negócio (Perfil da Empresa): converte o que as APIs devolvem para a tela.
 * Uma conta Google da agência acessa a MCC do Google Ads e os perfis do Meu Negócio dos clientes.
 */

/** Aceita "123-456-7890", "1234567890" ou um link do Google Ads com ocid/__c. Vazio = tirar. */
export function lerContaGoogleAds(bruto: string): { id: string | null } | { erro: string } {
  const texto = bruto.trim()
  if (!texto) return { id: null }
  const digitos = texto.replace(/[\s-]/g, '')
  if (/^\d{10}$/.test(digitos)) return { id: digitos }
  return { erro: 'Informe a conta do Google Ads com 10 dígitos (ex.: 123-456-7890).' }
}
export const formatarContaGoogleAds = (id: string) => `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`

export type Campanha = {
  id: string
  nome: string
  tipo: string
  impressoes: number
  cliques: number
  ctr: number // %
  cpc: number
  custo: number
  conversoes: number
  valorConversoes: number
}

export type CampanhaBruta = {
  campaign?: { id?: string; name?: string; advertisingChannelType?: string }
  metrics?: { impressions?: string; clicks?: string; costMicros?: string; conversions?: number; conversionsValue?: number }
}

const n = (v: unknown) => Number(v ?? 0) || 0

const TIPO_CAMPANHA: Record<string, string> = {
  SEARCH: 'Pesquisa', DISPLAY: 'Display', VIDEO: 'YouTube', PERFORMANCE_MAX: 'Performance Max', SHOPPING: 'Shopping',
  DEMAND_GEN: 'Demand Gen', LOCAL: 'Local', SMART: 'Inteligente', MULTI_CHANNEL: 'App', LOCAL_SERVICES: 'Serviços locais',
}

export function lerCampanha(c: CampanhaBruta): Campanha {
  const impressoes = n(c.metrics?.impressions)
  const cliques = n(c.metrics?.clicks)
  const custo = n(c.metrics?.costMicros) / 1_000_000
  return {
    id: c.campaign?.id ?? '',
    nome: c.campaign?.name ?? '(sem nome)',
    tipo: TIPO_CAMPANHA[c.campaign?.advertisingChannelType ?? ''] ?? c.campaign?.advertisingChannelType ?? '',
    impressoes,
    cliques,
    ctr: impressoes ? (cliques / impressoes) * 100 : 0,
    cpc: cliques ? custo / cliques : 0,
    custo,
    conversoes: n(c.metrics?.conversions),
    valorConversoes: n(c.metrics?.conversionsValue),
  }
}

export function totaisCampanhas(cs: Campanha[]) {
  const t = cs.reduce((s, c) => ({ impressoes: s.impressoes + c.impressoes, cliques: s.cliques + c.cliques, custo: s.custo + c.custo, conversoes: s.conversoes + c.conversoes, valorConversoes: s.valorConversoes + c.valorConversoes }), { impressoes: 0, cliques: 0, custo: 0, conversoes: 0, valorConversoes: 0 })
  return { ...t, ctr: t.impressoes ? (t.cliques / t.impressoes) * 100 : 0, custoPorConversao: t.conversoes ? t.custo / t.conversoes : 0 }
}

/** Consulta GAQL das campanhas ativas com os números do período (datas AAAA-MM-DD; outra coisa é recusada). */
export function consultaCampanhas(de: string, ate: string): string {
  if (![de, ate].every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))) throw new Error('Período inválido.')
  return `SELECT campaign.id, campaign.name, campaign.advertising_channel_type, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE campaign.status = 'ENABLED' AND segments.date BETWEEN '${de}' AND '${ate}' ORDER BY metrics.cost_micros DESC`
}

// ---------- Google Meu Negócio ----------

/** Métricas diárias do perfil (API Business Profile Performance). */
export const METRICAS_NEGOCIO = [
  'BUSINESS_IMPRESSIONS_MOBILE_SEARCH', 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH', 'BUSINESS_IMPRESSIONS_MOBILE_MAPS', 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
  'CALL_CLICKS', 'WEBSITE_CLICKS', 'BUSINESS_DIRECTION_REQUESTS', 'MESSAGING_CLICKS',
  'BUSINESS_BOOKINGS', 'BUSINESS_FOOD_ORDERS', 'BUSINESS_FOOD_MENU_CLICKS',
] as const

export type SerieBruta = { multiDailyMetricTimeSeries?: { dailyMetricTimeSeries?: { dailyMetric?: string; timeSeries?: { datedValues?: { date?: { year?: number; month?: number; day?: number }; value?: string }[] } }[] }[] }

export type MetricasNegocio = {
  buscas: number
  mapas: number
  visualizacoes: number
  ligacoes: number
  site: number
  rotas: number
  mensagens: number
  reservas: number
  pedidosComida: number
  cliquesCardapio: number
  avaliacoes?: AvaliacoesNegocio | null
  palavrasChave?: PalavraChaveNegocio[]
  /** Meses inteiros usados pela API de termos de busca (essa API não oferece recorte diário). */
  palavrasPeriodo?: { de: string; ate: string }
  avisos?: string[]
  /** Visualizações (busca + mapas) por dia, AAAA-MM-DD. */
  porDia: { dia: string; visualizacoes: number; acoes: number }[]
}

export function lerMetricasNegocio(r: SerieBruta): MetricasNegocio {
  const soma: Record<string, number> = {}
  const dias = new Map<string, { visualizacoes: number; acoes: number }>()
  for (const grupo of r.multiDailyMetricTimeSeries ?? []) {
    for (const serie of grupo.dailyMetricTimeSeries ?? []) {
      const metrica = serie.dailyMetric ?? ''
      for (const v of serie.timeSeries?.datedValues ?? []) {
        const valor = n(v.value)
        soma[metrica] = (soma[metrica] ?? 0) + valor
        const d = v.date
        if (!d?.year || !d.month || !d.day) continue
        const dia = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
        const atual = dias.get(dia) ?? { visualizacoes: 0, acoes: 0 }
        if (metrica.startsWith('BUSINESS_IMPRESSIONS')) atual.visualizacoes += valor
        else atual.acoes += valor
        dias.set(dia, atual)
      }
    }
  }
  const s = (k: string) => soma[k] ?? 0
  const buscas = s('BUSINESS_IMPRESSIONS_MOBILE_SEARCH') + s('BUSINESS_IMPRESSIONS_DESKTOP_SEARCH')
  const mapas = s('BUSINESS_IMPRESSIONS_MOBILE_MAPS') + s('BUSINESS_IMPRESSIONS_DESKTOP_MAPS')
  return {
    buscas,
    mapas,
    visualizacoes: buscas + mapas,
    ligacoes: s('CALL_CLICKS'),
    site: s('WEBSITE_CLICKS'),
    rotas: s('BUSINESS_DIRECTION_REQUESTS'),
    mensagens: s('MESSAGING_CLICKS'),
    reservas: s('BUSINESS_BOOKINGS'),
    pedidosComida: s('BUSINESS_FOOD_ORDERS'),
    cliquesCardapio: s('BUSINESS_FOOD_MENU_CLICKS'),
    porDia: [...dias].map(([dia, v]) => ({ dia, ...v })).sort((a, b) => a.dia.localeCompare(b.dia)),
  }
}

export type AvaliacaoBruta = { reviewId?: string; starRating?: string; createTime?: string; reviewReply?: { comment?: string; updateTime?: string } }
export type AvaliacoesNegocio = { novas: number; notaMedia: number | null; respondidas: number; semResposta: number; distribuicao: Record<1 | 2 | 3 | 4 | 5, number> }

const NOTA: Record<string, 1 | 2 | 3 | 4 | 5> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }

/** Avaliações criadas dentro do período no fuso de Belém (edições posteriores não viram avaliação nova). */
export function lerAvaliacoesNegocio(reviews: AvaliacaoBruta[], de: string, ate: string): AvaliacoesNegocio {
  const inicio = Date.parse(`${de}T00:00:00-03:00`)
  const fim = Date.parse(`${ate}T23:59:59.999-03:00`)
  const periodo = reviews.filter((r) => {
    const t = Date.parse(r.createTime ?? '')
    return Number.isFinite(t) && t >= inicio && t <= fim
  })
  const distribuicao: AvaliacoesNegocio['distribuicao'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let soma = 0
  let comNota = 0
  let respondidas = 0
  for (const r of periodo) {
    const nota = NOTA[r.starRating ?? '']
    if (nota) {
      distribuicao[nota]++
      soma += nota
      comNota++
    }
    if (r.reviewReply) respondidas++
  }
  return { novas: periodo.length, notaMedia: comNota ? Math.round((soma / comNota) * 10) / 10 : null, respondidas, semResposta: periodo.length - respondidas, distribuicao }
}

export type PalavraChaveBruta = { searchKeyword?: string; insightsValue?: { value?: string; threshold?: string } }
export type PalavraChaveNegocio = { termo: string; visualizacoes: number; abaixoDe: boolean }

export function lerPalavrasChaveNegocio(linhas: PalavraChaveBruta[], limite = 10): PalavraChaveNegocio[] {
  return linhas.map((l) => ({ termo: l.searchKeyword?.trim() ?? '', visualizacoes: n(l.insightsValue?.value ?? l.insightsValue?.threshold), abaixoDe: l.insightsValue?.value === undefined && l.insightsValue?.threshold !== undefined }))
    .filter((l) => l.termo && l.visualizacoes > 0)
    .sort((a, b) => b.visualizacoes - a.visualizacoes)
    .slice(0, limite)
}

/** Parâmetros de data da API de desempenho (o Google tem uns 3 dias de atraso nos números). */
export function intervaloNegocio(de: string, ate: string): [string, string][] {
  const partes = (d: string, p: string): [string, string][] => {
    const [ano, mes, dia] = d.split('-').map(Number)
    return [[`dailyRange.${p}_date.year`, String(ano)], [`dailyRange.${p}_date.month`, String(mes)], [`dailyRange.${p}_date.day`, String(dia)]]
  }
  return [...METRICAS_NEGOCIO.map((m): [string, string] => ['dailyMetrics', m]), ...partes(de, 'start'), ...partes(ate, 'end')]
}

/** Texto do post do Meu Negócio: até 1.500 caracteres. */
export const LIMITE_TEXTO_NEGOCIO = 1500

/** O que falta na conta para ler o resultado (sem isso o 0 parece desempenho ruim). */
export function avisosGoogle(t: { custo: number; conversoes: number; valorConversoes: number }): string[] {
  if (t.custo > 0 && t.conversoes === 0) return ['Nenhuma conversão registrada no período: confira se a conta tem ação de conversão configurada (WhatsApp, formulário, ligação). Sem ela, custo por conversão e ROAS ficam indisponíveis.']
  if (t.conversoes > 0 && t.valorConversoes === 0) return ['Conversões sem valor configurado: o ROAS do Google fica indisponível. Para ter ROAS, defina um valor na ação de conversão ou use o faturamento lançado em performance_cliente.']
  return []
}
