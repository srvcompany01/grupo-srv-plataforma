/**
 * Tempos e volumes do atendimento por WhatsApp, só com horários e quem escreveu (sem ler o texto). Papéis:
 * `cliente` (entrada), `atendente` (pessoa da equipe) e `robo` (automação, sem usuário). Resposta "humana" = atendente.
 */
export type PapelMensagem = 'cliente' | 'atendente' | 'robo'
export type MensagemAtendimento = { conversa: string; papel: PapelMensagem; em: number }

export type MetricasAtendimento = {
  conversas: number
  /** Conversas em que um atendente respondeu depois da primeira mensagem do cliente. */
  respondidas: number
  /** Só o robô respondeu (ninguém da equipe). */
  soRobo: number
  /** Cliente esperando atendente há mais do limite. */
  semResposta: number
  taxaDeResposta: number | null
  /** Do primeiro contato do cliente até o primeiro atendente, em segundos. */
  primeiraResposta: { mediana: number | null; media: number | null; p90: number | null; ate5min: number | null; ate15min: number | null; ate60min: number | null }
  /** Média de cada vez que o cliente escreveu e esperou a próxima resposta de um atendente, em segundos. */
  tempoMedioDeResposta: number | null
}

const MIN = 60
const percentil = (xs: number[], p: number) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.ceil(xs.length * p) - 1)] : null)
const mediana = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null
}
const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null)
const pct = (xs: number[], limite: number, total: number) => (total ? (xs.filter((x) => x <= limite).length / total) * 100 : null)

export function metricasDeAtendimento(mensagens: MensagemAtendimento[], agora: number, limiteSemRespostaSeg = 3600): MetricasAtendimento {
  const porConversa = new Map<string, MensagemAtendimento[]>()
  for (const m of mensagens) porConversa.set(m.conversa, [...(porConversa.get(m.conversa) ?? []), m])
  const primeiras: number[] = []
  const turnos: number[] = []
  let conversas = 0
  let respondidas = 0
  let soRobo = 0
  let semResposta = 0
  for (const lista of porConversa.values()) {
    const msgs = [...lista].sort((a, b) => a.em - b.em)
    const primeiraDoCliente = msgs.find((m) => m.papel === 'cliente')
    if (!primeiraDoCliente) continue
    conversas++
    const resposta = msgs.find((m) => m.papel === 'atendente' && m.em >= primeiraDoCliente.em)
    if (resposta) {
      respondidas++
      primeiras.push((resposta.em - primeiraDoCliente.em) / 1000)
    } else if (msgs.some((m) => m.papel === 'robo' && m.em >= primeiraDoCliente.em)) soRobo++
    // Cada rodada: o cliente escreve (uma ou mais mensagens seguidas) e espera o próximo atendente.
    let inicioDaRodada: number | null = null
    for (const m of msgs) {
      if (m.papel === 'cliente') inicioDaRodada ??= m.em
      else if (m.papel === 'atendente' && inicioDaRodada !== null) {
        turnos.push((m.em - inicioDaRodada) / 1000)
        inicioDaRodada = null
      }
    }
    if (!resposta && (agora - primeiraDoCliente.em) / 1000 > limiteSemRespostaSeg) semResposta++
  }
  return {
    conversas,
    respondidas,
    soRobo,
    semResposta,
    taxaDeResposta: conversas ? (respondidas / conversas) * 100 : null,
    primeiraResposta: { mediana: mediana(primeiras), media: media(primeiras), p90: percentil(primeiras, 0.9), ate5min: pct(primeiras, 5 * MIN, conversas), ate15min: pct(primeiras, 15 * MIN, conversas), ate60min: pct(primeiras, 60 * MIN, conversas) },
    tempoMedioDeResposta: media(turnos),
  }
}

/** 95 s → "1 min 35 s"; 4.000 s → "1 h 7 min"; null → "—". */
export function duracao(seg: number | null): string {
  if (seg === null) return '—'
  if (seg < 60) return `${Math.round(seg)} s`
  const min = Math.floor(seg / 60)
  if (min < 60) return `${min} min${Math.round(seg % 60) ? ` ${Math.round(seg % 60)} s` : ''}`
  const h = Math.floor(min / 60)
  return h < 24 ? `${h} h${min % 60 ? ` ${min % 60} min` : ''}` : `${Math.floor(h / 24)} d${h % 24 ? ` ${h % 24} h` : ''}`
}

// ───────────────────────────── Leitura do atendimento: insights e recomendações ─────────────────────────────

import type { Analise, Item } from './insights'

export type NegociosDoPeriodo = { novos: number; ganhos: number; perdidos: number; receita: number; ganhosSemValor: number }

const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const num = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** O que os números do atendimento dizem e o que fazer: velocidade da resposta, conversas abandonadas, robô e vendas. */
export function analisarAtendimento(m: MetricasAtendimento, n: NegociosDoPeriodo, porEtiqueta: { etiqueta: string; leads: number; vendas: number }[] = []): Analise {
  const destaques: Item[] = []
  const recomendacoes: Item[] = []
  if (!m.conversas && !n.novos && !n.ganhos) {
    destaques.push({ tom: 'neutro', texto: 'Nenhuma conversa nem negócio neste período.' })
    return { destaques, recomendacoes }
  }
  if (m.conversas) {
    destaques.push({ tom: 'neutro', texto: `${num(m.conversas)} conversas de clientes; ${num(m.respondidas)} respondidas por uma pessoa (${num(m.taxaDeResposta ?? 0)}%).` })
    const mediana = m.primeiraResposta.mediana
    if (mediana !== null) {
      const tom = mediana <= 300 ? 'bom' : mediana <= 900 ? 'neutro' : mediana <= 3600 ? 'atencao' : 'ruim'
      destaques.push({ tom, texto: `A primeira resposta de uma pessoa leva ${duracao(mediana)} (mediana; média ${duracao(m.primeiraResposta.media)}; no pior 10%, ${duracao(m.primeiraResposta.p90)}).` })
      if (mediana > 900) recomendacoes.push({ tom: mediana > 3600 ? 'ruim' : 'atencao', texto: 'Responda o primeiro contato em até 15 minutos: combine quem responde em cada horário e use uma mensagem rápida de acolhimento enquanto busca a resposta completa.' })
    }
    if (m.primeiraResposta.ate15min !== null && m.primeiraResposta.ate15min < 50) destaques.push({ tom: 'atencao', texto: `Só ${num(m.primeiraResposta.ate15min)}% das conversas recebem resposta de uma pessoa em até 15 minutos.` })
    if (m.semResposta) {
      destaques.push({ tom: m.semResposta / m.conversas > 0.1 ? 'ruim' : 'atencao', texto: `${num(m.semResposta)} conversas esperam uma pessoa há mais de 1 hora.` })
      recomendacoes.push({ tom: 'ruim', texto: 'Retome hoje as conversas sem resposta: cliente que escreve e não é atendido costuma procurar o concorrente.' })
    }
    if (m.soRobo) destaques.push({ tom: 'atencao', texto: `${num(m.soRobo)} conversas só receberam resposta do robô (nenhuma pessoa respondeu).` })
    if (m.taxaDeResposta !== null && m.taxaDeResposta < 80) recomendacoes.push({ tom: 'atencao', texto: 'Menos de 80% das conversas chegam a uma pessoa. Confira se o robô está passando o atendimento para a equipe e se há cobertura nos horários de pico.' })
  }
  if (n.ganhos) {
    destaques.push({ tom: 'bom', texto: `${num(n.ganhos)} vendas${n.receita ? `, ${reais(n.receita)} (ticket médio ${reais(n.receita / Math.max(1, n.ganhos - n.ganhosSemValor))})` : ''}.` })
    if (n.ganhosSemValor) recomendacoes.push({ tom: 'atencao', texto: `${num(n.ganhosSemValor)} vendas sem valor preenchido. Torne o valor obrigatório ao mover o negócio para a etapa de venda: sem ele, a receita e o ROAS ficam incompletos.` })
  } else if (n.novos >= 20) {
    destaques.push({ tom: 'ruim', texto: `${num(n.novos)} negócios novos e nenhuma venda registrada no período.` })
    recomendacoes.push({ tom: 'atencao', texto: 'Confira se as vendas estão sendo movidas para a etapa de venda no Kommo; se não estiverem, o resultado fica subcontado.' })
  }
  if (n.novos && n.ganhos) destaques.push({ tom: 'neutro', texto: `${num((n.ganhos / n.novos) * 100)}% dos negócios novos do período viraram venda.` })
  const lider = [...porEtiqueta].filter((e) => e.vendas > 0).sort((a, b) => b.vendas - a.vendas)[0]
  if (lider && n.ganhos) destaques.push({ tom: 'neutro', texto: `A origem "${lider.etiqueta}" concentra ${num((lider.vendas / n.ganhos) * 100)}% das vendas.` })
  return { destaques, recomendacoes }
}
