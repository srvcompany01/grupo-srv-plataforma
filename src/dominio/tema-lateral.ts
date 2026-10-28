export type ModoLateral = 'fixa' | 'recolhida'
export const COOKIE_MODO_LATERAL = 'srv-lateral-modo'
export const COOKIE_LARGURA_LATERAL = 'srv-lateral-largura'
export const LARGURA_LATERAL = { padrao: 240, minima: 208, maxima: 440 } as const

export function lerModoLateral(valor: string | undefined): ModoLateral {
  return valor === 'recolhida' ? 'recolhida' : 'fixa'
}

export function limitarLargura(valor: number): number {
  const { minima, maxima, padrao } = LARGURA_LATERAL
  return Number.isFinite(valor) ? Math.min(maxima, Math.max(minima, Math.round(valor))) : padrao
}

export function lerLarguraLateral(valor: string | undefined): number {
  return valor ? limitarLargura(Number(valor)) : LARGURA_LATERAL.padrao
}

export const COOKIE_NAV_FECHADOS = 'srv-nav-fechados'
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_FECHADOS = 60

/** Ids de espaços e pastas recolhidos na barra (separados por "."), sem repetidos nem valores inválidos. */
export function lerFechados(valor: string | undefined): string[] {
  return [...new Set((valor ?? '').split('.').filter((id) => ID.test(id)))].slice(0, MAX_FECHADOS)
}

export const escreverFechados = (ids: Iterable<string>): string => [...ids].slice(-MAX_FECHADOS).join('.')

export const COOKIE_ORDEM_INICIO = 'srv-nav-ordem-inicio'
const ID_ITEM = /^[a-z0-9-]{1,30}$/

/** Ordem escolhida pela pessoa para os atalhos (ids separados por "."), sem repetidos nem valores inválidos. */
export function lerOrdem(valor: string | undefined): string[] {
  return [...new Set((valor ?? '').split('.').filter((id) => ID_ITEM.test(id)))].slice(0, 40)
}

export const escreverOrdem = (ids: string[]): string => ids.join('.')

/** Ordem de uma lista que acabou de ser reorganizada + a ordem das outras listas que já estava salva (mesmo cookie). */
export const mesclarOrdem = (novaDaLista: string[], salva: string[]): string[] => [...novaDaLista, ...salva.filter((id) => !novaDaLista.includes(id))].slice(0, 40)

/** Aplica a ordem salva. Itens que não estão nela (novos) ficam no fim, na ordem padrão; ids salvos que sumiram são ignorados. */
export function ordenarItens<T extends { id: string }>(itens: T[], ordem: string[]): T[] {
  const posicao = new Map(ordem.map((id, i) => [id, i]))
  const conhecidos = itens.filter((i) => posicao.has(i.id)).sort((a, b) => posicao.get(a.id)! - posicao.get(b.id)!)
  return [...conhecidos, ...itens.filter((i) => !posicao.has(i.id))]
}

export const COOKIE_TEMA = 'srv-tema'
export type ModoTema = 'claro' | 'escuro'

/** Tema escolhido pela pessoa (botão sol/lua). O padrão e o principal é o claro; qualquer valor estranho cai nele. */
export const lerModoTema = (valor: string | undefined): ModoTema => (valor === 'escuro' ? 'escuro' : 'claro')
