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

/** Aparência: texto e cores do botão do WhatsApp, título e descrição do quiz. Vazio = padrão. */
export type AparenciaQuiz = { botaoTexto: string; botaoFundo: string; botaoLetra: string; titulo: string; descricao: string }
export const TEXTO_PADRAO_BOTAO = 'Chamar no WhatsApp'
export const APARENCIA_PADRAO: AparenciaQuiz = { botaoTexto: '', botaoFundo: '', botaoLetra: '', titulo: '', descricao: '' }
const HEX = /^#[0-9a-fA-F]{6}$/

/** Valida o que a equipe digitou: textos aparados, cores #rrggbb (ou vazio), tamanhos dentro do limite do banco. */
export function lerAparencia(e: Partial<AparenciaQuiz>): AparenciaQuiz | { erro: string } {
  const t = (v: unknown) => String(v ?? '').trim()
  const a = { botaoTexto: t(e.botaoTexto), botaoFundo: t(e.botaoFundo), botaoLetra: t(e.botaoLetra), titulo: t(e.titulo), descricao: t(e.descricao) }
  if (a.botaoTexto.length > 40) return { erro: 'O texto do botão pode ter até 40 caracteres.' }
  if (a.titulo.length > 80) return { erro: 'O título pode ter até 80 caracteres.' }
  if (a.descricao.length > 200) return { erro: 'A descrição pode ter até 200 caracteres.' }
  for (const c of [a.botaoFundo, a.botaoLetra]) if (c && !HEX.test(c)) return { erro: 'Use cores no formato #000000.' }
  // Só uma das cores: a outra ficaria ilegível (ex.: fundo preto com letra preta).
  if (!!a.botaoFundo !== !!a.botaoLetra) return { erro: 'Escolha as duas cores do botão (fundo e letra), ou nenhuma para o padrão.' }
  if (a.botaoFundo && a.botaoFundo.toLowerCase() === a.botaoLetra.toLowerCase()) return { erro: 'O fundo e a letra do botão não podem ter a mesma cor.' }
  return a
}

export type QuizDaPagina = { perguntas: Pergunta[]; aparencia: AparenciaQuiz }

/** Lê o que `bio_quiz_pagina` devolve: perguntas (vazias ou inválidas = quiz padrão) e aparência. Aceita também a lista antiga. */
export function lerQuizDaPagina(bruto: unknown): QuizDaPagina {
  const o = (bruto && typeof bruto === 'object' && !Array.isArray(bruto) ? bruto : {}) as Record<string, unknown>
  const texto = (v: unknown) => (typeof v === 'string' ? v : '')
  const cor = (v: unknown) => (typeof v === 'string' && HEX.test(v) ? v : '')
  const fundo = cor(o.botaoFundo)
  const letra = cor(o.botaoLetra)
  return {
    perguntas: perguntasDaPagina(Array.isArray(bruto) ? bruto : o.perguntas),
    aparencia: { botaoTexto: texto(o.botaoTexto), botaoFundo: fundo && letra ? fundo : '', botaoLetra: fundo && letra ? letra : '', titulo: texto(o.titulo), descricao: texto(o.descricao) },
  }
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
