/**
 * Quiz da página da bio: a pessoa responde a poucas perguntas de múltipla escolha e só então o WhatsApp abre. Concluir o quiz
 * é o que conta como lead orgânico (mostra interesse real). As perguntas são do cliente; sem elas vale o quiz padrão.
 */
export const MAXIMO_PERGUNTAS = 3
export const MINIMO_OPCOES = 2
export const MAXIMO_OPCOES = 4

export type Pergunta = { pergunta: string; opcoes: string[] }
export type Resposta = { p: string; o: string }

export const QUIZ_PADRAO: Pergunta[] = [
  { pergunta: 'Como podemos te ajudar?', opcoes: ['Quero um orçamento', 'Tenho uma dúvida', 'Quero conhecer os serviços'] },
  { pergunta: 'Quando você pretende começar?', opcoes: ['O quanto antes', 'Nas próximas semanas', 'Só estou pesquisando'] },
]

/** Perguntas digitadas pela equipe (opções uma por linha): linhas totalmente vazias somem; o resto precisa estar completo. */
export function lerPerguntas(brutas: { pergunta: string; opcoes: string }[]): Pergunta[] | { erro: string } {
  const saida: Pergunta[] = []
  for (const b of brutas) {
    const pergunta = String(b.pergunta ?? '').trim()
    const opcoes = [...new Set(String(b.opcoes ?? '').split('\n').map((o) => o.trim()).filter(Boolean))]
    if (!pergunta && !opcoes.length) continue
    if (!pergunta || pergunta.length > 80) return { erro: 'Cada pergunta precisa de um texto de até 80 caracteres.' }
    if (opcoes.length < MINIMO_OPCOES || opcoes.length > MAXIMO_OPCOES) return { erro: `"${pergunta}": escreva de ${MINIMO_OPCOES} a ${MAXIMO_OPCOES} opções, uma por linha.` }
    if (opcoes.some((o) => o.length > 40)) return { erro: `"${pergunta}": cada opção pode ter até 40 caracteres.` }
    saida.push({ pergunta, opcoes })
  }
  if (saida.length > MAXIMO_PERGUNTAS) return { erro: `No máximo ${MAXIMO_PERGUNTAS} perguntas.` }
  return saida
}

/** Lê as perguntas que o banco devolve (jsonb); inválido ou vazio = quiz padrão. */
export function perguntasDaPagina(bruto: unknown): Pergunta[] {
  const lista = Array.isArray(bruto) ? bruto : []
  const ok = lista.flatMap((q): Pergunta[] => {
    const o = (q && typeof q === 'object' ? q : {}) as { pergunta?: unknown; opcoes?: unknown }
    return typeof o.pergunta === 'string' && Array.isArray(o.opcoes) && o.opcoes.every((x) => typeof x === 'string') ? [{ pergunta: o.pergunta, opcoes: o.opcoes as string[] }] : []
  })
  return ok.length ? ok.slice(0, MAXIMO_PERGUNTAS) : QUIZ_PADRAO
}

/** Índices escolhidos → textos. Precisa de uma resposta válida para cada pergunta; senão null (quiz incompleto não conta). */
export function resolverRespostas(perguntas: Pergunta[], escolhas: unknown): Resposta[] | null {
  if (!Array.isArray(escolhas) || escolhas.length !== perguntas.length) return null
  const saida: Resposta[] = []
  for (const [i, q] of perguntas.entries()) {
    const e = escolhas[i]
    if (!Number.isInteger(e) || e < 0 || e >= q.opcoes.length) return null
    saida.push({ p: q.pergunta, o: q.opcoes[e] })
  }
  return saida
}

/** Mensagem pronta do WhatsApp: a do cliente e, embaixo, o que a pessoa respondeu (o atendente já sabe o que ela quer). */
export const mensagemComRespostas = (base: string, respostas: Resposta[]) => `${base.trim()}\n\n${respostas.map((r) => `• ${r.p} ${r.o}`).join('\n')}`.trim()

export type RespostasDoQuiz = { pergunta: string; total: number; opcoes: { opcao: string; n: number }[] }

/** O que as pessoas responderam, por pergunta (pelos textos guardados no lead; mudar a pergunta depois não apaga o histórico). */
export function resumirQuiz(leads: { respostas: unknown }[]): RespostasDoQuiz[] {
  const por = new Map<string, Map<string, number>>()
  for (const l of leads) {
    for (const r of Array.isArray(l.respostas) ? l.respostas : []) {
      const o = (r && typeof r === 'object' ? r : {}) as { p?: unknown; o?: unknown }
      if (typeof o.p !== 'string' || typeof o.o !== 'string') continue
      const m = por.get(o.p) ?? new Map<string, number>()
      m.set(o.o, (m.get(o.o) ?? 0) + 1)
      por.set(o.p, m)
    }
  }
  return [...por].map(([pergunta, m]) => ({ pergunta, total: [...m.values()].reduce((s, x) => s + x, 0), opcoes: [...m].map(([opcao, n]) => ({ opcao, n })).sort((a, b) => b.n - a.n) }))
}
