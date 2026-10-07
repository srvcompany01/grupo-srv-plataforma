export type Visual = { cor: string; icone: string; emoji: string | null }
export type EspacoPlano = Visual & { id: string; nome: string; slug?: string | null; descricao: string | null; posicao: string; paiId: string | null }
export type PastaPlana = Visual & { id: string; nome: string; espacoId: string | null; posicao: string }
export type ItemLista = {
  id: string
  nome: string
  espacoId: string | null
  pastaId: string | null
  posicao: string
  clienteNome: string
  /** YYYY-MM-01 */
  mes: string | null
} & Visual

export type NoPasta = PastaPlana & { listas: ItemLista[] }
export type NoEspaco = EspacoPlano & { filhos: NoEspaco[]; pastas: NoPasta[]; listas: ItemLista[] }
export type Navegacao = { espacos: NoEspaco[]; pastasRaiz: NoPasta[]; listasRaiz: ItemLista[] }

const porPosicao = <T extends { posicao: string }>(a: T, b: T) => (a.posicao < b.posicao ? -1 : a.posicao > b.posicao ? 1 : 0)

/** Espaço › sub-área › pasta › lista, além de pastas e listas soltas na raiz. */
export function montarNavegacao(espacos: EspacoPlano[], pastas: PastaPlana[], listas: ItemLista[]): Navegacao {
  const nos = new Map(espacos.map((e) => [e.id, { ...e, filhos: [] as NoEspaco[], pastas: [] as NoPasta[], listas: [] as ItemLista[] }]))
  const nosPasta = new Map(pastas.map((p) => [p.id, { ...p, listas: [] as ItemLista[] }]))
  const pastasRaiz: NoPasta[] = []
  const listasRaiz: ItemLista[] = []

  for (const p of nosPasta.values()) {
    if (p.espacoId) nos.get(p.espacoId)?.pastas.push(p)
    else pastasRaiz.push(p)
  }
  for (const l of listas) {
    const pasta = l.pastaId ? nosPasta.get(l.pastaId) : undefined
    if (pasta) pasta.listas.push(l)
    else if (l.espacoId) nos.get(l.espacoId)?.listas.push(l)
    else listasRaiz.push(l)
  }

  const raizes: NoEspaco[] = []
  for (const e of nos.values()) {
    const pai = e.paiId ? nos.get(e.paiId) : undefined
    if (pai) pai.filhos.push(e)
    else raizes.push(e)
  }
  for (const e of nos.values()) {
    e.filhos.sort(porPosicao)
    e.pastas.sort(porPosicao)
    e.listas.sort(porPosicao)
    e.pastas.forEach((p) => p.listas.sort(porPosicao))
  }
  pastasRaiz.sort(porPosicao)
  pastasRaiz.forEach((p) => p.listas.sort(porPosicao))
  listasRaiz.sort(porPosicao)
  return { espacos: raizes.sort(porPosicao), pastasRaiz, listasRaiz }
}

/** Compatibilidade para consumidores que precisam apenas da árvore de espaços. */
export function montarArvoreEspacos(espacos: EspacoPlano[], pastas: PastaPlana[], listas: ItemLista[]): NoEspaco[] {
  return montarNavegacao(espacos, pastas, listas).espacos
}
