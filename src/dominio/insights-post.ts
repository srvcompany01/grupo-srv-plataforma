/**
 * Insight de cada post publicado: a nota sai da comparação com a mediana dos posts recentes do próprio perfil
 * (do mesmo formato quando há pelo menos 3); sem base suficiente, usa a taxa de engajamento sobre o alcance.
 */

export type MetricasPost = {
  visualizacoes: number
  alcance: number
  curtidas: number
  comentarios: number
  salvamentos: number
  compartilhamentos: number
  interacoes: number
  /** Reels: tempo médio assistido, em segundos. */
  tempoMedioSeg?: number | null
}

export type Nota = 'bom' | 'mediano' | 'ruim'

export const ROTULO_NOTA: Record<Nota, string> = { bom: 'Bom', mediano: 'Mediano', ruim: 'Ruim' }

export const engajamento = (m: Pick<MetricasPost, 'interacoes' | 'alcance'>) => (m.alcance ? (m.interacoes / m.alcance) * 100 : 0)

function mediana(xs: number[]): number {
  if (!xs.length) return 0
  const o = [...xs].sort((a, b) => a - b)
  const m = Math.floor(o.length / 2)
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2
}

export type Referencia = { posts: number; visualizacoes: number; alcance: number; engajamento: number; compartilhamentos: number; salvamentos: number }

export function referenciaDe(base: MetricasPost[]): Referencia {
  return {
    posts: base.length,
    visualizacoes: mediana(base.map((b) => b.visualizacoes)),
    alcance: mediana(base.map((b) => b.alcance)),
    engajamento: mediana(base.map(engajamento)),
    compartilhamentos: mediana(base.map((b) => b.compartilhamentos)),
    salvamentos: mediana(base.map((b) => b.salvamentos)),
  }
}

const razao = (a: number, b: number) => (b > 0 ? a / b : a > 0 ? 2 : 1)

/** Nota do post e os motivos, em texto, para a tela e para a IA. */
export function classificarPost(m: MetricasPost, ref: Referencia): { nota: Nota; motivos: string[] } {
  const pct = (r: number) => `${r >= 1 ? '+' : ''}${Math.round((r - 1) * 100)}%`
  const eng = engajamento(m)
  if (ref.posts < 3) {
    const nota: Nota = eng >= 4 ? 'bom' : eng >= 2 ? 'mediano' : 'ruim'
    return { nota, motivos: [`Engajamento de ${eng.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% do alcance (bom a partir de 4%, fraco abaixo de 2%). Ainda há poucos posts para comparar com a média do perfil.`] }
  }
  const rView = razao(m.visualizacoes || m.alcance, ref.visualizacoes || ref.alcance)
  const rEng = razao(eng, ref.engajamento)
  const rComp = razao(m.compartilhamentos + m.salvamentos, ref.compartilhamentos + ref.salvamentos)
  // Alcance/visualizações pesam mais; engajamento e compartilhar/salvar mostram se o conteúdo prendeu.
  const placar = rView * 0.5 + rEng * 0.3 + Math.min(rComp, 3) * 0.2
  const nota: Nota = placar >= 1.2 ? 'bom' : placar < 0.75 ? 'ruim' : 'mediano'
  return {
    nota,
    motivos: [
      `Visualizações ${pct(rView)} em relação à mediana do perfil (${Math.round(ref.visualizacoes || ref.alcance).toLocaleString('pt-BR')}).`,
      `Engajamento de ${eng.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% contra ${ref.engajamento.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% de mediana (${pct(rEng)}).`,
      `Compartilhamentos + salvamentos ${pct(rComp)} da mediana.`,
    ],
  }
}

export type Analise = { tipo: string; resumo: string; deuCerto: string[]; naoDeuCerto: string[]; replicar: string[]; evitar: string[] }

export function promptAnalise(o: { cliente: string; formato: string; legenda: string; metricas: MetricasPost; ref: Referencia; nota: Nota; motivos: string[]; temMidia: boolean }): string {
  return `Você é estrategista de conteúdo para Instagram de uma agência de marketing. Analise este post publicado de ${o.cliente} (formato ${o.formato}).
${o.temMidia ? 'O arquivo anexo é o próprio post (vídeo ou imagem): assista/observe com atenção — gancho dos primeiros 3 segundos, ritmo, cortes, legendas na tela, fala, áudio, enquadramento, chamada para ação.' : 'Não há o arquivo do post: analise pelos números e pela legenda.'}

Legenda: """${o.legenda.slice(0, 2000)}"""
Métricas do post: ${JSON.stringify(o.metricas)}
Mediana dos posts recentes do perfil (${o.ref.posts} posts): ${JSON.stringify(o.ref)}
Classificação pelos números: ${o.nota.toUpperCase()}. ${o.motivos.join(' ')}

Responda SÓ com JSON, em português do Brasil, frases curtas e específicas deste post (nada genérico):
{"tipo": "tipo de conteúdo (ex.: bastidor, tutorial, depoimento, antes e depois, trend, oferta)",
 "resumo": "2 a 3 frases: o desempenho e o porquê",
 "deuCerto": ["2 a 4 pontos"], "naoDeuCerto": ["1 a 4 pontos"],
 "replicar": ["2 a 4 recomendações práticas para os próximos posts"], "evitar": ["1 a 3 pontos"]}`
}

const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim().slice(0, 300)).slice(0, 6) : [])

export function lerAnalise(texto: string): Analise | null {
  try {
    const j = JSON.parse(texto.replace(/^```(json)?|```$/g, '').trim()) as Record<string, unknown>
    const a = { tipo: String(j.tipo ?? '').slice(0, 120), resumo: String(j.resumo ?? '').slice(0, 1500), deuCerto: lista(j.deuCerto), naoDeuCerto: lista(j.naoDeuCerto), replicar: lista(j.replicar), evitar: lista(j.evitar) }
    return a.resumo && (a.deuCerto.length || a.replicar.length) ? a : null
  } catch {
    return null
  }
}
