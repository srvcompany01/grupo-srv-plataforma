import 'server-only'
import type { PagoPorDia } from '@/dominio/insights'
import { leadsDasAcoes, somarLeads, type Leads } from '@/dominio/performance'
import type { PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { avaliarAnuncios, lerAnuncio, type AnuncioAvaliado, type AnuncioBruto } from '@/dominio/anuncios-meta'

/**
 * API de Marketing do Meta com o token de um usuário do sistema do Gerenciador de Negócios (META_ACCESS_TOKEN, com
 * ads_read nas contas dos clientes). O token fica só no servidor. As respostas ficam 30 minutos em cache.
 */
const VERSAO = process.env.META_API_VERSION || 'v23.0'
export const metaConfigurado = () => !!process.env.META_ACCESS_TOKEN

const CRIATIVO = 'creative.thumbnail_width(720).thumbnail_height(720){title,body,thumbnail_url,image_url,video_id,object_type,effective_object_story_id,instagram_permalink_url}'
const METRICAS = 'impressions,reach,clicks,inline_link_clicks,ctr,cpm,cpc,spend,frequency,actions,quality_ranking,engagement_rate_ranking,conversion_rate_ranking'

function mensagemDaMeta(corpo: { error?: { code?: number; message?: string } }): string {
  const e = corpo.error
  if (e?.code === 190) return 'O token do Meta expirou ou foi revogado. Gere um novo no Gerenciador de Negócios.'
  if (e?.code === 10 || e?.code === 200 || e?.code === 100) return 'O token do Meta não tem acesso a esta conta de anúncios (confira se a conta foi atribuída ao usuário do sistema e o número act_).'
  if (e?.code === 4 || e?.code === 17 || e?.code === 613) return 'Limite de consultas do Meta atingido. Tente de novo em alguns minutos.'
  return `O Meta recusou a consulta${e?.message ? `: ${e.message}` : '.'}`
}

/** Anúncios ativos da conta com os resultados do período (datas de Belém, como a conta), já avaliados. */
export async function anunciosAtivos(contaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>): Promise<{ anuncios: AnuncioAvaliado[] } | { erro: string }> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return { erro: 'A integração com o Meta ainda não foi configurada (META_ACCESS_TOKEN).' }
  const q = new URLSearchParams({
    fields: `id,name,campaign{name,objective},adset{name,destination_type},${CRIATIVO},insights.time_range(${JSON.stringify({ since: periodo.de, until: periodo.ate })}){${METRICAS}}`,
    effective_status: '["ACTIVE"]',
    limit: '60',
    access_token: token,
  })
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/act_${contaId}/ads?${q}`, { next: { revalidate: 1800 } })
    const corpo = (await r.json()) as { data?: AnuncioBruto[]; error?: { code?: number; message?: string } }
    if (!r.ok || corpo.error) {
      console.error('Meta API', r.status, corpo.error)
      return { erro: mensagemDaMeta(corpo) }
    }
    return { anuncios: avaliarAnuncios((corpo.data ?? []).map(lerAnuncio)) }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível falar com o Meta agora. Tente de novo.' }
  }
}

/** Investimento, impressões, alcance e cliques da conta por dia (para cruzar com o orgânico). Cache de 30 min. */
export async function pagoPorDiaMeta(contaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>): Promise<PagoPorDia[] | { erro: string }> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return { erro: 'A integração com o Meta ainda não foi configurada (META_ACCESS_TOKEN).' }
  const q = new URLSearchParams({ level: 'account', time_increment: '1', fields: 'spend,impressions,reach,clicks', time_range: JSON.stringify({ since: periodo.de, until: periodo.ate }), limit: '1000', access_token: token })
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/act_${contaId}/insights?${q}`, { next: { revalidate: 1800 } })
    const corpo = (await r.json()) as { data?: { date_start: string; spend?: string; impressions?: string; reach?: string; clicks?: string }[]; error?: { code?: number; message?: string } }
    if (!r.ok || corpo.error) {
      console.error('Meta API', r.status, corpo.error)
      return { erro: mensagemDaMeta(corpo) }
    }
    return (corpo.data ?? []).map((d) => ({ dia: d.date_start, gasto: Number(d.spend ?? 0), impressoes: Number(d.impressions ?? 0), alcance: Number(d.reach ?? 0), cliques: Number(d.clicks ?? 0) }))
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível falar com o Meta agora. Tente de novo.' }
  }
}

/** Nome da conta de anúncios (para conferir no cadastro que a conta é mesmo do cliente). Cache de 1 hora. */
export async function nomeDaConta(contaId: string): Promise<string | null> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return null
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/act_${contaId}?${new URLSearchParams({ fields: 'name', access_token: token })}`, { next: { revalidate: 3600 } })
    const corpo = (await r.json()) as { name?: string }
    return corpo.name ?? null
  } catch {
    return null
  }
}

type Acoes = { action_type: string; value: string }[]
type ErroMeta = { error?: { code?: number; message?: string } }

/** GET na API de Marketing com o token do servidor (cache de 30 min); erro vira { erro } com mensagem clara. */
async function meta<T>(caminho: string, params: Record<string, string>): Promise<T | { erro: string }> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return { erro: 'A integração com o Meta ainda não foi configurada (META_ACCESS_TOKEN).' }
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/${caminho}?${new URLSearchParams({ ...params, access_token: token })}`, { next: { revalidate: 1800 } })
    const corpo = (await r.json()) as T & ErroMeta
    if (!r.ok || corpo.error) {
      console.error('Meta API', caminho, r.status, corpo.error)
      return { erro: mensagemDaMeta(corpo) }
    }
    return corpo
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível falar com o Meta agora. Tente de novo.' }
  }
}

const TODOS_STATUS = '["ACTIVE","PAUSED","DELETED","ARCHIVED","IN_PROCESS","WITH_ISSUES","CAMPAIGN_PAUSED"]'

export type LinhaConjunto = {
  mes: string | null
  campanhaId: string
  campanha: string
  conjuntoId: string
  conjunto: string
  destino: string | null
  gasto: number
  impressoes: number
  cliques: number
  cliquesLink: number
  leads: Leads
  acoes: Acoes
}

/**
 * Base única dos números da Meta: cada conjunto que gastou no período (inclusive pausados e arquivados), com o destino
 * dele e os leads contados por `leadsDasAcoes` (uma vez por pessoa). Totais da conta = soma dos conjuntos.
 * `mensal` quebra por mês. Cache de 30 min.
 */
export async function conjuntosDoPeriodo(contaId: string, de: string, ate: string, mensal = false): Promise<LinhaConjunto[] | { erro: string }> {
  const [ins, conjs] = await Promise.all([
    meta<{ data: { date_start: string; campaign_id: string; campaign_name: string; adset_id: string; adset_name: string; spend?: string; impressions?: string; clicks?: string; inline_link_clicks?: string; actions?: Acoes }[] }>(`act_${contaId}/insights`, {
      level: 'adset', fields: 'campaign_id,campaign_name,adset_id,adset_name,spend,impressions,clicks,inline_link_clicks,actions', time_range: JSON.stringify({ since: de, until: ate }), limit: '500', ...(mensal ? { time_increment: 'monthly' } : {}),
    }),
    meta<{ data: { id: string; destination_type?: string }[] }>(`act_${contaId}/adsets`, { fields: 'id,destination_type', effective_status: TODOS_STATUS, limit: '500' }),
  ])
  if ('erro' in ins) return ins
  // ponytail: até 500 conjuntos por consulta; paginar se alguma conta passar disso.
  const destino = new Map(('erro' in conjs ? [] : conjs.data).map((c) => [c.id, c.destination_type ?? null]))
  return ins.data.map((d) => ({
    mes: mensal ? d.date_start.slice(0, 7) : null,
    campanhaId: d.campaign_id,
    campanha: d.campaign_name,
    conjuntoId: d.adset_id,
    conjunto: d.adset_name,
    destino: destino.get(d.adset_id) ?? null,
    gasto: Number(d.spend ?? 0),
    impressoes: Number(d.impressions ?? 0),
    cliques: Number(d.clicks ?? 0),
    cliquesLink: Number(d.inline_link_clicks ?? 0),
    leads: leadsDasAcoes(d.actions, destino.get(d.adset_id)),
    acoes: d.actions ?? [],
  }))
}

/** Investimento e leads da conta, mês a mês, entre `de` e `ate` (soma dos conjuntos). */
export async function metaPorMes(contaId: string, de: string, ate: string): Promise<Map<string, { gasto: number } & Leads> | { erro: string }> {
  const linhas = await conjuntosDoPeriodo(contaId, de, ate, true)
  if ('erro' in linhas) return linhas
  const r = new Map<string, { gasto: number } & Leads>()
  for (const l of linhas) {
    const atual = r.get(l.mes!) ?? { gasto: 0, formularios: 0, conversas: 0, site: 0 }
    r.set(l.mes!, { gasto: atual.gasto + l.gasto, ...somarLeads([atual, l.leads]) })
  }
  return r
}

export type TotaisMeta = { gasto: number; cliques: number; cliquesLink: number; impressoes: number } & Leads

/** Totais da CONTA no período (todas as campanhas que gastaram, ativas ou não), com os leads sem duplicar. */
export async function totaisDoPeriodoMeta(contaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>): Promise<TotaisMeta | { erro: string }> {
  const linhas = await conjuntosDoPeriodo(contaId, periodo.de, periodo.ate)
  if ('erro' in linhas) return linhas
  return {
    gasto: linhas.reduce((s, l) => s + l.gasto, 0),
    cliques: linhas.reduce((s, l) => s + l.cliques, 0),
    cliquesLink: linhas.reduce((s, l) => s + l.cliquesLink, 0),
    impressoes: linhas.reduce((s, l) => s + l.impressoes, 0),
    ...somarLeads(linhas.map((l) => l.leads)),
  }
}

export type CampanhaPeriodo = { id: string; nome: string; status: string; objetivo: string; gasto: number; cliquesLink: number; impressoes: number; leads: Leads; destinos: string[] }

/**
 * Campanhas que gastaram no período (ativas ou não), da que mais gastou à que menos, e os nomes das campanhas ATIVAS
 * que não gastaram nada (sem entrega: em revisão, reprovadas, público ou pagamento).
 */
export async function campanhasDoPeriodoMeta(contaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>): Promise<{ campanhas: CampanhaPeriodo[]; ativasSemGasto: string[] } | { erro: string }> {
  const [linhas, camps] = await Promise.all([
    conjuntosDoPeriodo(contaId, periodo.de, periodo.ate),
    meta<{ data: { id: string; name: string; objective?: string; effective_status?: string }[] }>(`act_${contaId}/campaigns`, { fields: 'id,name,objective,effective_status', effective_status: '["ACTIVE","PAUSED","DELETED","ARCHIVED","IN_PROCESS","WITH_ISSUES"]', limit: '300' }),
  ])
  if ('erro' in linhas) return linhas
  const info = new Map(('erro' in camps ? [] : camps.data).map((c) => [c.id, c]))
  const por = new Map<string, CampanhaPeriodo>()
  for (const l of linhas) {
    const c = por.get(l.campanhaId) ?? { id: l.campanhaId, nome: l.campanha, status: info.get(l.campanhaId)?.effective_status ?? '', objetivo: info.get(l.campanhaId)?.objective ?? '', gasto: 0, cliquesLink: 0, impressoes: 0, leads: { formularios: 0, conversas: 0, site: 0 }, destinos: [] }
    c.gasto += l.gasto
    c.cliquesLink += l.cliquesLink
    c.impressoes += l.impressoes
    c.leads = somarLeads([c.leads, l.leads])
    if (l.destino && !c.destinos.includes(l.destino)) c.destinos.push(l.destino)
    por.set(l.campanhaId, c)
  }
  const campanhas = [...por.values()].filter((c) => c.gasto > 0).sort((a, b) => b.gasto - a.gasto)
  const ativasSemGasto = ('erro' in camps ? [] : camps.data).filter((c) => c.effective_status === 'ACTIVE' && !(por.get(c.id)?.gasto)).map((c) => c.name)
  return { campanhas, ativasSemGasto }
}

/**
 * Diagnóstico da contagem de leads: cada conjunto que gastou, com o destino, as ações brutas da Meta (action_type →
 * valor) e o que a plataforma contou a partir delas. Para conferir com o Gerenciador de Anúncios.
 */
export async function diagnosticoAcoesMeta(contaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>) {
  const linhas = await conjuntosDoPeriodo(contaId, periodo.de, periodo.ate)
  if ('erro' in linhas) return linhas
  const conjuntos = linhas.filter((l) => l.gasto > 0).sort((a, b) => b.gasto - a.gasto).map((l) => ({
    campanha: l.campanha, campanhaId: l.campanhaId, conjunto: l.conjunto, conjuntoId: l.conjuntoId, destino: l.destino,
    gasto: Math.round(l.gasto * 100) / 100, cliquesLink: l.cliquesLink, contado: l.leads,
    acoes: Object.fromEntries(l.acoes.filter((a) => /lead|messaging|link_click|contact/.test(a.action_type)).map((a) => [a.action_type, Number(a.value)])),
  }))
  const somaAcao = (t: string) => linhas.reduce((s, l) => s + Number(l.acoes.find((a) => a.action_type === t)?.value ?? 0), 0)
  return {
    regra: 'Conjunto de mensagem: só onsite_conversion.messaging_conversation_started_7d. Formulário (ON_AD): onsite_conversion.lead_grouped. Site (WEBSITE): offsite_conversion.fb_pixel_lead. A ação "lead" (soma das outras) nunca é usada.',
    totais: {
      contado: somarLeads(linhas.map((l) => l.leads)),
      acoesBrutas: { lead: somaAcao('lead'), lead_grouped: somaAcao('onsite_conversion.lead_grouped'), fb_pixel_lead: somaAcao('offsite_conversion.fb_pixel_lead'), messaging_conversation_started_7d: somaAcao('onsite_conversion.messaging_conversation_started_7d') },
    },
    conjuntos,
  }
}
