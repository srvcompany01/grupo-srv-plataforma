'use client'

import { useTransition } from 'react'
import { Ic } from '@/componentes/app/Ic'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
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
        data-redondo={comNome ? undefined : true}
        aria-label={`Status: ${atual?.nome ?? ''}`}
        title={atual?.nome}
      >
        {comNome ? <span className="selo-status" data-pendente={atual?.categoria === 'todo' || undefined} style={{ background: atual?.categoria === 'todo' ? undefined : atual?.cor ?? '#8b8b94' }}><span aria-hidden="true" />{atual?.nome ?? '—'}</span> : <CirculoStatus opcoes={opcoes} statusId={statusId} cor={atual?.cor ?? '#8b8b94'} />}
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

/** Círculo de 14px: aro na cor do status, preenchido por dentro conforme o status avança; no último, disco com visto. */
function CirculoStatus({ opcoes, statusId, cor }: { opcoes: StatusLista[]; statusId: string; cor: string }) {
  const i = Math.max(0, opcoes.findIndex((s) => s.id === statusId))
  const ultimo = opcoes.length > 1 && i === opcoes.length - 1
  const p = opcoes.length > 1 ? (i / (opcoes.length - 1)) * 100 : 0
  return (
    <span className="circulo-status" style={{ '--c': cor, '--p': `${p}%` } as React.CSSProperties}>
      {ultimo && <span className="circulo-status-ok"><Ic n="check" s={11} w={700} /></span>}
    </span>
  )
}
