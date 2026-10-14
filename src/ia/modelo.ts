import type { ChamarModelo } from './agente'

/** Qualquer provedor com API no formato OpenAI (Gemini, Grok, OpenRouter…): só muda o endereço, a chave e o modelo. */
export const PADRAO_IA = { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', modelo: 'gemini-2.5-flash' } as const

export function configIA() {
  const chave = process.env.IA_API_KEY
  if (!chave) return null
  return { chave, baseUrl: (process.env.IA_BASE_URL ?? PADRAO_IA.baseUrl).replace(/\/$/, ''), modelo: process.env.IA_MODELO ?? PADRAO_IA.modelo }
}

export function chamarProvedor(config: NonNullable<ReturnType<typeof configIA>>): ChamarModelo {
  return async (mensagens, ferramentas) => {
    // Camada gratuita limita por minuto: tenta de novo (espera crescente) se vier 429/503.
    for (let tentativa = 0; ; tentativa++) {
      const resposta = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.chave}` },
        body: JSON.stringify({ model: config.modelo, messages: mensagens, tools: ferramentas, tool_choice: 'auto', temperature: 0.2 }),
        signal: AbortSignal.timeout(45_000),
      })
      if ((resposta.status === 429 || resposta.status === 503) && tentativa < 2) {
        await new Promise((r) => setTimeout(r, 1500 * (tentativa + 1)))
        continue
      }
      if (!resposta.ok) throw new Error(resposta.status === 429 ? 'Limite de uso da IA atingido por agora. Tente de novo em instantes.' : `A IA respondeu com erro (${resposta.status}).`)
      const dados = (await resposta.json()) as { choices?: { message?: { content?: string | null; tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[] } }[] }
      const m = dados.choices?.[0]?.message
      if (!m) throw new Error('A IA não devolveu resposta.')
      return { content: m.content ?? null, tool_calls: m.tool_calls?.map((t, i) => ({ ...t, id: t.id || `chamada-${i}`, type: 'function' as const })) }
    }
  }
}
