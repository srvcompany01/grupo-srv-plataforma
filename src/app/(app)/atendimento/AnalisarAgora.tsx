'use client'

import { Sparkles } from 'lucide-react'
import { useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoSecundario } from '@/lib/ui'
import { analisarConversasAcao } from './acoes'

export function AnalisarAgora({ clienteId }: { clienteId: string }) {
  const [pendente, iniciar] = useTransition()
  return (
    <button type="button" disabled={pendente} className={botaoSecundario} onClick={() => iniciar(async () => { avisar(await analisarConversasAcao(clienteId), true) })}>
      <Sparkles className="h-4 w-4" /> {pendente ? 'A IA está lendo as conversas…' : 'Analisar conversas recentes'}
    </button>
  )
}
