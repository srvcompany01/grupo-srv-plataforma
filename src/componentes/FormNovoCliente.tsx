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
    <form ref={ref} action={acao}>
      <Icone nome="mais" />
      <input
        name="nome"
        placeholder="Novo cliente — digite o nome e tecle Enter"
        required
        disabled={enviando}
      />
      {estado && 'erro' in estado && <span>{estado.erro}</span>}
    </form>
  )
}
