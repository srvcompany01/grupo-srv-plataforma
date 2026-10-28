'use client'

import { useTransition } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
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
        className={comNome ? 'inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded px-2 text-[12px] font-medium' : 'flex h-[14px] w-[14px] items-center justify-center rounded-full p-0'}
        style={comNome ? { background: `color-mix(in srgb, ${atual?.cor ?? '#8b8b94'} 16%, transparent)` } : { border: `2px solid ${atual?.cor ?? '#8b8b94'}`, background: atual?.categoria === 'done' ? (atual?.cor ?? '#8b8b94') : 'transparent' }}
      >
        {comNome && <><span style={{ width: 6, height: 6, borderRadius: '50%', background: atual?.cor ?? '#8b8b94' }} /><span>{atual?.nome ?? '—'}</span></>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {opcoes.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onSelect={() => s.id !== statusId && iniciar(async () => void avisar(await atualizarTarefaAcao(tarefaId, { statusId: s.id })))}
          >
            <IconeStatus info={iconeDoStatus(opcoes, s.id)} cor={s.cor} className="h-3.5 w-3.5" />
            {s.nome}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
