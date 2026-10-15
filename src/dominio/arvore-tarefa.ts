/** Ids da raiz e de todas as descendentes da tarefa `id`, dado o mapa tarefa → mãe. A tag de cliente vale para a árvore inteira. */
export function idsDaArvore(paiDe: Map<string, string | null>, id: string): string[] {
  let raiz = id
  const vistos = new Set<string>()
  while (paiDe.get(raiz) && !vistos.has(raiz)) {
    vistos.add(raiz)
    raiz = paiDe.get(raiz) as string
  }
  const ids = new Set([raiz])
  let achou = true
  while (achou) {
    achou = false
    for (const [filho, pai] of paiDe) if (pai && ids.has(pai) && !ids.has(filho)) { ids.add(filho); achou = true }
  }
  return [...ids]
}
