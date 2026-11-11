'use client'

import { useTransition, type ReactNode } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'

export function BotaoConfirmar({
  acao,
  pergunta,
  children,
}: {
  acao: () => Promise<void>
  pergunta?: string
  children: ReactNode
}) {
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  return (
    <button
      type="button"
      disabled={pendente}
      onClick={async () => {
        if (pergunta && !(await confirmar({ titulo: pergunta, perigo: true }))) return
        iniciar(() => acao())
      }}
    >
      {children}
    </button>
  )
}
