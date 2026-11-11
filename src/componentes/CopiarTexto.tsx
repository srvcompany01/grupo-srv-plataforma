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
    >
      <Icone nome={copiado ? 'check' : 'copiar'} />
      {copiado ? 'Copiado' : rotulo}
    </button>
  )
}
