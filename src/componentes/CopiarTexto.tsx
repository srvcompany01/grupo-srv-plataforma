'use client'

import { useState } from 'react'
import { Icone } from './Icone'

export function CopiarTexto({ texto, rotulo = 'Copiar' }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copie o texto:', texto)
    }
  }
  return (
    <button
      type="button"
      onClick={copiar}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition ${
        copiado ? 'text-st-aprovado' : 'text-texto-2 hover:bg-hover hover:text-marca'
      }`}
    >
      <Icone nome={copiado ? 'check' : 'copiar'} className="h-3 w-3" />
      {copiado ? 'Copiado' : rotulo}
    </button>
  )
}
