'use client'

import { useTransition } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import type { StatusLista } from '@/dominio/tarefas'
import { atualizarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'

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
        className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-[12px] font-medium hover:bg-hover"
      >
        <span className="h-3 w-3 shrink-0 rounded-full border-2" style={{ borderColor: atual?.cor ?? '#87909e', background: atual?.categoria === 'done' ? atual.cor : 'transparent' }} />
        {comNome && <span>{atual?.nome ?? '—'}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {opcoes.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onSelect={() => s.id !== statusId && iniciar(async () => void avisar(await atualizarTarefaAcao(tarefaId, { statusId: s.id })))}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.cor }} />
            {s.nome}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
