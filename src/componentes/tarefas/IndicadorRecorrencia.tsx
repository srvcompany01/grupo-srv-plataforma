'use client'

import { MessageSquare, Repeat } from 'lucide-react'
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

/** Pontos do cliente em aberto na prova visual do post (vermelho; some quando chega a 0). */
export function IndicadorProva({ abertos }: { abertos?: number }) {
  if (!abertos) return null
  const texto = `${abertos} ${abertos === 1 ? 'comentário do cliente em aberto' : 'comentários do cliente em aberto'}`
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span role="img" aria-label={texto} className="inline-flex shrink-0 items-center gap-0.5 text-legenda font-semibold tabular-nums text-[var(--red)]">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />{abertos}
          </span>
        </TooltipTrigger>
        <TooltipContent>{texto}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
