import 'server-only'
import type { PagoPorDia } from '@/dominio/insights'
import { leadsDasAcoes } from '@/dominio/performance'
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
    fields: `id,name,campaign{name,objective},adset{name},${CRIATIVO},insights.time_range(${JSON.stringify({ since: periodo.de, until: periodo.ate })}){${METRICAS}}`,
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

/** Investimento e leads (formulários e conversas) da conta, mês a mês, entre `de` e `ate`. Cache de 30 min. */
export async function metaPorMes(contaId: string, de: string, ate: string): Promise<Map<string, { gasto: number; formularios: number; conversas: number; naMeta: number; site: number }> | { erro: string }> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return { erro: 'A integração com o Meta ainda não foi configurada (META_ACCESS_TOKEN).' }
  const q = new URLSearchParams({ level: 'account', time_increment: 'monthly', fields: 'spend,actions', time_range: JSON.stringify({ since: de, until: ate }), limit: '100', access_token: token })
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/act_${contaId}/insights?${q}`, { next: { revalidate: 1800 } })
    const corpo = (await r.json()) as { data?: { date_start: string; spend?: string; actions?: { action_type: string; value: string }[] }[]; error?: { code?: number; message?: string } }
    if (!r.ok || corpo.error) return { erro: mensagemDaMeta(corpo) }
    return new Map((corpo.data ?? []).map((d) => [d.date_start.slice(0, 7), { gasto: Number(d.spend ?? 0), ...leadsDasAcoes(d.actions) }]))
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível falar com o Meta agora. Tente de novo.' }
  }
}
