'use client'

import { useState } from 'react'
import { botaoFantasma } from '@/lib/ui'
import { Icone } from './Icone'

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
    <button type="button" onClick={copiar} className={`${botaoFantasma} ${copiado ? 'text-st-aprovado' : ''}`}>
      <Icone nome={copiado ? 'check' : 'link'} className="h-3.5 w-3.5" />
      {copiado ? (
        'Copiado'
      ) : (
        <>
          <span className="sm:hidden">Copiar link</span>
          <span className="hidden sm:inline">Copiar mensagem com link</span>
        </>
      )}
    </button>
  )
}
