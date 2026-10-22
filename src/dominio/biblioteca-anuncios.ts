/**
 * Biblioteca de Anúncios do Meta (pública). Guardamos só o ID da página do cliente e montamos o link dos anúncios
 * ativos dela. A API oficial da biblioteca não devolve anúncios comerciais do Brasil (só políticos/sociais), e a página
 * não pode ser embutida (o Facebook bloqueia iframe), por isso o link abre numa aba nova.
 */

/** Aceita o ID numérico ou um link da biblioteca/página com `view_all_page_id=` ou `id=`. Vazio = tirar. */
export function lerPaginaMeta(bruto: string): { id: string | null } | { erro: string } {
  const texto = bruto.trim()
  if (!texto) return { id: null }
  if (/^\d{5,25}$/.test(texto)) return { id: texto }
  const doLink = texto.match(/[?&](?:view_all_page_id|id)=(\d{5,25})\b/)
  if (doLink) return { id: doLink[1] }
  return { erro: 'Cole o link da Biblioteca de Anúncios do cliente (com view_all_page_id=...) ou o ID numérico da página do Facebook.' }
}

/** Anúncios ativos da página, de todos os países e tipos. */
export const urlBibliotecaAnuncios = (paginaId: string) =>
  `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&media_type=all&view_all_page_id=${paginaId}`
