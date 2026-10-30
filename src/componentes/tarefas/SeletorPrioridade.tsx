'use client'

import { useTransition } from 'react'
import { atualizarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { Ic } from '@/componentes/app/Ic'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { PRIORIDADES, ROTULO_PRIORIDADE, type Prioridade } from '@/dominio/tarefas'
import { avisar } from './avisar'

export const COR_PRIORIDADE: Record<Prioridade, string> = { urgente: '#d80d12', alta: '#e08a00', normal: '#1d6fe0', baixa: '#8b8b94' }

/** Prioridade da tarefa: bandeira colorida + nome; ao clicar abre a lista no padrão dos campos (título, opções com bandeira, visto). */
export function SeletorPrioridade({ tarefaId, prioridade, className = '' }: { tarefaId: string; prioridade: Prioridade; className?: string }) {
  const [pendente, iniciar] = useTransition()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={pendente} aria-label={`Prioridade: ${ROTULO_PRIORIDADE[prioridade]}`} className={`flex h-7 items-center gap-1.5 rounded px-1.5 text-[13px] text-texto-2 outline-none hover:bg-[var(--bg-hover)] ${className}`}>
        <Ic n="flag" s={15} fill style={{ color: COR_PRIORIDADE[prioridade] }} />{ROTULO_PRIORIDADE[prioridade]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel>Prioridade</DropdownMenuLabel>
        {PRIORIDADES.map((p) => (
          <DropdownMenuItem key={p} onSelect={() => p !== prioridade && iniciar(async () => void avisar(await atualizarTarefaAcao(tarefaId, { prioridade: p })))}>
            <Ic n="flag" s={16} fill style={{ color: COR_PRIORIDADE[p] }} />
            <span className="min-w-0 flex-1 truncate">{ROTULO_PRIORIDADE[p]}</span>
            {p === prioridade && <Ic n="check" s={18} className="text-texto-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
