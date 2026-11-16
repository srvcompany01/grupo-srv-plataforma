import type { Navegacao, NoEspaco } from './arvore-espacos'

/** Espaço › pasta › lista em forma simples para as caixas de seleção do destino do vídeo. */
export type EspacoParaDestino = { id: string; nome: string; pastas: { id: string; nome: string; listas: { id: string; nome: string }[] }[]; listas: { id: string; nome: string }[] }

/**
 * Só entram as listas de conteúdo (`idsDeConteudo`), que é onde a subtarefa vira post. Sub-áreas viram espaços com o nome "Área › Sub-área".
 * Espaços e pastas sem nenhuma lista de conteúdo ficam de fora.
 */
export function arvoreParaDestino(nav: Navegacao, idsDeConteudo: Set<string>): EspacoParaDestino[] {
  const so = (ls: { id: string; nome: string }[]) => ls.filter((l) => idsDeConteudo.has(l.id)).map((l) => ({ id: l.id, nome: l.nome }))
  const pastas = (ps: { id: string; nome: string; listas: { id: string; nome: string }[] }[]) => ps.map((p) => ({ id: p.id, nome: p.nome, listas: so(p.listas) })).filter((p) => p.listas.length)
  const achatar = (e: NoEspaco, caminho: string): EspacoParaDestino[] => {
    const nome = caminho ? `${caminho} › ${e.nome}` : e.nome
    return [{ id: e.id, nome, pastas: pastas(e.pastas), listas: so(e.listas) }, ...e.filhos.flatMap((f) => achatar(f, nome))]
  }
  const raiz: EspacoParaDestino = { id: 'sem-espaco', nome: 'Sem espaço', pastas: pastas(nav.pastasRaiz), listas: so(nav.listasRaiz) }
  return [...nav.espacos.flatMap((e) => achatar(e, '')), raiz].filter((e) => e.pastas.length || e.listas.length)
}
