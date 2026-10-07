export type Segmento = { tipo: 'texto'; valor: string } | { tipo: 'mencao'; nome: string; id: string }

const MENCAO = /@\[([^\]\n]+)\]\(([^)\s]+)\)/g

export function marcarMencao(nome: string, id: string): string {
  return `@[${nome}](${id})`
}

export function extrairMencoes(texto: string): string[] {
  return [...new Set([...texto.matchAll(MENCAO)].map((m) => m[2]))]
}

export function segmentarTexto(texto: string): Segmento[] {
  const saida: Segmento[] = []
  let fim = 0
  for (const m of texto.matchAll(MENCAO)) {
    if (m.index > fim) saida.push({ tipo: 'texto', valor: texto.slice(fim, m.index) })
    saida.push({ tipo: 'mencao', nome: m[1], id: m[2] })
    fim = m.index + m[0].length
  }
  if (fim < texto.length) saida.push({ tipo: 'texto', valor: texto.slice(fim) })
  return saida
}

/** Para editar: `@[Nome](uuid)` vira `@Nome`. */
export function mencoesParaEdicao(texto: string): string {
  return texto.replace(MENCAO, (_, nome: string) => `@${nome}`)
}

/** Ao salvar: `@Nome` (de alguém da lista) volta a `@[Nome](uuid)`. Nomes maiores primeiro; o nome não pode continuar em outra palavra. */
export function mencoesDaEdicao(texto: string, pessoas: { id: string; nome: string }[]): string {
  let saida = texto
  const ordenadas = [...pessoas].sort((a, b) => b.nome.length - a.nome.length)
  // Marcadores provisórios impedem que um nome curto reprocesse o resultado de um nome longo.
  const reservas: string[] = []
  for (const p of ordenadas) {
    const escapado = p.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    saida = saida.replace(new RegExp(`@${escapado}(?![\\p{L}\\p{N}])`, 'gu'), () => {
      reservas.push(marcarMencao(p.nome, p.id))
      return `\u0000${reservas.length - 1}\u0000`
    })
  }
  return saida.replace(/\u0000(\d+)\u0000/g, (_, i: string) => reservas[Number(i)])
}
