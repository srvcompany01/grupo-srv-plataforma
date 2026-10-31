/** Plataformas com hashtags fixas por cliente. Para incluir outra, acrescente aqui (a tabela aceita qualquer plataforma). */
export const PLATAFORMAS_HASHTAGS = [{ id: 'instagram', rotulo: 'Instagram', limite: 30 }] as const
export type PlataformaHashtags = (typeof PLATAFORMAS_HASHTAGS)[number]['id']

export const ehPlataformaHashtags = (v: unknown): v is PlataformaHashtags => PLATAFORMAS_HASHTAGS.some((p) => p.id === v)

/** Texto livre (espaço, vírgula ou linha) → lista de hashtags com "#", sem repetidas (ignora maiúsculas), na ordem em que vieram. */
export function lerHashtags(texto: string, limite = 30): string[] {
  const vistas = new Set<string>()
  const lista: string[] = []
  for (const bruto of texto.split(/[\s,;]+/)) {
    const palavra = bruto.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '')
    if (!palavra) continue
    const chave = palavra.toLocaleLowerCase('pt-BR')
    if (vistas.has(chave)) continue
    vistas.add(chave)
    lista.push(`#${palavra}`)
    if (lista.length >= limite) break
  }
  return lista
}

/** Acrescenta no fim da legenda (depois de uma linha em branco) as hashtags do cliente que ainda não estão nela. */
export function comHashtagsDoCliente(legenda: string, hashtags: string[]): string {
  const presentes = new Set((legenda.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => h.toLocaleLowerCase('pt-BR')))
  const faltam = hashtags.filter((h) => !presentes.has(h.toLocaleLowerCase('pt-BR')))
  if (!faltam.length) return legenda
  const base = legenda.trimEnd()
  return base ? `${base}\n\n${faltam.join(' ')}` : faltam.join(' ')
}
