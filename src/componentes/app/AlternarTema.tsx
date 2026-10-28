'use client'

import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { COOKIE_TEMA, type ModoTema } from '@/dominio/tema-lateral'

/** Botão sol/lua: troca claro e escuro na hora (atributo `data-tema` na área logada) e lembra a escolha em cookie. Claro é o padrão. */
export function AlternarTema({ inicial, className = '', comRotulo = false }: { inicial: ModoTema; className?: string; comRotulo?: boolean }) {
  const [modo, setModo] = useState<ModoTema>(inicial)
  const alternar = () => {
    const novo: ModoTema = modo === 'escuro' ? 'claro' : 'escuro'
    setModo(novo)
    document.querySelector('.app-ui')?.setAttribute('data-tema', novo)
    document.cookie = `${COOKIE_TEMA}=${novo}; path=/; max-age=31536000; samesite=lax`
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', novo === 'escuro' ? '#0e0e10' : '#ffffff')
  }
  const Icone = modo === 'escuro' ? Sun : Moon
  const rotulo = modo === 'escuro' ? 'Tema claro' : 'Tema escuro'
  return (
    <button type="button" onClick={alternar} title={rotulo} aria-label={rotulo} className={className}>
      <Icone className="h-5 w-5" aria-hidden="true" />
      {comRotulo && <span>{rotulo}</span>}
    </button>
  )
}
