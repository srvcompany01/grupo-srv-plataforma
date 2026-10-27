import * as z from 'zod'
import type { Analise, Item } from './insights'
import type { PapelMensagem } from './atendimento'

/** Auditoria de qualidade do atendimento por WhatsApp feita pela IA: o texto enviado, a resposta lida e os totais. */
export const RESULTADOS = ['venda', 'perdido', 'em_andamento', 'sem_resposta'] as const
export type Resultado = (typeof RESULTADOS)[number]
export const ROTULO_RESULTADO: Record<Resultado, string> = { venda: 'Venda', perdido: 'Perdido', em_andamento: 'Em andamento', sem_resposta: 'Sem resposta' }

export type AnaliseConversa = { nota: number; resultado: Resultado; resumo: string; motivoPerda: string; objecoes: string[]; pontosFortes: string[]; melhorias: string[] }
export type LinhaAnalise = AnaliseConversa & { talkId: number; conversaEm: string; mensagens: number }

const ROTULO_PAPEL: Record<PapelMensagem, string> = { cliente: 'Cliente', atendente: 'Atendente', robo: 'Robô' }
const MAX_CARACTERES = 12_000

/** Conversa em texto corrido, uma fala por linha com a hora (Belém). Passando do limite, mantém o começo e o fim. */
export function montarTranscricao(msgs: { papel: PapelMensagem; texto: string; em: number }[]): string {
  const hora = (ms: number) => new Date(ms - 3 * 3_600_000).toISOString().slice(5, 16).replace('T', ' ')
  const linhas = msgs.filter((m) => m.texto.trim()).map((m) => `[${hora(m.em)}] ${ROTULO_PAPEL[m.papel]}: ${m.texto.trim().replace(/\s+/g, ' ')}`)
  const tudo = linhas.join('\n')
  if (tudo.length <= MAX_CARACTERES) return tudo
  const metade = MAX_CARACTERES / 2
  return `${tudo.slice(0, metade)}\n[… trecho do meio omitido …]\n${tudo.slice(-metade)}`
}

export function promptDeAnalise(transcricao: string, situacaoNoCrm: string): string {
  return `Você audita o atendimento de uma empresa brasileira por WhatsApp. Abaixo está UMA conversa entre o Cliente e a equipe (Atendente = pessoa; Robô = automação). Dados pessoais já foram trocados por marcadores como [telefone].
Situação do negócio no CRM: ${situacaoNoCrm}.

Avalie só o que está escrito. Responda APENAS um JSON com:
- "nota": inteiro de 0 a 100 para a qualidade do atendimento (rapidez percebida, clareza, cordialidade, condução para a venda, resposta às dúvidas)
- "resultado": "venda" (compra fechada), "perdido" (cliente desistiu ou recusou), "em_andamento" ou "sem_resposta" (cliente escreveu e nenhuma pessoa respondeu)
- "resumo": até 2 frases sobre o que o cliente queria e como terminou
- "motivo_perda": se perdido, o motivo em poucas palavras; senão ""
- "objecoes": lista de objeções do cliente, cada uma em 1 a 3 palavras no padrão "preço", "prazo de entrega", "confiança", "forma de pagamento", "qualidade", "distância"… (vazia se não houve)
- "pontos_fortes": até 3 itens curtos do que o atendente fez bem
- "melhorias": até 3 itens curtos e acionáveis do que o atendente deveria ter feito diferente

REGRAS: não cite nomes de pessoas, telefones, e-mails nem documentos; escreva em português; não invente nada que não esteja na conversa.

CONVERSA:
${transcricao}`
}

const lista = z.array(z.string()).catch([]).transform((l) => l.map((x) => x.trim().slice(0, 80)).filter(Boolean).slice(0, 5))
const esquema = z.object({
  nota: z.coerce.number(),
  resultado: z.enum(RESULTADOS).catch('em_andamento'),
  resumo: z.string().catch(''),
  motivo_perda: z.string().catch(''),
  objecoes: lista,
  pontos_fortes: lista,
  melhorias: lista,
})

/** Lê a resposta da IA (JSON, às vezes dentro de ```); null se não der para aproveitar. */
export function lerAnaliseDaIA(resposta: string): AnaliseConversa | null {
  const bruto = resposta.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '').trim()
  let json: unknown
  try { json = JSON.parse(bruto) } catch { return null }
  const r = esquema.safeParse(Array.isArray(json) ? json[0] : json)
  if (!r.success || !Number.isFinite(r.data.nota)) return null
  const d = r.data
  return { nota: Math.max(0, Math.min(100, Math.round(d.nota))), resultado: d.resultado, resumo: d.resumo.trim().slice(0, 600), motivoPerda: d.motivo_perda.trim().slice(0, 200), objecoes: d.objecoes, pontosFortes: d.pontos_fortes, melhorias: d.melhorias }
}

export type ResumoQualidade = {
  total: number
  notaMedia: number | null
  porResultado: Record<Resultado, number>
  objecoes: { texto: string; conversas: number }[]
  melhorias: { texto: string; conversas: number }[]
  motivosDePerda: { texto: string; conversas: number }[]
}

const contar = (textos: string[], topo = 6) => {
  const m = new Map<string, { texto: string; conversas: number }>()
  for (const t of textos) {
    const k = t.toLowerCase().trim()
    if (k) m.set(k, { texto: m.get(k)?.texto ?? t, conversas: (m.get(k)?.conversas ?? 0) + 1 })
  }
  return [...m.values()].sort((a, b) => b.conversas - a.conversas).slice(0, topo)
}

export function resumirQualidade(linhas: LinhaAnalise[]): ResumoQualidade {
  const porResultado: Record<Resultado, number> = { venda: 0, perdido: 0, em_andamento: 0, sem_resposta: 0 }
  for (const l of linhas) porResultado[l.resultado]++
  return {
    total: linhas.length,
    notaMedia: linhas.length ? Math.round(linhas.reduce((s, l) => s + l.nota, 0) / linhas.length) : null,
    porResultado,
    // Cada conversa conta uma vez por item, mesmo que a IA repita.
    objecoes: contar(linhas.flatMap((l) => [...new Set(l.objecoes.map((o) => o.toLowerCase()))])),
    melhorias: contar(linhas.flatMap((l) => [...new Set(l.melhorias)]), 5),
    motivosDePerda: contar(linhas.filter((l) => l.resultado === 'perdido').map((l) => l.motivoPerda)),
  }
}

/** Insights da auditoria: nota geral, objeção mais comum, motivo de perda e o ajuste que mais se repete. */
export function analisarQualidade(r: ResumoQualidade): Analise {
  const destaques: Item[] = []
  const recomendacoes: Item[] = []
  if (!r.total) {
    destaques.push({ tom: 'neutro', texto: 'Nenhuma conversa analisada neste período.' })
    return { destaques, recomendacoes }
  }
  const nota = r.notaMedia ?? 0
  destaques.push({ tom: nota >= 75 ? 'bom' : nota >= 55 ? 'atencao' : 'ruim', texto: `Nota média do atendimento: ${nota}/100 em ${r.total} conversas analisadas.` })
  if (r.porResultado.sem_resposta) {
    destaques.push({ tom: 'ruim', texto: `${r.porResultado.sem_resposta} conversas ficaram sem resposta de uma pessoa.` })
    recomendacoes.push({ tom: 'ruim', texto: 'Defina quem responde o WhatsApp em cada horário: conversa sem resposta é lead jogado fora.' })
  }
  const obj = r.objecoes[0]
  if (obj) {
    destaques.push({ tom: 'neutro', texto: `A objeção mais comum é "${obj.texto}" (${obj.conversas} de ${r.total} conversas).` })
    recomendacoes.push({ tom: 'atencao', texto: `Prepare uma resposta padrão para a objeção "${obj.texto}" e treine a equipe a abordá-la antes de o cliente levantar.` })
  }
  const perda = r.motivosDePerda[0]
  if (perda) destaques.push({ tom: 'atencao', texto: `Motivo de perda mais citado: ${perda.texto} (${perda.conversas} conversas).` })
  const mel = r.melhorias[0]
  if (mel) recomendacoes.push({ tom: nota < 55 ? 'ruim' : 'atencao', texto: `Ajuste que mais se repete: ${mel.texto} (${mel.conversas} conversas).` })
  return { destaques, recomendacoes }
}
