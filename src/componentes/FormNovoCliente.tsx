'use client'

import { useActionState, useEffect, useRef } from 'react'
import { acaoCriarCliente } from '@/app/admin/(protegido)/acoes'
import { Icone } from './Icone'

/** Linha "+ Novo cliente" no fim da lista, como o "+ Add task" do ClickUp. */
export function FormNovoCliente() {
  const [estado, acao, enviando] = useActionState(acaoCriarCliente, null)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (estado && 'ok' in estado) ref.current?.reset()
  }, [estado])
  return (
    <form ref={ref} action={acao} className="flex items-center gap-2 px-4 py-2">
      <Icone nome="mais" className="h-4 w-4 shrink-0 text-texto-3" />
      <input
        name="nome"
        placeholder="Novo cliente — digite o nome e tecle Enter"
        required
        disabled={enviando}
        className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-texto-3"
      />
      {estado && 'erro' in estado && <span className="text-xs text-perigo">{estado.erro}</span>}
    </form>
  )
}
