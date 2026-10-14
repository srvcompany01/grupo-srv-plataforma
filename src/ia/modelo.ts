import type { ChamarModelo } from './agente'

/**
 * Qualquer provedor com API no formato OpenAI (Gemini, Grok, OpenRouter…): só muda o endereço, a chave e o modelo.
 * `IA_MODELO` aceita vários nomes separados por vírgula, em ordem de preferência: se o primeiro estiver sobrecarregado
 * (muito comum na camada gratuita) ou não existir, tenta o próximo.
 */
export const PADRAO_IA = { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', modelos: ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'] } as const

export function configIA() {
  const chave = process.env.IA_API_KEY
  if (!chave) return null
  const modelos = (process.env.IA_MODELO ?? '').split(',').map((m) => m.trim()).filter(Boolean)
  return { chave, baseUrl: (process.env.IA_BASE_URL ?? PADRAO_IA.baseUrl).replace(/\/$/, ''), modelos: modelos.length ? modelos : [...PADRAO_IA.modelos] }
}

type Config = NonNullable<ReturnType<typeof configIA>>
type Corpo = { choices?: { message?: { content?: string | null; tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[] } }[] }

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function chamarProvedor(config: Config): ChamarModelo {
  return async (mensagens, ferramentas) => {
    let ultimo = 0
    for (const modelo of config.modelos) {
      // Até 2 tentativas por modelo quando está sobrecarregado (429/503); 404/401/outros trocam de modelo ou param.
      for (let tentativa = 0; tentativa < 2; tentativa++) {
        let resposta: Response
        try {
          resposta = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.chave}` },
            body: JSON.stringify({ model: modelo, messages: mensagens, tools: ferramentas, tool_choice: 'auto', temperature: 0.2 }),
            signal: AbortSignal.timeout(20_000),
          })
        } catch {
          ultimo = 504
          break // demorou demais: próximo modelo
        }
        if (resposta.ok) {
          const m = ((await resposta.json()) as Corpo).choices?.[0]?.message
          if (!m) throw new Error('A IA não devolveu resposta.')
          return { content: m.content ?? null, tool_calls: m.tool_calls?.map((t, i) => ({ ...t, id: t.id || `chamada-${i}`, type: 'function' as const })) }
        }
        ultimo = resposta.status
        console.error('IA: erro do provedor', modelo, resposta.status, (await resposta.text().catch(() => '')).slice(0, 300))
        if (resposta.status === 401 || resposta.status === 403) throw new Error('A chave da IA (IA_API_KEY) foi recusada. Confira se está correta.')
        if (resposta.status !== 429 && resposta.status !== 503) break
        if (tentativa === 0) await esperar(1200)
      }
    }
    throw new Error(
      ultimo === 404 ? 'Nenhum dos modelos configurados existe para esta chave. Defina IA_MODELO na Vercel com modelos disponíveis no AI Studio.'
        : ultimo === 429 ? 'Limite de uso da IA atingido por agora. Tente de novo em instantes.'
        : ultimo === 503 || ultimo === 504 ? 'A IA está sobrecarregada agora (camada gratuita). Tente de novo em alguns instantes.'
        : `A IA respondeu com erro (${ultimo}).`,
    )
  }
}
