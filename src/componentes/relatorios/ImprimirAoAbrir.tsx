'use client'

import { useEffect } from 'react'

/** Abre a janela de impressão (Salvar como PDF) assim que o relatório carrega; só com ?imprimir=1. */
export function ImprimirAoAbrir() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600)
    return () => clearTimeout(t)
  }, [])
  return null
}
