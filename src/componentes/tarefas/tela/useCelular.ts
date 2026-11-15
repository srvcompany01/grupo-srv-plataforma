import { useSyncExternalStore } from 'react'

const CONSULTA = '(max-width: 767px)'

function assinar(aviso: () => void) {
  const m = window.matchMedia(CONSULTA)
  m.addEventListener('change', aviso)
  return () => m.removeEventListener('change', aviso)
}

/** Verdadeiro abaixo de 768px (o servidor assume desktop). */
export function useCelular(): boolean {
  return useSyncExternalStore(assinar, () => window.matchMedia(CONSULTA).matches, () => false)
}
