/** Texto simples (linhas separadas por \n) → documento do editor de descrição (TipTap). */
export function textoParaDescricao(texto: string | null | undefined): unknown {
  const linhas = (texto ?? '').replace(/\r\n/g, '\n').trim().split('\n')
  if (linhas.length === 1 && linhas[0] === '') return null
  return {
    type: 'doc',
    content: linhas.map((linha) => (linha.trim() === '' ? { type: 'paragraph' } : { type: 'paragraph', content: [{ type: 'text', text: linha }] })),
  }
}

/** Documento do editor → texto simples (um parágrafo por linha). */
export function descricaoParaTexto(doc: unknown): string {
  const no = doc as { type?: string; text?: string; content?: unknown[] } | null
  if (!no || typeof no !== 'object') return ''
  if (typeof no.text === 'string') return no.text
  const filhos = (no.content ?? []).map(descricaoParaTexto)
  return no.type === 'doc' || no.type === 'bulletList' || no.type === 'orderedList' ? filhos.join('\n') : filhos.join('')
}
