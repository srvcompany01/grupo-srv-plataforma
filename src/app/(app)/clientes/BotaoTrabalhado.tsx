'use client'

import { Check } from 'lucide-react'
import { useOptimistic, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { marcarTrabalhadoHojeAcao } from './acoes'

/** Botão pequeno do cartão: "já trabalhei neste cliente hoje". Zera à meia-noite (a marca vale só para o dia). */
export function BotaoTrabalhado({ clienteId, nome, marcado }: { clienteId: string; nome: string; marcado: boolean }) {
  const [exibido, definir] = useOptimistic(marcado)
  const [, iniciar] = useTransition()
  return (
    <button
      type="button"
      aria-pressed={exibido}
      aria-label={exibido ? `Tirar a marca de hoje em ${nome}` : `Marcar que trabalhei hoje em ${nome}`}
      title={exibido ? 'Você já trabalhou neste cliente hoje (clique para desmarcar)' : 'Marcar: já trabalhei neste cliente hoje'}
      // Não deixa o clique virar arraste do cartão nem abrir o cliente.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => iniciar(async () => {
        definir(!exibido)
        avisar(await marcarTrabalhadoHojeAcao(clienteId, !exibido))
      })}
    >
      <Check strokeWidth={3} />
    </button>
  )
}
