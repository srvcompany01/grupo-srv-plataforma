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

/**
 * Valores de campos que são só classificação (tipo da mensagem, tipo do autor, canal de origem), contados nos eventos de
 * mensagem: mostra como o Kommo separa cliente, atendente e robô sem expor nome, telefone nem texto.
 */
export function classificacoesDasMensagens(corpos: unknown[]) {
  const conta = (m: Record<string, number>, v: unknown) => { const k = String(v ?? 'sem'); m[k] = (m[k] ?? 0) + 1 }
  const r = { message_type: {} as Record<string, number>, author_type: {} as Record<string, number>, origin: {} as Record<string, number>, element_type: {} as Record<string, number> }
  for (const c of corpos) {
    const add = ((c as Obj)?.message as Obj | undefined)?.add
    for (const m of (Array.isArray(add) ? add : []) as Obj[]) {
      conta(r.message_type, m.message_type)
      conta(r.author_type, (m.author as Obj | undefined)?.type)
      conta(r.origin, m.origin)
      conta(r.element_type, m.element_type)
    }
  }
  return r
}

/**
 * O que os eventos de negócio dizem sobre o funil, sem nome, telefone nem texto: para qual etapa e funil os negócios foram
 * movidos (ids), de qual etapa saíram e que etiquetas carregam. Venda = etapa 142 (ganho); perda = 143.
 */
export function classificacoesDosNegocios(corpos: unknown[]) {
  const conta = (m: Record<string, number>, v: unknown) => { const k = String(v ?? 'sem'); m[k] = (m[k] ?? 0) + 1 }
  const r = { eventos: {} as Record<string, number>, etapaNova: {} as Record<string, number>, etapaAnterior: {} as Record<string, number>, funil: {} as Record<string, number>, etiquetas: {} as Record<string, number>, comValor: 0 }
  for (const c of corpos) {
    const leads = (c as Obj)?.leads as Obj | undefined
    for (const [evento, lista] of Object.entries(leads ?? {})) {
      for (const l of (Array.isArray(lista) ? lista : []) as Obj[]) {
        conta(r.eventos, evento)
        conta(r.etapaNova, l.status_id)
        if (l.old_status_id !== undefined) conta(r.etapaAnterior, l.old_status_id)
        conta(r.funil, l.pipeline_id)
        for (const t of (Array.isArray(l.tags) ? l.tags : []) as Obj[]) conta(r.etiquetas, t.name)
        if (Number(l.price) > 0) r.comValor++
      }
    }
  }
  return r
}
