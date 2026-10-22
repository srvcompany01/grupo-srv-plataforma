'use client'

import { useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoPrimario } from '@/lib/ui'
import { configurarProjetosAcao } from './acoes'

export function BotaoConfigurar() {
  const [pendente, iniciar] = useTransition()
  return (
    <button type="button" className={botaoPrimario} disabled={pendente} onClick={() => iniciar(async () => void avisar(await configurarProjetosAcao(), true))}>
      {pendente ? 'Configurando…' : 'Configurar Projetos'}
    </button>
  )
}
