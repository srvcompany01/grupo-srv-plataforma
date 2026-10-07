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
