import 'server-only'
import type { PagoPorDia } from '@/dominio/insights'
import { leadsDasAcoes, somarLeads, totalLeads, type Leads } from '@/dominio/performance'
import { dataDeHoje } from '@/dominio/filtros'
import { periodoEhHoje, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { avaliarAnuncios, gastoDeMarca, lerAnuncio, papelDoObjetivo, type AnuncioAvaliado, type AnuncioBruto } from '@/dominio/anuncios-meta'

/**
 * API de Marketing do Meta com o token de um usuário do sistema do Gerenciador de Negócios (META_ACCESS_TOKEN, com
 * ads_read nas contas dos clientes). O token fica só no servidor. As respostas históricas ficam 30 minutos em cache;
 * consultas de hoje sempre vão à API.
 */
const VERSAO = process.env.META_API_VERSION || 'v23.0'
export const metaConfigurado = () => !!process.env.META_ACCESS_TOKEN
const CACHE = 1800
const cacheDoPeriodo = (periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>) => periodoEhHoje(periodo, dataDeHoje(new Date())) ? 0 : CACHE
const opcoesCache = (segundos: number) => segundos ? { next: { revalidate: segundos } } : { cache: 'no-store' as const }

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
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/act_${contaId}/ads?${q}`, opcoesCache(cacheDoPeriodo(periodo)))
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
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/act_${contaId}/insights?${q}`, opcoesCache(cacheDoPeriodo(periodo)))
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

/** GET na API de Marketing com o token do servidor; erro vira { erro } com mensagem clara. */
async function meta<T>(caminho: string, params: Record<string, string>, cacheSeg = CACHE): Promise<T | { erro: string }> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return { erro: 'A integração com o Meta ainda não foi configurada (META_ACCESS_TOKEN).' }
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/${caminho}?${new URLSearchParams({ ...params, access_token: token })}`, opcoesCache(cacheSeg))
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

/** `results` do Insights: [{ indicator: 'profile_visit_view', values: [{ value: '7873' }] }]. */
export type ResultadoMeta = { indicator?: string; values?: { value?: string }[] }

/** Soma dos resultados que são visita ao perfil (indicador profile_visit_view). */
export const visitasPerfilDosResultados = (r: ResultadoMeta[] | undefined) => (r ?? []).reduce((s, x) => s + (/profile_visit/.test(x.indicator ?? '') ? (x.values ?? []).reduce((t, v) => t + Number(v.value ?? 0), 0) : 0), 0)

/** A Meta devolve número como texto ("7873") ou, em alguns campos, uma lista de { value }. */
export function numeroDaMeta(v: unknown): number {
  if (Array.isArray(v)) return v.reduce<number>((s, x) => s + numeroDaMeta((x as { value?: unknown })?.value), 0)
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

type DetalheConjunto = { id: string; destination_type?: string; campaign?: { effective_status?: string; objective?: string } }

/**
 * Destino do conjunto e status/objetivo da campanha, pelos ids (vale para pausados, arquivados e excluídos). A listagem
 * `act/adsets` ou `act/campaigns` filtrada por DELETED/ARCHIVED falhava calada na Meta e deixava tudo sem destino.
 * Lotes de 50; se um lote falhar, pede um a um.
 */
async function detalhesDosConjuntos(ids: string[], cacheSeg = CACHE): Promise<Map<string, DetalheConjunto>> {
  const r = new Map<string, DetalheConjunto>()
  const fields = 'destination_type,campaign{effective_status,objective}'
  for (let i = 0; i < ids.length; i += 50) {
    const lote = ids.slice(i, i + 50)
    const d = await meta<Record<string, DetalheConjunto>>('', { ids: lote.join(','), fields }, cacheSeg)
    const itens = 'erro' in d ? await Promise.all(lote.map((id) => meta<DetalheConjunto>(id, { fields }, cacheSeg))) : Object.values(d)
    for (const x of itens) if (!('erro' in x)) r.set(x.id, x)
  }
  return r
}

export type LinhaConjunto = {
  mes: string | null
  /** Preenchido somente quando a consulta usa granularidade diária. */
  dia: string | null
  campanhaId: string
  campanha: string
  conjuntoId: string
  conjunto: string
  destino: string | null
  /** effective_status atual da campanha ('' se a Meta não respondeu). */
  campanhaStatus: string
  objetivo: string
  gasto: number
  impressoes: number
  cliques: number
  cliquesLink: number
  leads: Leads
  acoes: Acoes
  /** Visitas ao perfil do Instagram (resultado de campanhas otimizadas para isso); 0 nas demais. */
  visitasPerfil: number
  /** Seguidores do Instagram atribuídos ao anúncio (instagram_profile_follow); 0 se a Meta não entregar. */
  seguidoresAnuncio: number
}

export type ResumoCaptacaoMeta = { gasto: number; impressoes: number; cliques: number; leads: number; conversas: number; formularios: number; site: number; custoPorLead: number | null; campanhas: number }
export type ResumoReconhecimentoMeta = { gasto: number; impressoes: number; cliques: number; cliquesLink: number; visitasPerfil: number; custoPorVisitaPerfil: number | null; seguidoresAnuncio: number; custoPorSeguidor: number | null; /** Seguidores ÷ visitas ao perfil (a "Conversão de Seguidores" do Gerenciador). */ taxaSeguidor: number | null; custoPorClique: number | null; campanhas: number }
export type ResumoMetaPorTipo = { captacao: ResumoCaptacaoMeta; reconhecimento: ResumoReconhecimentoMeta; total: TotaisMeta }

const vazioCaptacao = (): ResumoCaptacaoMeta => ({ gasto: 0, impressoes: 0, cliques: 0, leads: 0, conversas: 0, formularios: 0, site: 0, custoPorLead: null, campanhas: 0 })
const vazioReconhecimento = (): ResumoReconhecimentoMeta => ({ gasto: 0, impressoes: 0, cliques: 0, cliquesLink: 0, visitasPerfil: 0, custoPorVisitaPerfil: null, seguidoresAnuncio: 0, custoPorSeguidor: null, taxaSeguidor: null, custoPorClique: null, campanhas: 0 })

/**
 * Separa captação de reconhecimento antes de calcular médias. O papel é decidido pela campanha inteira, para um
 * objetivo desconhecido não mudar de grupo de um conjunto/dia para outro.
 */
export function resumirMetaPorTipo(linhas: LinhaConjunto[]): ResumoMetaPorTipo {
  const porCampanha = new Map<string, Leads>()
  for (const l of linhas) porCampanha.set(l.campanhaId, somarLeads([porCampanha.get(l.campanhaId) ?? { formularios: 0, conversas: 0, site: 0 }, l.leads]))
  const captacao = vazioCaptacao()
  const reconhecimento = vazioReconhecimento()
  let gastoComVisitas = 0
  let gastoComSeguidores = 0
  const campanhasCaptacao = new Set<string>()
  const campanhasReconhecimento = new Set<string>()
  for (const l of linhas) {
    const papel = papelDoObjetivo(l.objetivo, totalLeads(porCampanha.get(l.campanhaId) ?? { formularios: 0, conversas: 0, site: 0 }) > 0)
    if (papel === 'lead') {
      captacao.gasto += l.gasto
      captacao.impressoes += l.impressoes
      captacao.cliques += l.cliques
      captacao.conversas += l.leads.conversas
      captacao.formularios += l.leads.formularios
      captacao.site += l.leads.site
      campanhasCaptacao.add(l.campanhaId)
    } else {
      reconhecimento.gasto += l.gasto
      reconhecimento.impressoes += l.impressoes
      reconhecimento.cliques += l.cliques
      reconhecimento.cliquesLink += l.cliquesLink
      reconhecimento.visitasPerfil += l.visitasPerfil
      if (l.visitasPerfil > 0) gastoComVisitas += l.gasto
      reconhecimento.seguidoresAnuncio += l.seguidoresAnuncio
      if (l.seguidoresAnuncio > 0) gastoComSeguidores += l.gasto
      campanhasReconhecimento.add(l.campanhaId)
    }
  }
  captacao.leads = captacao.conversas + captacao.formularios + captacao.site
  captacao.campanhas = campanhasCaptacao.size
  captacao.custoPorLead = captacao.leads ? captacao.gasto / captacao.leads : null
  reconhecimento.campanhas = campanhasReconhecimento.size
  // Quando a Meta não devolve "visita ao perfil", o clique no link é o indicador disponível para a campanha de tráfego.
  reconhecimento.custoPorVisitaPerfil = reconhecimento.visitasPerfil ? gastoComVisitas / reconhecimento.visitasPerfil : null
  reconhecimento.custoPorSeguidor = reconhecimento.seguidoresAnuncio ? gastoComSeguidores / reconhecimento.seguidoresAnuncio : null
  reconhecimento.taxaSeguidor = reconhecimento.visitasPerfil && reconhecimento.seguidoresAnuncio ? (reconhecimento.seguidoresAnuncio / reconhecimento.visitasPerfil) * 100 : null
  reconhecimento.custoPorClique = reconhecimento.cliquesLink ? reconhecimento.gasto / reconhecimento.cliquesLink : null
  return {
    captacao,
    reconhecimento,
    total: {
      gasto: captacao.gasto + reconhecimento.gasto,
      impressoes: captacao.impressoes + reconhecimento.impressoes,
      cliques: captacao.cliques + reconhecimento.cliques,
      cliquesLink: linhas.reduce((s, l) => s + l.cliquesLink, 0),
      formularios: captacao.formularios,
      conversas: captacao.conversas,
      site: captacao.site,
    },
  }
}

/**
 * Base única dos números da Meta: cada conjunto que gastou no período (inclusive pausados e arquivados), com o destino
 * dele e os leads contados por `leadsDasAcoes` (uma vez por pessoa). Totais da conta = soma dos conjuntos.
 * `mensal` quebra por mês. Cache de 30 min para períodos históricos e sem cache para hoje.
 */
export async function conjuntosDoPeriodo(contaId: string, de: string, ate: string, granularidade: 'total' | 'mensal' | 'diaria' = 'total'): Promise<LinhaConjunto[] | { erro: string }> {
  const cacheSeg = cacheDoPeriodo({ de, ate })
  const periodo = { level: 'adset', time_range: JSON.stringify({ since: de, until: ate }), limit: '500', ...(granularidade === 'mensal' ? { time_increment: 'monthly' } : granularidade === 'diaria' ? { time_increment: '1' } : {}) }
  const [ins, resultados, seguidores] = await Promise.all([
    meta<{ data: { date_start: string; campaign_id: string; campaign_name: string; adset_id: string; adset_name: string; spend?: string; impressions?: string; clicks?: string; inline_link_clicks?: string; actions?: Acoes }[] }>(`act_${contaId}/insights`, {
      ...periodo, fields: 'campaign_id,campaign_name,adset_id,adset_name,spend,impressions,clicks,inline_link_clicks,actions',
    }, cacheSeg),
    // O "resultado" que o Gerenciador mostra (ex.: visitas ao perfil) só vem no campo `results`, não em `actions`. Se falhar, só ficamos sem ele.
    meta<{ data: { date_start: string; adset_id: string; results?: ResultadoMeta[] }[] }>(`act_${contaId}/insights`, { ...periodo, fields: 'adset_id,results' }, cacheSeg),
    // Seguidores do Instagram atribuídos ao anúncio (a coluna "Seguidores no Instagram" do Gerenciador). Se a Meta não entregar, fica 0.
    meta<{ data: { date_start: string; adset_id: string; instagram_profile_follow?: unknown }[] }>(`act_${contaId}/insights`, { ...periodo, fields: 'adset_id,instagram_profile_follow' }, cacheSeg),
  ])
  if ('erro' in ins) return ins
  // ponytail: até 500 linhas de insights por consulta; paginar se alguma conta passar disso.
  const det = await detalhesDosConjuntos([...new Set(ins.data.map((d) => d.adset_id))], cacheSeg)
  const destino = new Map([...det].map(([id, c]) => [id, c.destination_type ?? null]))
  const visitas = new Map(('erro' in resultados ? [] : resultados.data).map((r) => [`${r.adset_id}|${r.date_start}`, visitasPerfilDosResultados(r.results)]))
  const ganhos = new Map(('erro' in seguidores ? [] : seguidores.data).map((r) => [`${r.adset_id}|${r.date_start}`, numeroDaMeta(r.instagram_profile_follow)]))
  return ins.data.map((d) => ({
    mes: granularidade === 'mensal' ? d.date_start.slice(0, 7) : null,
    dia: granularidade === 'diaria' ? d.date_start : null,
    campanhaId: d.campaign_id,
    campanha: d.campaign_name,
    conjuntoId: d.adset_id,
    conjunto: d.adset_name,
    destino: destino.get(d.adset_id) ?? null,
    campanhaStatus: det.get(d.adset_id)?.campaign?.effective_status ?? '',
    objetivo: det.get(d.adset_id)?.campaign?.objective ?? '',
    gasto: Number(d.spend ?? 0),
    impressoes: Number(d.impressions ?? 0),
    cliques: Number(d.clicks ?? 0),
    cliquesLink: Number(d.inline_link_clicks ?? 0),
    leads: leadsDasAcoes(d.actions, destino.get(d.adset_id)),
    acoes: d.actions ?? [],
    visitasPerfil: visitas.get(`${d.adset_id}|${d.date_start}`) ?? 0,
    seguidoresAnuncio: ganhos.get(`${d.adset_id}|${d.date_start}`) ?? 0,
  }))
}

/** Investimento e leads da conta, mês a mês, entre `de` e `ate` (soma dos conjuntos). */
export async function metaPorMes(contaId: string, de: string, ate: string): Promise<Map<string, { gasto: number; gastoMarca: number } & Leads> | { erro: string }> {
  const linhas = await conjuntosDoPeriodo(contaId, de, ate, 'mensal')
  if ('erro' in linhas) return linhas
  const r = new Map<string, { gasto: number; gastoMarca: number } & Leads>()
  for (const l of linhas) {
    const atual = r.get(l.mes!) ?? { gasto: 0, gastoMarca: 0, formularios: 0, conversas: 0, site: 0 }
    r.set(l.mes!, { gasto: atual.gasto + l.gasto, gastoMarca: atual.gastoMarca + gastoDeMarca([l]), ...somarLeads([atual, l.leads]) })
  }
  return r
}

export type TotaisMeta = { gasto: number; cliques: number; cliquesLink: number; impressoes: number } & Leads

/** Totais separados por finalidade da campanha, para nunca misturar reconhecimento no CPL de captação. */
export async function resumoMetaPorTipo(contaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>): Promise<ResumoMetaPorTipo | { erro: string }> {
  const linhas = await conjuntosDoPeriodo(contaId, periodo.de, periodo.ate)
  return 'erro' in linhas ? linhas : resumirMetaPorTipo(linhas)
}

/** Série diária de investimento e resultado, uma linha para captação e outra para reconhecimento. */
export async function metaPorDiaPorTipo(contaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>): Promise<Map<string, ResumoMetaPorTipo> | { erro: string }> {
  const linhas = await conjuntosDoPeriodo(contaId, periodo.de, periodo.ate, 'diaria')
  if ('erro' in linhas) return linhas
  const porDia = new Map<string, LinhaConjunto[]>()
  for (const l of linhas) if (l.dia) porDia.set(l.dia, [...(porDia.get(l.dia) ?? []), l])
  return new Map([...porDia].map(([dia, itens]) => [dia, resumirMetaPorTipo(itens)]))
}

/** Totais da CONTA no período (todas as campanhas que gastaram, ativas ou não), com os leads sem duplicar. */
export async function totaisDoPeriodoMeta(contaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>): Promise<TotaisMeta | { erro: string }> {
  const resumo = await resumoMetaPorTipo(contaId, periodo)
  return 'erro' in resumo ? resumo : resumo.total
}

export type CampanhaPeriodo = { id: string; nome: string; status: string; objetivo: string; gasto: number; cliquesLink: number; impressoes: number; leads: Leads; destinos: string[] }

/**
 * Campanhas que gastaram no período (ativas ou não), da que mais gastou à que menos, e os nomes das campanhas ATIVAS
 * que não gastaram nada (sem entrega: em revisão, reprovadas, público ou pagamento).
 */
export async function campanhasDoPeriodoMeta(contaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>): Promise<{ campanhas: CampanhaPeriodo[]; ativasSemGasto: string[] } | { erro: string }> {
  const [linhas, camps] = await Promise.all([
    conjuntosDoPeriodo(contaId, periodo.de, periodo.ate),
    // Mesmo filtro de `estruturaMeta` (o que funciona na Meta); aqui só as ativas, para achar as que não entregaram.
    meta<{ data: { id: string; name: string }[] }>(`act_${contaId}/campaigns`, { fields: 'id,name', effective_status: '["ACTIVE"]', limit: '300' }, cacheDoPeriodo(periodo)),
  ])
  if ('erro' in linhas) return linhas
  const por = new Map<string, CampanhaPeriodo>()
  for (const l of linhas) {
    const c = por.get(l.campanhaId) ?? { id: l.campanhaId, nome: l.campanha, status: l.campanhaStatus, objetivo: l.objetivo, gasto: 0, cliquesLink: 0, impressoes: 0, leads: { formularios: 0, conversas: 0, site: 0 }, destinos: [] }
    c.gasto += l.gasto
    c.cliquesLink += l.cliquesLink
    c.impressoes += l.impressoes
    c.leads = somarLeads([c.leads, l.leads])
    if (l.destino && !c.destinos.includes(l.destino)) c.destinos.push(l.destino)
    por.set(l.campanhaId, c)
  }
  const campanhas = [...por.values()].filter((c) => c.gasto > 0).sort((a, b) => b.gasto - a.gasto)
  const ativasSemGasto = ('erro' in camps ? [] : camps.data).filter((c) => !(por.get(c.id)?.gasto)).map((c) => c.name)
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
    todasAsAcoes: Object.fromEntries(l.acoes.map((a) => [a.action_type, Number(a.value)])),
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

/**
 * Sonda (diagnóstico, só admin): pede à Meta, um a um, os campos que poderiam trazer visitas ao perfil e seguidores
 * de uma campanha, e o que o conjunto otimiza. Campo que a Meta recusa volta com o erro; o que existe volta com o valor.
 */
export async function sondaCampanhaMeta(contaId: string, campanhaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>, extras: string[] = []) {
  const base = { level: 'adset', time_range: JSON.stringify({ since: periodo.de, until: periodo.ate }), filtering: JSON.stringify([{ field: 'campaign.id', operator: 'EQUAL', value: campanhaId }]), limit: '50' }
  const candidatos = ['results', 'cost_per_result', 'conversions', 'cost_per_conversion', 'unique_actions', 'cost_per_action_type', 'cost_per_unique_action_type', 'cost_per_inline_link_click', 'reach', 'frequency', 'optimization_goal', 'objective', 'instagram_profile_follow', 'instagram_profile_visits', ...extras]
  // Seguidores ganhos pelo anúncio: o mesmo `actions` com a atribuição do Gerenciador, outras janelas e quebras por destino/alvo.
  const variantes: Record<string, Record<string, string>> = {
    atribuicaoUnificada: { fields: 'adset_id,actions', use_unified_attribution_setting: 'true' },
    janelas: { fields: 'adset_id,actions', action_attribution_windows: '["1d_click","7d_click","1d_view","28d_click"]' },
    porDestino: { fields: 'adset_id,actions', action_breakdowns: 'action_type,action_destination' },
    porAlvo: { fields: 'adset_id,actions', action_breakdowns: 'action_type,action_target_id' },
    comPlataforma: { fields: 'adset_id,actions', breakdowns: 'publisher_platform' },
  }
  const porVariante = Object.fromEntries(await Promise.all(Object.entries(variantes).map(async ([nome, extra]) => {
    const r = await meta<{ data: Record<string, unknown>[] }>(`act_${contaId}/insights`, { ...base, ...extra }, 0)
    return [nome, 'erro' in r ? { erro: r.erro } : r.data.map((d) => ({ adset: d.adset_id, plataforma: d.publisher_platform, acoes: Object.fromEntries(((d.actions ?? []) as { action_type: string; value: string; action_destination?: string; action_target_id?: string }[]).map((x) => [`${x.action_type}${x.action_destination ? `@${x.action_destination}` : ''}${x.action_target_id ? `#${x.action_target_id}` : ''}`, x.value])) }))] as const
  })))
  const campos = Object.fromEntries(await Promise.all(candidatos.map(async (f) => {
    const r = await meta<{ data: Record<string, unknown>[] }>(`act_${contaId}/insights`, { ...base, fields: `adset_id,spend,${f}` })
    return [f, 'erro' in r ? { erro: r.erro } : r.data.map((d) => ({ adset: d.adset_id, spend: d.spend, [f]: d[f] }))] as const
  })))
  const [campanha, conjuntos] = await Promise.all([
    meta<Record<string, unknown>>(campanhaId, { fields: 'name,objective,buying_type,effective_status' }),
    meta<{ data: Record<string, unknown>[] }>(`${campanhaId}/adsets`, { fields: 'id,name,optimization_goal,destination_type,promoted_object,billing_event,effective_status', limit: '50' }),
  ])
  return { campanha, conjuntos: 'erro' in conjuntos ? conjuntos : conjuntos.data, campos, porVariante }
}
