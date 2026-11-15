'use client'

import { Repeat } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/componentes/ui/tooltip'
import type { TarefaResumo } from '@/dominio/tarefas'

/** Ícone "Repetir" das visões (lista, kanban): modelo de uma série ou cópia criada por ela. Pausada fica em aviso. */
export function IndicadorRecorrencia({ recorrencia }: { recorrencia: TarefaResumo['recorrencia'] }) {
  if (!recorrencia) return null
  const pausada = recorrencia.tipo === 'modelo' && !recorrencia.ativa
  const texto = pausada ? 'Repetição pausada' : recorrencia.tipo === 'modelo' ? `Repete: ${recorrencia.resumo.toLowerCase()}` : 'Parte de uma série de tarefas repetidas'
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span role="img" aria-label="Tarefa recorrente" className={`inline-flex shrink-0 ${pausada ? 'text-aviso-forte' : 'text-texto-3'}`}>
            <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{texto}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
