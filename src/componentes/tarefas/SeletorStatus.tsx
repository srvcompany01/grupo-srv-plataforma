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
        aria-label={`Status: ${atual?.nome ?? ''}`}
        className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-rotulo font-medium hover:bg-hover"
      >
        <IconeStatus info={iconeDoStatus(opcoes, statusId)} cor={atual?.cor ?? '#87909e'} />
        {comNome && <span>{atual?.nome ?? '—'}</span>}
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
