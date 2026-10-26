/**
 * Kommo (antigo amoCRM). O webhook dele manda `application/x-www-form-urlencoded` com chaves aninhadas
 * (`leads[status][0][id]=123`), não JSON: aqui vira um objeto comum.
 */
type Obj = Record<string, unknown>

/** `a[b][0][c]=1&a[b][0][d]=2` → { a: { b: [ { c: '1', d: '2' } ] } }. */
export function lerFormularioKommo(texto: string): Obj {
  const raiz: Obj = {}
  for (const [chave, valor] of new URLSearchParams(texto)) {
    const caminho = [...chave.matchAll(/([^[\]]+)/g)].map((m) => m[1])
    let no: Obj | unknown[] = raiz
    caminho.forEach((parte, i) => {
      const ultimo = i === caminho.length - 1
      const proximoEhIndice = !ultimo && /^\d+$/.test(caminho[i + 1])
      const contenedor = no as Record<string, unknown>
      if (ultimo) contenedor[parte] = valor
      else {
        contenedor[parte] ??= proximoEhIndice ? [] : {}
        no = contenedor[parte] as Obj | unknown[]
      }
    })
  }
  return normalizarIndices(raiz) as Obj
}

/** Objetos com chaves "0", "1"… viram lista (os índices numéricos do formulário). */
function normalizarIndices(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalizarIndices)
  if (v && typeof v === 'object') {
    const e = Object.entries(v as Obj)
    if (e.length && e.every(([k]) => /^\d+$/.test(k))) return e.sort((a, b) => Number(a[0]) - Number(b[0])).map(([, x]) => normalizarIndices(x))
    return Object.fromEntries(e.map(([k, x]) => [k, normalizarIndices(x)]))
  }
  return v
}

/** Subdomínio da conta que mandou o webhook (account[subdomain]). */
export const contaDoEvento = (corpo: unknown): string => String(((corpo as Obj)?.account as Obj | undefined)?.subdomain ?? '').slice(0, 80)

/** Só o formato de uma resposta da API (chaves e tipos), sem nomes, telefones nem textos de clientes. */
export function formaDe(v: unknown, fundura = 3): unknown {
  if (Array.isArray(v)) return v.length ? [formaDe(v[0], fundura)] : []
  if (v && typeof v === 'object') return fundura <= 0 ? '{…}' : Object.fromEntries(Object.entries(v as Obj).map(([k, x]) => [k, formaDe(x, fundura - 1)]))
  return v === null ? 'null' : typeof v
}

/** O evento traz o texto de alguma mensagem de chat (campo `text` não vazio dentro de `message`)? Não devolve o texto. */
export function temTexto(corpo: unknown): boolean {
  const procurar = (v: unknown, dentroDeMensagem: boolean): boolean => {
    if (Array.isArray(v)) return v.some((x) => procurar(x, dentroDeMensagem))
    if (v && typeof v === 'object') return Object.entries(v as Obj).some(([k, x]) => (dentroDeMensagem && k === 'text' && typeof x === 'string' && x.length > 0) || procurar(x, dentroDeMensagem || /^message$/i.test(k)))
    return false
  }
  return procurar(corpo, false)
}
