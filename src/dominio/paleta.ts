import type { Navegacao, NoEspaco, NoPasta } from './arvore-espacos'

/** Espaço ou lista que a paleta de comandos (⌘K) sabe abrir. `contexto` é o caminho legível ("Operação / Social"). */
export type ItemPaleta = { id: string; tipo: 'espaco' | 'lista'; rotulo: string; contexto: string; href: string }

/** Espaços e listas da barra lateral, achatados, para a busca da paleta. */
export function itensDaNavegacao(nav: Navegacao): ItemPaleta[] {
  const itens: ItemPaleta[] = []
  const lista = (l: { id: string; nome: string }, contexto: string) => itens.push({ id: l.id, tipo: 'lista', rotulo: l.nome, contexto, href: `/listas/${l.id}` })
  const pasta = (p: NoPasta, contexto: string) => p.listas.forEach((l) => lista(l, contexto ? `${contexto} / ${p.nome}` : p.nome))
  const espaco = (e: NoEspaco, contexto: string) => {
    itens.push({ id: e.id, tipo: 'espaco', rotulo: e.nome, contexto, href: `/espacos/${e.id}` })
    const aqui = contexto ? `${contexto} / ${e.nome}` : e.nome
    e.listas.forEach((l) => lista(l, aqui))
    e.pastas.forEach((p) => pasta(p, aqui))
    e.filhos.forEach((f) => espaco(f, aqui))
  }
  nav.espacos.forEach((e) => espaco(e, ''))
  nav.pastasRaiz.forEach((p) => pasta(p, ''))
  nav.listasRaiz.forEach((l) => lista(l, ''))
  return itens
}

/** Atalhos de uma tecla (fora de campos de texto). A tela de atalhos e o teclado leem a mesma lista. */
export const ATALHOS_DE_NAVEGACAO: { tecla: string; href: string; rotulo: string }[] = [
  { tecla: 'h', href: '/home', rotulo: 'Ir para a Home' },
  { tecla: 'i', href: '/inicio', rotulo: 'Ir para Minhas tarefas' },
  { tecla: 'a', href: '/agenda', rotulo: 'Ir para a Agenda' },
  { tecla: 'c', href: '/chat', rotulo: 'Ir para o Chat' },
  { tecla: 'd', href: '/painel-de-gestao', rotulo: 'Ir para o Painel de Gestão' },
]

export const rotaDoAtalho = (tecla: string): string | null => ATALHOS_DE_NAVEGACAO.find((a) => a.tecla === tecla.toLowerCase())?.href ?? null

/** Quem está digitando (campo, área de texto, seleção ou editor) não dispara atalho de tecla solta. */
export const ehCampoDeTexto = (alvo: { tagName?: string; isContentEditable?: boolean } | null): boolean =>
  !!alvo && (alvo.isContentEditable === true || ['INPUT', 'TEXTAREA', 'SELECT'].includes((alvo.tagName ?? '').toUpperCase()))
