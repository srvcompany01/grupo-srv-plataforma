import type { NivelCalendario } from './filtros'
import type { TarefaResumo } from './tarefas'

/** Subtarefa = tem tarefa-mãe. */
export const ehSubtarefa = (t: Pick<TarefaResumo, 'paiId'>) => t.paiId !== null

/** Aplica a escolha do calendário. Com "ambas" as mães vêm antes das subtarefas no mesmo dia (para a entrega aparecer primeiro). */
export function tarefasDoCalendario<T extends Pick<TarefaResumo, 'paiId'>>(tarefas: T[], niveis: NivelCalendario): T[] {
  if (niveis === 'maes') return tarefas.filter((t) => !ehSubtarefa(t))
  if (niveis === 'subtarefas') return tarefas.filter(ehSubtarefa)
  return [...tarefas.filter((t) => !ehSubtarefa(t)), ...tarefas.filter(ehSubtarefa)]
}
