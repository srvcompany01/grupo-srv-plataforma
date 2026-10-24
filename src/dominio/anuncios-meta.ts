/**
 * Galeria de anúncios do Meta: lê o que a API de Marketing devolve e diz se cada anúncio está indo bem.
 * "Bom/Médio/Fraco" pela métrica do OBJETIVO da campanha, comparando só com anúncios do mesmo papel:
 *  - lead (conversa no WhatsApp/Direct, formulário, vendas): custo por resultado;
 *  - marca (tráfego e conteúdo para o Instagram, reconhecimento, engajamento sem conversa): custo por clique no link e
 *    CTR no link. Na estratégia da agência essas campanhas levam pessoas ao perfil (seguidores) que viram lead depois:
 *    não são reprovadas por não gerar lead.
 * Somam o diagnóstico da Meta (só com 500+ impressões) e a frequência.
 */
import { leadsDasAcoes } from './performance'

export type Ranking = 'acima' | 'media' | 'abaixo' | null
export type Desempenho = 'bom' | 'medio' | 'fraco' | 'poucos-dados'

export type Anuncio = {
  id: string
  nome: string
  campanha: string
  conjunto: string
  /** Objetivo da campanha na Meta (OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT…). */
  objetivo: string
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

export type Papel = 'lead' | 'marca'
export type AnuncioAvaliado = Anuncio & { desempenho: Desempenho; motivos: string[]; papel: Papel }

/**
 * Papel do anúncio na estratégia: gera lead (conversas, formulário, vendas) ou trabalha a marca (tráfego/conteúdo para o
 * Instagram, reconhecimento). Engajamento sem nenhuma conversa no grupo conta como marca.
 */
export function papelDoObjetivo(objetivo: string, temResultados: boolean): Papel {
  if (['OUTCOME_LEADS', 'OUTCOME_SALES', 'LEAD_GENERATION', 'MESSAGES', 'CONVERSIONS'].includes(objetivo)) return 'lead'
  if (['OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS', 'LINK_CLICKS', 'REACH', 'BRAND_AWARENESS', 'POST_ENGAGEMENT', 'VIDEO_VIEWS'].includes(objetivo)) return 'marca'
  return temResultados ? 'lead' : 'marca'
}

export const ROTULO_PAPEL: Record<Papel, string> = { lead: 'Geração de leads', marca: 'Marca (tráfego/conteúdo)' }


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
  campaign?: { name?: string; objective?: string }
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
    objetivo: a.campaign?.objective ?? '',
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

/** Referência de cada papel: médias dos anúncios com 500+ impressões (gasto ÷ resultados, gasto ÷ cliques no link). */
export function referencias(anuncios: Anuncio[]): Record<Papel, { anuncios: number; gasto: number; resultados: number; cliquesLink: number; custoPorResultado: number | null; custoPorClique: number | null }> {
  const comDados = anuncios.filter((a) => a.impressoes >= MINIMO_IMPRESSOES)
  const porObjetivo = new Map<string, number>()
  for (const a of comDados) porObjetivo.set(a.objetivo, (porObjetivo.get(a.objetivo) ?? 0) + a.resultados)
  const r = { lead: { anuncios: 0, gasto: 0, resultados: 0, cliquesLink: 0 }, marca: { anuncios: 0, gasto: 0, resultados: 0, cliquesLink: 0 } }
  for (const a of comDados) {
    const g = r[papelDoObjetivo(a.objetivo, (porObjetivo.get(a.objetivo) ?? 0) > 0)]
    g.anuncios++
    g.gasto += a.gasto
    g.resultados += a.resultados
    g.cliquesLink += a.cliquesLink
  }
  const fechar = (g: (typeof r)['lead']) => ({ ...g, gasto: Math.round(g.gasto * 100) / 100, custoPorResultado: g.resultados ? g.gasto / g.resultados : null, custoPorClique: g.cliquesLink ? g.gasto / g.cliquesLink : null })
  return { lead: fechar(r.lead), marca: fechar(r.marca) }
}

/** Classifica cada anúncio pelo papel da campanha e devolve do melhor para o pior (os sem dados por último). */
export function avaliarAnuncios(anuncios: Anuncio[]): AnuncioAvaliado[] {
  const ref = referencias(anuncios)
  const porObjetivo = new Map<string, number>()
  for (const a of anuncios.filter((x) => x.impressoes >= MINIMO_IMPRESSOES)) porObjetivo.set(a.objetivo, (porObjetivo.get(a.objetivo) ?? 0) + a.resultados)
  const ordem: Record<Desempenho, number> = { bom: 0, medio: 1, fraco: 2, 'poucos-dados': 3 }
  return anuncios
    .map((a): AnuncioAvaliado => {
      const papel = papelDoObjetivo(a.objetivo, (porObjetivo.get(a.objetivo) ?? 0) > 0)
      if (a.impressoes < MINIMO_IMPRESSOES) return { ...a, papel, desempenho: 'poucos-dados', motivos: [`Menos de ${MINIMO_IMPRESSOES} impressões no período`] }
      const motivos: string[] = []
      let pontos = 0
      const g = ref[papel]
      if (papel === 'lead' && g.custoPorResultado !== null) {
        if (a.custoPorResultado !== null) {
          const txt = `Custo por resultado ${reais(a.custoPorResultado)} (média das campanhas de lead: ${reais(g.custoPorResultado)})`
          if (a.custoPorResultado <= g.custoPorResultado * 0.8) pontos++
          else if (a.custoPorResultado >= g.custoPorResultado * 1.5) pontos--
          motivos.push(txt)
        } else if (a.gasto >= g.custoPorResultado * 1.5) { pontos--; motivos.push(`Gastou ${reais(a.gasto)} sem nenhum resultado (as campanhas de lead pagam ${reais(g.custoPorResultado)} por resultado)`) }
        else motivos.push('Ainda sem resultados no período')
      } else {
        // Marca: leva pessoas ao perfil/site; o resultado é o clique no link a bom custo, não o lead direto.
        if (papel === 'marca') motivos.push('Campanha de marca (tráfego/conteúdo): avaliada pelo custo do clique, não por leads; leva pessoas ao perfil que viram lead depois')
        const ctrLink = (a.cliquesLink / a.impressoes) * 100
        const cpc = a.cliquesLink ? a.gasto / a.cliquesLink : null
        if (cpc && g.custoPorClique && g.anuncios > 1) {
          if (cpc <= g.custoPorClique * 0.8) { pontos++; motivos.push(`Custo por clique no link ${reais(cpc)} (média: ${reais(g.custoPorClique)})`) }
          else if (cpc >= g.custoPorClique * 1.5) { pontos--; motivos.push(`Custo por clique no link ${reais(cpc)} (média: ${reais(g.custoPorClique)})`) }
        }
        if (ctrLink >= 1.5) { pontos++; motivos.push(`CTR no link de ${pctBr(ctrLink)} (bom a partir de 1,5%)`) }
        else if (ctrLink < 0.7) { pontos--; motivos.push(`CTR no link de ${pctBr(ctrLink)} (fraco abaixo de 0,7%)`) }
      }
      const rankings = [a.qualidade, a.engajamento, a.conversao]
      if (rankings.includes('abaixo')) { pontos--; motivos.push('Meta indica desempenho abaixo dos concorrentes') }
      else if (rankings.includes('acima')) { pontos++; motivos.push('Meta indica desempenho acima dos concorrentes') }
      if (a.frequencia >= 3.5) { pontos--; motivos.push(`Frequência alta (${a.frequencia.toFixed(1)}): o público já viu muitas vezes`) }
      return { ...a, papel, desempenho: pontos > 0 ? 'bom' : pontos < 0 ? 'fraco' : 'medio', motivos }
    })
    .sort((x, y) => ordem[x.desempenho] - ordem[y.desempenho] || y.impressoes - x.impressoes)
}

export function totaisAnuncios(anuncios: Anuncio[]) {
  const t = anuncios.reduce((s, a) => ({ impressoes: s.impressoes + a.impressoes, alcance: s.alcance + a.alcance, cliques: s.cliques + a.cliques, gasto: s.gasto + a.gasto, visualizacoesVideo: s.visualizacoesVideo + a.visualizacoesVideo }), { impressoes: 0, alcance: 0, cliques: 0, gasto: 0, visualizacoesVideo: 0 })
  const resultados = anuncios.reduce((x, a) => x + a.resultados, 0)
  return { ...t, ctr: t.impressoes ? (t.cliques / t.impressoes) * 100 : 0, resultados, custoPorResultado: resultados ? t.gasto / resultados : null }
}
