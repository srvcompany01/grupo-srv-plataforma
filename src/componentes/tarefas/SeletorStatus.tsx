'use client'

import { useTransition } from 'react'
import { Ic } from '@/componentes/app/Ic'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { iconeDoStatus } from '@/dominio/status-icone'
import type { StatusLista } from '@/dominio/tarefas'
import { atualizarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'
import { IconeStatus } from './IconeStatus'

export function SeletorStatus({
  tarefaId,
  statusId,
  opcoes,
  comNome = false,
}: {
  tarefaId: string
  statusId: string
  opcoes: StatusLista[]
  comNome?: boolean
}) {
  const [pendente, iniciar] = useTransition()
  const atual = opcoes.find((s) => s.id === statusId)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pendente || opcoes.length === 0}
        data-redondo={comNome ? undefined : true}
        aria-label={`Status: ${atual?.nome ?? ''}`}
        title={atual?.nome}
        style={comNome ? { background: `color-mix(in srgb, ${atual?.cor ?? '#8b8b94'} 16%, transparent)` } : undefined}
      >
        {comNome ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: atual?.cor ?? '#8b8b94' }} /><span>{atual?.nome ?? '—'}</span></> : <IconeStatus info={iconeDoStatus(opcoes, statusId)} cor={atual?.cor ?? '#8b8b94'} tracejado={false} />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {opcoes.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onSelect={() => s.id !== statusId && iniciar(async () => void avisar(await atualizarTarefaAcao(tarefaId, { statusId: s.id })))}
          >
            <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: s.cor }} />
            <span>{s.nome}</span>
            {s.id === statusId && <Ic n="check" s={18} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
