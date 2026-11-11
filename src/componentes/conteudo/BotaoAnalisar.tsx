'use client'

import { Sparkles } from 'lucide-react'
import { useTransition } from 'react'
import { analisarPostAcao } from '@/app/(app)/agendamentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'

export function BotaoAnalisar({ id, refazer }: { id: string; refazer: boolean }) {
  const [pendente, iniciar] = useTransition()
  return (
    <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await analisarPostAcao(id), true) })}>
      <Sparkles /> {pendente ? 'Assistindo o post…' : refazer ? 'Refazer análise' : 'Analisar com IA'}
    </button>
  )
}
