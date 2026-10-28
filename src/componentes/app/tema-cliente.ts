import { COOKIE_TEMA, type ModoTema } from '@/dominio/tema-lateral'

export const EVENTO_TEMA = 'srv:tema'

/** Troca claro/escuro na hora (atributo `data-tema` na área logada), lembra em cookie e avisa quem mostra o estado (botão sol/lua). */
export function alternarTemaGlobal(): ModoTema {
  const raiz = document.querySelector('.app-ui')
  const novo: ModoTema = raiz?.getAttribute('data-tema') === 'escuro' ? 'claro' : 'escuro'
  raiz?.setAttribute('data-tema', novo)
  document.cookie = `${COOKIE_TEMA}=${novo}; path=/; max-age=31536000; samesite=lax`
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', novo === 'escuro' ? '#0e0e10' : '#ffffff')
  window.dispatchEvent(new CustomEvent(EVENTO_TEMA, { detail: novo }))
  return novo
}
