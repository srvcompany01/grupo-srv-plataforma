import * as z from 'zod'

type Esquema = Record<string, unknown>

const PERMITIDAS = new Set(['type', 'description', 'properties', 'required', 'items', 'enum'])

/** Deixa só o que todos os provedores aceitam (Gemini e Grok são exigentes): sem format/pattern/additionalProperties, e união vira o primeiro tipo útil. */
function simplificar(no: unknown): Esquema {
  if (!no || typeof no !== 'object') return {}
  const e = no as Esquema
  const uniao = (e.anyOf ?? e.oneOf) as Esquema[] | undefined
  if (uniao?.length) {
    const util = uniao.find((u) => u.type !== 'null') ?? uniao[0]
    return { ...simplificar(util), ...(typeof e.description === 'string' ? { description: e.description } : {}) }
  }
  const saida: Esquema = {}
  for (const [chave, valor] of Object.entries(e)) {
    if (!PERMITIDAS.has(chave)) continue
    if (chave === 'properties') saida.properties = Object.fromEntries(Object.entries(valor as Esquema).map(([k, v]) => [k, simplificar(v)]))
    else if (chave === 'items') saida.items = simplificar(valor)
    else saida[chave] = valor
  }
  if (saida.type === 'object' && !saida.properties) saida.properties = {}
  return saida
}

/** Parâmetros de uma ferramenta (zod) → JSON Schema simples para a API do modelo. */
export function esquemaDaFerramenta(entrada: z.ZodRawShape): Esquema {
  return simplificar(z.toJSONSchema(z.object(entrada), { io: 'input', unrepresentable: 'any' }))
}
