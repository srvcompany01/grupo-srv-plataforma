'use client'

import { useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { configurarProjetosAcao } from './acoes'

export function BotaoConfigurar() {
  const [pendente, iniciar] = useTransition()
  return (
    <button type="button" disabled={pendente} onClick={() => iniciar(async () => void avisar(await configurarProjetosAcao(), true))}>
      {pendente ? 'Configurando…' : 'Configurar Projetos'}
    </button>
  )
}
