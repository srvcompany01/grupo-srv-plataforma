/**
 * Galeria de anúncios do Meta: lê o que a API de Marketing devolve e diz se cada anúncio está indo bem.
 * "Bom/Médio/Fraco": pelo custo por resultado (leads + conversas) contra o da conta inteira; se a conta não tem
 * resultados no período (tráfego, engajamento), pelo CTR no link com referência fixa. Somam o diagnóstico da Meta
 * (só com 500+ impressões) e a frequência.
 */
import { leadsDasAcoes } from './performance'

export type Ranking = 'acima' | 'media' | 'abaixo' | null
export type Desempenho = 'bom' | 'medio' | 'fraco' | 'poucos-dados'

export type Anuncio = {
  id: string
  nome: string
  campanha: string
  conjunto: string
  titulo: string
  texto: string
  imagem: string | null
  video: boolean
  link: string | null
  impressoes: number
  alcance: number
  cliques: number
  cliquesLink: number
  ctr: number // % (todos os cliques)
  /** Formulários + conversas (WhatsApp/Direct/Messenger) no período. */
  resultados: number
  custoPorResultado: number | null
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
  campaign?: { name?: string }
  adset?: { name?: string }
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
  const l = leadsDasAcoes(acoes)
  const resultados = l.formularios + l.conversas
  const link = c.instagram_permalink_url ?? (c.effective_object_story_id ? `https://www.facebook.com/${c.effective_object_story_id}` : null)
  return {
    id: a.id,
    nome: a.name ?? '',
    campanha: a.campaign?.name ?? '',
    conjunto: a.adset?.name ?? '',
    titulo: c.title ?? '',
    texto: c.body ?? '',
    imagem: c.image_url ?? c.thumbnail_url ?? null,
    video: !!c.video_id || c.object_type === 'VIDEO',
    link,
    impressoes: num(i.impressions),
    alcance: num(i.reach),
    cliques: num(i.clicks),
    // inline_link_clicks é o "Cliques no link" do Gerenciador (mesma janela de `clicks`); a ação link_click é o reserva.
    cliquesLink: i.inline_link_clicks !== undefined ? num(i.inline_link_clicks) : acao('link_click'),
    ctr: num(i.ctr),
    resultados,
    custoPorResultado: resultados ? num(i.spend) / resultados : null,
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

const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pctBr = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`

/** Classifica cada anúncio e devolve do melhor para o pior (os sem dados por último). */
export function avaliarAnuncios(anuncios: Anuncio[]): AnuncioAvaliado[] {
  const comDados = anuncios.filter((a) => a.impressoes >= MINIMO_IMPRESSOES)
  const resultados = comDados.reduce((s, a) => s + a.resultados, 0)
  const custoMedio = resultados ? comDados.reduce((s, a) => s + a.gasto, 0) / resultados : 0
  const ordem: Record<Desempenho, number> = { bom: 0, medio: 1, fraco: 2, 'poucos-dados': 3 }
  return anuncios
    .map((a): AnuncioAvaliado => {
      if (a.impressoes < MINIMO_IMPRESSOES) return { ...a, desempenho: 'poucos-dados', motivos: [`Menos de ${MINIMO_IMPRESSOES} impressões no período`] }
      const motivos: string[] = []
      let pontos = 0
      if (resultados) {
        if (a.custoPorResultado !== null) {
          const txt = `Custo por resultado ${reais(a.custoPorResultado)} (média da conta ${reais(custoMedio)})`
          if (a.custoPorResultado <= custoMedio * 0.8) { pontos++; motivos.push(txt) }
          else if (a.custoPorResultado >= custoMedio * 1.5) { pontos--; motivos.push(txt) }
          else motivos.push(txt)
        } else if (a.gasto >= custoMedio * 1.5) { pontos--; motivos.push(`Gastou ${reais(a.gasto)} sem nenhum resultado (a conta paga ${reais(custoMedio)} por resultado)`) }
        else motivos.push('Ainda sem resultados no período')
      } else {
        const ctrLink = (a.cliquesLink / a.impressoes) * 100
        if (ctrLink >= 1.5) { pontos++; motivos.push(`CTR no link de ${pctBr(ctrLink)} (bom a partir de 1,5%)`) }
        else if (ctrLink < 0.7) { pontos--; motivos.push(`CTR no link de ${pctBr(ctrLink)} (fraco abaixo de 0,7%)`) }
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
  const resultados = anuncios.reduce((x, a) => x + a.resultados, 0)
  return { ...t, ctr: t.impressoes ? (t.cliques / t.impressoes) * 100 : 0, resultados, custoPorResultado: resultados ? t.gasto / resultados : null }
}
