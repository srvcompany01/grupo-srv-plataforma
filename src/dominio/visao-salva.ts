import { escreverFiltros, lerFiltros, type Filtros } from './filtros'

type Params = Record<string, string | string[] | undefined>

/** Chaves da URL que descrevem a visualização de uma lista. `ed` marca "o usuário mexeu" (mesmo que volte ao padrão). */
const CHAVES_VISAO = ['resp', 'status', 'prio', 'tag', 'cliente', 'prazo', 'mes', 'busca', 'visao', 'grupo', 'niveis', 'ed'] as const

/** URL "limpa" = ninguém escolheu nada: abre a visualização salva (ou o original). */
export const temParametrosDeVisao = (sp: Params): boolean => CHAVES_VISAO.some((chave) => sp[chave] !== undefined)

/** Forma canônica (texto) da visualização: ignora lixo, ordem e o marcador `ed`. Vazio = visualização original. */
export function normalizarVisao(origem: string | Params): string {
  const sp: Params = typeof origem === 'string' ? Object.fromEntries(new URLSearchParams(origem)) : origem
  return escreverFiltros(lerFiltros(sp)).toString()
}

/** Endereço de uma visualização. No padrão leva `?ed=1`, senão a URL limpa reabriria a visualização salva. */
export function enderecoDaVisao(caminho: string, filtros: Filtros): string {
  const qs = escreverFiltros(filtros).toString()
  return `${caminho}?${qs || 'ed=1'}`
}

/** Visualização efetiva da tela e se ela difere da salva (ou do original, se não houver salva). */
export function resolverVisao(sp: Params, salva: string | null): { spEfetivo: Params; alterada: boolean; atual: string } {
  const limpa = !temParametrosDeVisao(sp)
  const spEfetivo: Params = limpa && salva ? Object.fromEntries(new URLSearchParams(salva)) : sp
  const atual = normalizarVisao(spEfetivo)
  return { spEfetivo, atual, alterada: atual !== (salva ?? '') }
}
