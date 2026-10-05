'use client'

import { useState } from 'react'
import { botaoSecundario } from '@/lib/ui'

export function CopiarLink({ nome, url }: { nome: string; url: string }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    const texto = `Olá, ${nome}! Seus conteúdos para aprovação estão aqui: ${url}`
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copie a mensagem:', texto)
    }
  }
  return (
    <button type="button" onClick={copiar} className={botaoSecundario}>
      {copiado ? 'Copiado ✓' : 'Copiar mensagem com link'}
    </button>
  )
}
