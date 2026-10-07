export type ItemLinha<A, C> =
  | { tipo: 'atividade'; chave: string; em: string; item: A }
  | { tipo: 'comentario'; chave: string; em: string; item: C }

export type FiltroLinha = 'tudo' | 'comentarios' | 'historico'

/** `atividades` chega em ordem decrescente (como `listarAtividade`); a saída é crescente. */
export function montarLinhaDoTempo<A extends { id: number; criadoEm: string }, C extends { id: string; criadoEm: string }>(
  atividades: A[],
  comentarios: C[],
): ItemLinha<A, C>[] {
  const itens: ItemLinha<A, C>[] = [
    ...[...atividades].reverse().map((item): ItemLinha<A, C> => ({ tipo: 'atividade', chave: `a-${item.id}`, em: item.criadoEm, item })),
    ...comentarios.map((item): ItemLinha<A, C> => ({ tipo: 'comentario', chave: `c-${item.id}`, em: item.criadoEm, item })),
  ]
  // sort é estável: no empate vale a ordem de entrada (atividades primeiro).
  return itens.sort((x, y) => Date.parse(x.em) - Date.parse(y.em))
}

/** Mostra o 1º item e os `ultimos` mais recentes; o resto fica atrás de "Mostrar mais". */
export function recortarLinhaDoTempo<T>(itens: T[], expandido: boolean, ultimos = 10): { visiveis: T[]; ocultos: number } {
  if (expandido || itens.length <= ultimos + 1) return { visiveis: itens, ocultos: 0 }
  return { visiveis: [itens[0], ...itens.slice(-ultimos)], ocultos: itens.length - ultimos - 1 }
}

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function filtrarLinhaDoTempo<A, C>(
  itens: ItemLinha<A, C>[],
  filtro: FiltroLinha,
  busca: string,
  texto: (i: ItemLinha<A, C>) => string,
): ItemLinha<A, C>[] {
  const termo = normalizar(busca.trim())
  return itens.filter((i) => {
    if (filtro === 'comentarios' && i.tipo !== 'comentario') return false
    if (filtro === 'historico' && i.tipo !== 'atividade') return false
    return !termo || normalizar(texto(i)).includes(termo)
  })
}
