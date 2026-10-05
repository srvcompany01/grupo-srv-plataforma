'use client'

import { useActionState, useEffect, useRef } from 'react'
import { acaoCriarCliente } from '@/app/admin/(protegido)/acoes'
import { botaoPrimario, campo } from '@/lib/ui'

export function FormNovoCliente() {
  const [estado, acao, enviando] = useActionState(acaoCriarCliente, null)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (estado && 'ok' in estado) ref.current?.reset()
  }, [estado])
  return (
    <form ref={ref} action={acao} className="flex flex-col gap-2 sm:flex-row">
      <input name="nome" placeholder="Nome do cliente" required className={campo} />
      <button disabled={enviando} className={`${botaoPrimario} shrink-0`}>
        Novo cliente
      </button>
      {estado && 'erro' in estado && <p className="text-sm text-rose-700">{estado.erro}</p>}
    </form>
  )
}
