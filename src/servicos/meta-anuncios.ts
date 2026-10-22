import 'server-only'
import { PERIODOS_ANUNCIOS, avaliarAnuncios, lerAnuncio, type AnuncioAvaliado, type AnuncioBruto } from '@/dominio/anuncios-meta'

/**
 * API de Marketing do Meta com o token de um usuário do sistema do Gerenciador de Negócios (META_ACCESS_TOKEN, com
 * ads_read nas contas dos clientes). O token fica só no servidor. As respostas ficam 30 minutos em cache.
 */
const VERSAO = process.env.META_API_VERSION || 'v23.0'
export const metaConfigurado = () => !!process.env.META_ACCESS_TOKEN

const CRIATIVO = 'creative.thumbnail_width(720).thumbnail_height(720){title,body,thumbnail_url,image_url,video_id,object_type,effective_object_story_id,instagram_permalink_url}'
const METRICAS = 'impressions,reach,clicks,ctr,cpm,cpc,spend,frequency,actions,quality_ranking,engagement_rate_ranking,conversion_rate_ranking'

function mensagemDaMeta(corpo: { error?: { code?: number; message?: string } }): string {
  const e = corpo.error
  if (e?.code === 190) return 'O token do Meta expirou ou foi revogado. Gere um novo no Gerenciador de Negócios.'
  if (e?.code === 10 || e?.code === 200 || e?.code === 100) return 'O token do Meta não tem acesso a esta conta de anúncios (confira se a conta foi atribuída ao usuário do sistema e o número act_).'
  if (e?.code === 4 || e?.code === 17 || e?.code === 613) return 'Limite de consultas do Meta atingido. Tente de novo em alguns minutos.'
  return `O Meta recusou a consulta${e?.message ? `: ${e.message}` : '.'}`
}

/** Anúncios ativos da conta com os resultados do período (7 ou 30 dias), já avaliados. */
export async function anunciosAtivos(contaId: string, dias: 7 | 30): Promise<{ anuncios: AnuncioAvaliado[] } | { erro: string }> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return { erro: 'A integração com o Meta ainda não foi configurada (META_ACCESS_TOKEN).' }
  const q = new URLSearchParams({
    fields: `id,name,${CRIATIVO},insights.date_preset(${PERIODOS_ANUNCIOS[dias]}){${METRICAS}}`,
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
