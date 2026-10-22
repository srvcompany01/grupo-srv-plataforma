/**
 * Galeria de anúncios do Meta: lê o que a API de Marketing devolve e diz se cada anúncio está indo bem.
 * "Bom/Médio/Fraco" compara o CTR com a média dos anúncios do próprio cliente e usa o diagnóstico da Meta
 * (qualidade, engajamento e conversão em relação aos concorrentes, que a Meta só dá com 500+ impressões).
 */

export type Ranking = 'acima' | 'media' | 'abaixo' | null
export type Desempenho = 'bom' | 'medio' | 'fraco' | 'poucos-dados'

export type Anuncio = {
  id: string
  nome: string
  titulo: string
  texto: string
  imagem: string | null
  video: boolean
  link: string | null
  impressoes: number
  alcance: number
  cliques: number
  cliquesLink: number
  ctr: number // %
  cpm: number
  cpc: number
  gasto: number
  frequencia: number
  visualizacoesVideo: number
  qualidade: Ranking
  engajamento: Ranking
  conversao: Ranking
}

export type AnuncioAvaliado = Anuncio & { desempenho: Desempenho; motivos: string[] }

export const PERIODOS_ANUNCIOS = { 7: 'last_7d', 30: 'last_30d' } as const
export const lerPeriodoAnuncios = (v: string | undefined): 7 | 30 => (v === '30' ? 30 : 7)

/** Aceita "act_123…", só os números ou um link do Gerenciador de Anúncios (act=123…). Vazio = tirar. */
export function lerContaAnuncios(bruto: string): { id: string | null } | { erro: string } {
  const texto = bruto.trim()
  if (!texto) return { id: null }
  const m = texto.match(/^(?:act_)?(\d{5,25})$/) ?? texto.match(/[?&]act=(\d{5,25})\b/)
  return m ? { id: m[1] } : { erro: 'Informe a conta de anúncios como act_123456789 (ou cole o link do Gerenciador de Anúncios, que tem act=...).' }
}

type Acao = { action_type: string; value: string }
export type AnuncioBruto = {
  id: string
  name?: string
  creative?: { title?: string; body?: string; thumbnail_url?: string; image_url?: string; video_id?: string; object_type?: string; effective_object_story_id?: string; instagram_permalink_url?: string }
  insights?: { data?: Record<string, string | Acao[] | undefined>[] }
}

const num = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? Number(v) || 0 : 0)
const RANKING: Record<string, Ranking> = { ABOVE_AVERAGE: 'acima', AVERAGE: 'media', BELOW_AVERAGE_10: 'abaixo', BELOW_AVERAGE_20: 'abaixo', BELOW_AVERAGE_35: 'abaixo' }

/** Converte o anúncio da API (com `insights` do período) no formato da tela. */
export function lerAnuncio(a: AnuncioBruto): Anuncio {
  const i = a.insights?.data?.[0] ?? {}
  const acoes = (Array.isArray(i.actions) ? i.actions : []) as Acao[]
  const acao = (tipo: string) => num(acoes.find((x) => x.action_type === tipo)?.value)
  const c = a.creative ?? {}
  const link = c.instagram_permalink_url ?? (c.effective_object_story_id ? `https://www.facebook.com/${c.effective_object_story_id}` : null)
  return {
    id: a.id,
    nome: a.name ?? '',
    titulo: c.title ?? '',
    texto: c.body ?? '',
    imagem: c.image_url ?? c.thumbnail_url ?? null,
    video: !!c.video_id || c.object_type === 'VIDEO',
    link,
    impressoes: num(i.impressions),
    alcance: num(i.reach),
    cliques: num(i.clicks),
    cliquesLink: acao('link_click'),
    ctr: num(i.ctr),
    cpm: num(i.cpm),
    cpc: num(i.cpc),
    gasto: num(i.spend),
    frequencia: num(i.frequency),
    visualizacoesVideo: acao('video_view'),
    qualidade: RANKING[String(i.quality_ranking)] ?? null,
    engajamento: RANKING[String(i.engagement_rate_ranking)] ?? null,
    conversao: RANKING[String(i.conversion_rate_ranking)] ?? null,
  }
}

/** Abaixo disso o CTR ainda oscila demais para julgar. */
export const MINIMO_IMPRESSOES = 500

/** Classifica cada anúncio e devolve do melhor para o pior (os sem dados por último). */
export function avaliarAnuncios(anuncios: Anuncio[]): AnuncioAvaliado[] {
  const comDados = anuncios.filter((a) => a.impressoes >= MINIMO_IMPRESSOES)
  const impressoes = comDados.reduce((s, a) => s + a.impressoes, 0)
  // CTR médio ponderado pelas impressões (o CTR "da conta" no período).
  const ctrMedio = impressoes ? comDados.reduce((s, a) => s + a.ctr * a.impressoes, 0) / impressoes : 0
  const ordem: Record<Desempenho, number> = { bom: 0, medio: 1, fraco: 2, 'poucos-dados': 3 }
  return anuncios
    .map((a): AnuncioAvaliado => {
      if (a.impressoes < MINIMO_IMPRESSOES) return { ...a, desempenho: 'poucos-dados', motivos: [`Menos de ${MINIMO_IMPRESSOES} impressões no período`] }
      const motivos: string[] = []
      let pontos = 0
      if (ctrMedio && comDados.length > 1) {
        if (a.ctr >= ctrMedio * 1.2) { pontos++; motivos.push('CTR acima da média dos anúncios do cliente') }
        else if (a.ctr <= ctrMedio * 0.7) { pontos--; motivos.push('CTR abaixo da média dos anúncios do cliente') }
      }
      const rankings = [a.qualidade, a.engajamento, a.conversao]
      if (rankings.includes('abaixo')) { pontos--; motivos.push('Meta indica desempenho abaixo dos concorrentes') }
      else if (rankings.includes('acima')) { pontos++; motivos.push('Meta indica desempenho acima dos concorrentes') }
      if (a.frequencia >= 3.5) { pontos--; motivos.push(`Frequência alta (${a.frequencia.toFixed(1)}): o público já viu muitas vezes`) }
      return { ...a, desempenho: pontos > 0 ? 'bom' : pontos < 0 ? 'fraco' : 'medio', motivos }
    })
    .sort((x, y) => ordem[x.desempenho] - ordem[y.desempenho] || y.impressoes - x.impressoes)
}

export function totaisAnuncios(anuncios: Anuncio[]) {
  const t = anuncios.reduce((s, a) => ({ impressoes: s.impressoes + a.impressoes, alcance: s.alcance + a.alcance, cliques: s.cliques + a.cliques, gasto: s.gasto + a.gasto, visualizacoesVideo: s.visualizacoesVideo + a.visualizacoesVideo }), { impressoes: 0, alcance: 0, cliques: 0, gasto: 0, visualizacoesVideo: 0 })
  return { ...t, ctr: t.impressoes ? (t.cliques / t.impressoes) * 100 : 0 }
}
