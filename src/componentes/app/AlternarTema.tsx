'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ModoTema } from '@/dominio/tema-lateral'
import { alternarTemaGlobal, EVENTO_TEMA } from './tema-cliente'

/** Botão sol/lua: troca claro e escuro na hora e lembra a escolha. Claro é o padrão. Acompanha trocas feitas por outros lugares (paleta ⌘K). */
export function AlternarTema({ inicial, className = '', comRotulo = false }: { inicial: ModoTema; className?: string; comRotulo?: boolean }) {
  const [modo, setModo] = useState<ModoTema>(inicial)
  useEffect(() => {
    const ouvir = (e: Event) => setModo((e as CustomEvent<ModoTema>).detail)
    window.addEventListener(EVENTO_TEMA, ouvir)
    return () => window.removeEventListener(EVENTO_TEMA, ouvir)
  }, [])
  const Icone = modo === 'escuro' ? Sun : Moon
  const rotulo = modo === 'escuro' ? 'Tema claro' : 'Tema escuro'
  return (
    <button type="button" onClick={() => alternarTemaGlobal()} title={rotulo} aria-label={rotulo} className={className}>
      <Icone className="h-5 w-5" aria-hidden="true" />
      {comRotulo && <span>{rotulo}</span>}
    </button>
  )
}
