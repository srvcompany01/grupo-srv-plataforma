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
        className={comNome ? 'inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded px-2 text-[12px] font-medium' : 'flex h-5 w-5 items-center justify-center rounded-md p-0'}
        style={comNome ? { background: `color-mix(in srgb, ${atual?.cor ?? '#8b8b94'} 16%, transparent)` } : undefined}
      >
        {comNome ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: atual?.cor ?? '#8b8b94' }} /><span>{atual?.nome ?? '—'}</span></> : <IconeStatus info={iconeDoStatus(opcoes, statusId)} cor={atual?.cor ?? '#8b8b94'} className="h-4 w-4" tracejado={false} />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {opcoes.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onSelect={() => s.id !== statusId && iniciar(async () => void avisar(await atualizarTarefaAcao(tarefaId, { statusId: s.id })))}
          >
            <span aria-hidden="true" className="shrink-0" style={{ width: 12, height: 12, borderRadius: '50%', background: s.cor }} />
            <span className="min-w-0 flex-1 truncate">{s.nome}</span>
            {s.id === statusId && <Ic n="check" s={18} className="text-texto-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
