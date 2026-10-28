'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ehCampoDeTexto, rotaDoAtalho } from '@/dominio/paleta'

export const EVENTO_ALTERNAR_BARRA = 'srv:alternar-barra'
export const EVENTO_ABRIR_ATALHOS = 'srv:abrir-atalhos'
export const EVENTO_ABRIR_PALETA = 'srv:abrir-paleta'

/** Teclado global: ⌘/Ctrl+K paleta, ⌘/Ctrl+\ barra de espaços, "?" lista de atalhos e H/I/A/C/D para navegar (só fora de campos de texto). */
export function AtalhosGlobais({ aoAbrirPaleta, aoAbrirAjuda }: { aoAbrirPaleta: () => void; aoAbrirAjuda: () => void }) {
  const router = useRouter()
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const comando = e.metaKey || e.ctrlKey
      if (comando && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        aoAbrirPaleta()
        return
      }
      if (comando && e.key === '\\') {
        e.preventDefault()
        window.dispatchEvent(new Event(EVENTO_ALTERNAR_BARRA))
        return
      }
      if (comando || e.altKey || ehCampoDeTexto(e.target as HTMLElement | null) || document.querySelector('[role="dialog"]')) return
      if (e.key === '?') {
        e.preventDefault()
        aoAbrirAjuda()
        return
      }
      const rota = rotaDoAtalho(e.key)
      if (rota) {
        e.preventDefault()
        router.push(rota)
      }
    }
    const abrirAjuda = () => aoAbrirAjuda()
    const abrirPaleta = () => aoAbrirPaleta()
    window.addEventListener(EVENTO_ABRIR_PALETA, abrirPaleta)
    window.addEventListener('keydown', aoTeclar)
    window.addEventListener(EVENTO_ABRIR_ATALHOS, abrirAjuda)
    return () => { window.removeEventListener(EVENTO_ABRIR_PALETA, abrirPaleta); window.removeEventListener('keydown', aoTeclar); window.removeEventListener(EVENTO_ABRIR_ATALHOS, abrirAjuda) }
  }, [aoAbrirPaleta, aoAbrirAjuda, router])
  return null
}
