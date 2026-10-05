'use client'

import { useTransition, type ReactNode } from 'react'
import { botaoSecundario } from '@/lib/ui'

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
  return (
    <button
      type="button"
      disabled={pendente}
      className={botaoSecundario}
      onClick={() => {
        if (pergunta && !window.confirm(pergunta)) return
        iniciar(() => acao())
      }}
    >
      {children}
    </button>
  )
}
