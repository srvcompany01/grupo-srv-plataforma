export type EspacoPlano = { id: string; nome: string; cor: string; posicao: string; paiId: string | null }
export type PastaPlana = { id: string; nome: string; espacoId: string; posicao: string }
export type ItemLista = {
  id: string
  nome: string
  espacoId: string
  pastaId: string | null
  posicao: string
  clienteNome: string
  /** YYYY-MM-01 */
  mes: string | null
}

export type NoPasta = PastaPlana & { listas: ItemLista[] }
export type NoEspaco = EspacoPlano & { filhos: NoEspaco[]; pastas: NoPasta[]; listas: ItemLista[] }

const porPosicao = <T extends { posicao: string }>(a: T, b: T) => (a.posicao < b.posicao ? -1 : a.posicao > b.posicao ? 1 : 0)

/** Espaço › sub-área › pasta › lista, cada nível em ordem. O que a RLS esconder simplesmente não aparece. */
export function montarArvoreEspacos(espacos: EspacoPlano[], pastas: PastaPlana[], listas: ItemLista[]): NoEspaco[] {
  const nos = new Map(espacos.map((e) => [e.id, { ...e, filhos: [] as NoEspaco[], pastas: [] as NoPasta[], listas: [] as ItemLista[] }]))
  const nosPasta = new Map(pastas.map((p) => [p.id, { ...p, listas: [] as ItemLista[] }]))

  for (const p of nosPasta.values()) nos.get(p.espacoId)?.pastas.push(p)
  for (const l of listas) {
    const pasta = l.pastaId ? nosPasta.get(l.pastaId) : undefined
    if (pasta) pasta.listas.push(l)
    else nos.get(l.espacoId)?.listas.push(l)
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
  return raizes.sort(porPosicao)
}
