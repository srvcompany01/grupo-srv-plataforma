'use client'

import { useTransition, type ReactNode } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { botaoFantasma } from '@/lib/ui'

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
      className={botaoFantasma}
      onClick={async () => {
        if (pergunta && !(await confirmar({ titulo: pergunta, perigo: true }))) return
        iniciar(() => acao())
      }}
    >
      {children}
    </button>
  )
}
