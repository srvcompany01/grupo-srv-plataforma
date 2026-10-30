import type { ChamarModelo } from './agente'

/**
 * Qualquer provedor com API no formato OpenAI (Gemini, Grok, OpenRouter…): só muda o endereço, a chave e o modelo.
 * `IA_MODELO` aceita vários nomes separados por vírgula, em ordem de preferência: se o primeiro estiver sobrecarregado
 * (muito comum na camada gratuita) ou não existir, tenta o próximo.
 */
export const PADRAO_IA = { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', modelos: ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'] } as const

export function configIA() {
  const chave = process.env.IA_API_KEY
  if (!chave) return null
  const modelos = (process.env.IA_MODELO ?? '').split(',').map((m) => m.trim()).filter(Boolean)
  const baseUrl = (process.env.IA_BASE_URL ?? PADRAO_IA.baseUrl).replace(/\/$/, '')
  // DeepSeek: o modo "pensar" vem ligado e, com ferramentas, exige devolver o raciocínio a cada chamada (senão dá erro 400).
  // Para tarefas simples ele só encarece, então fica desligado, salvo IA_PENSAR=on.
  const deepseek = baseUrl.includes('deepseek.com')
  const desligarPensar = deepseek && process.env.IA_PENSAR !== 'on'
  return { chave, baseUrl, deepseek, modelos: modelos.length ? modelos : [...PADRAO_IA.modelos], desligarPensar }
}

type Config = NonNullable<ReturnType<typeof configIA>>
type Corpo = { choices?: { message?: { content?: unknown; reasoning_content?: unknown; tool_calls?: { id?: string; function?: { name?: string; arguments?: unknown } }[] } }[] }

/** Alguns provedores devolvem o texto em partes (lista) ou os argumentos já como objeto: aqui tudo vira texto. */
const comoTexto = (v: unknown): string | null =>
  v == null ? null : typeof v === 'string' ? v : Array.isArray(v) ? v.map((p) => (typeof p === 'string' ? p : ((p as { text?: string })?.text ?? ''))).join('') : JSON.stringify(v)

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function chamarProvedor(config: Config): ChamarModelo {
  return async (mensagens, ferramentas) => {
    let ultimo = 0
    let cota: 'dia' | 'minuto' | 'outra' = 'outra'
    for (const modelo of config.modelos) {
      // Até 2 tentativas por modelo quando está sobrecarregado (429/503); 404/401/outros trocam de modelo ou param.
      for (let tentativa = 0; tentativa < 2; tentativa++) {
        let resposta: Response
        try {
          resposta = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.chave}` },
            body: JSON.stringify({ model: modelo, messages: mensagens, tools: ferramentas, tool_choice: 'auto', temperature: 0.2, ...(config.desligarPensar ? { thinking: { type: 'disabled' } } : {}) }),
            signal: AbortSignal.timeout(20_000),
          })
        } catch {
          ultimo = 504
          break // demorou demais: próximo modelo
        }
        if (resposta.ok) {
          const m = ((await resposta.json()) as Corpo).choices?.[0]?.message
          if (!m) throw new Error('A IA não devolveu resposta.')
          return {
            content: comoTexto(m.content),
            reasoning_content: typeof m.reasoning_content === 'string' && m.reasoning_content ? m.reasoning_content : undefined,
            tool_calls: m.tool_calls?.map((t, i) => ({ id: t.id || `chamada-${i}`, type: 'function' as const, function: { name: t.function?.name ?? '', arguments: comoTexto(t.function?.arguments) ?? '{}' } })),
          }
        }
        ultimo = resposta.status
        const texto = await resposta.text().catch(() => '')
        console.error('IA: erro do provedor', modelo, resposta.status, texto.slice(0, 1500))
        if (resposta.status === 429) cota = /PerDay/i.test(texto) ? 'dia' : /PerMinute/i.test(texto) ? 'minuto' : 'outra'
        if (resposta.status === 401 || resposta.status === 403) throw new Error('A chave da IA (IA_API_KEY) foi recusada. Confira se está correta.')
        // 429 (cota do modelo): repetir na hora só gasta mais cota, então vai direto para o próximo modelo. 503 (sobrecarga): uma nova tentativa.
        if (resposta.status !== 503) break
        if (tentativa === 0) await esperar(1200)
      }
    }
    throw new Error(
      ultimo === 404 ? 'Nenhum dos modelos configurados existe para esta chave. Defina IA_MODELO na Vercel com modelos disponíveis no AI Studio.'
        : ultimo === 429 && cota === 'dia' ? 'A cota gratuita diária da IA acabou. Ela volta amanhã; para continuar hoje, ative o faturamento no Google AI Studio.'
        : ultimo === 429 ? 'Limite por minuto da IA (camada gratuita) atingido. Espere cerca de 1 minuto e tente de novo.'
        : ultimo === 503 || ultimo === 504 ? 'A IA está sobrecarregada agora (camada gratuita). Tente de novo em alguns instantes.'
        : `A IA respondeu com erro (${ultimo}).`,
    )
  }
}

/**
 * Botão "Pensar" do painel: só tem efeito no DeepSeek. Ligado, o raciocínio dele é usado; como esse modo exige devolver o raciocínio
 * de cada resposta anterior (que não guardamos entre perguntas), a conversa anterior vai resumida em texto, dentro da própria pergunta.
 */
export function comPensar(config: Config, pensar: boolean): Config {
  return config.deepseek ? { ...config, desligarPensar: !pensar } : config
}

export function achatarConversa<T extends { role: 'user' | 'assistant'; content: string }>(mensagens: T[]): { role: 'user'; content: string }[] {
  if (mensagens.length <= 1) return mensagens as { role: 'user'; content: string }[]
  const anteriores = mensagens.slice(0, -1).map((m) => `${m.role === 'user' ? 'Pessoa' : 'Assistente'}: ${m.content}`).join('\n')
  return [{ role: 'user', content: `Conversa até aqui:\n${anteriores}\n\nPergunta atual: ${mensagens.at(-1)!.content}` }]
}

/** Uma pergunta simples ao modelo da plataforma (DeepSeek, quando configurado), sem ferramentas. Devolve o texto da resposta. */
export async function completarTexto(config: Config, sistema: string, pergunta: string): Promise<string> {
  const r = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.chave}` },
    body: JSON.stringify({ model: config.modelos[0], messages: [{ role: 'system', content: sistema }, { role: 'user', content: pergunta }], temperature: 0.2, ...(config.desligarPensar ? { thinking: { type: 'disabled' } } : {}) }),
    signal: AbortSignal.timeout(60_000),
  })
  if (r.status === 401 || r.status === 403) throw new Error('A chave da IA (IA_API_KEY) foi recusada. Confira se está correta.')
  if (!r.ok) throw new Error(`A IA respondeu com erro (${r.status}).`)
  const texto = comoTexto(((await r.json()) as Corpo).choices?.[0]?.message?.content)
  if (!texto) throw new Error('A IA não devolveu resposta.')
  return texto
}
