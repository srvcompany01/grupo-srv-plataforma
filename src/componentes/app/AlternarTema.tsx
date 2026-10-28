'use client'

import { Ic } from './Ic'
import { useEffect, useState } from 'react'
import type { ModoTema } from '@/dominio/tema-lateral'
import { alternarTemaGlobal, EVENTO_TEMA } from './tema-cliente'

/** Botão sol/lua: troca claro e escuro na hora e lembra a escolha. Claro é o padrão. Acompanha trocas feitas por outros lugares (paleta ⌘K). */
export function AlternarTema({ inicial, className = '', comRotulo = false, estilo }: { inicial: ModoTema; className?: string; comRotulo?: boolean; estilo?: React.CSSProperties }) {
  const [modo, setModo] = useState<ModoTema>(inicial)
  useEffect(() => {
    const ouvir = (e: Event) => setModo((e as CustomEvent<ModoTema>).detail)
    window.addEventListener(EVENTO_TEMA, ouvir)
    return () => window.removeEventListener(EVENTO_TEMA, ouvir)
  }, [])
  const icone = modo === 'escuro' ? 'light_mode' : 'dark_mode'
  const rotulo = modo === 'escuro' ? 'Tema claro' : 'Tema escuro'
  return (
    <button type="button" onClick={() => alternarTemaGlobal()} title={rotulo} aria-label={rotulo} className={className} style={estilo}>
      <Ic n={icone} s={18} />
      {comRotulo && <span>{rotulo}</span>}
    </button>
  )
}
