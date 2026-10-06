'use client'

import { Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { criarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'

/** Criação rápida: título + Enter. Responsável inicial é quem criou. */
export function NovaTarefa({ listaId, statusId, euId, paiId }: { listaId: string; statusId?: string; euId: string; paiId?: string }) {
  const [aberta, setAberta] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [pendente, iniciar] = useTransition()

  if (!aberta) {
    return (
      <button onClick={() => setAberta(true)} className="flex h-9 w-full items-center gap-1.5 border-t border-borda px-10 text-[12px] font-medium text-texto-3 transition hover:bg-hover/70 hover:text-texto">
        <Plus className="h-3.5 w-3.5" /> {paiId ? 'Nova subtarefa' : 'Nova tarefa'}
      </button>
    )
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          if (avisar(await criarTarefaAcao({ listaId, titulo, responsaveis: [euId], statusId, paiId }))) setTitulo('')
        })
      }}
      className="flex h-9 items-center gap-2 border-t border-borda px-9"
    >
      <input
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setAberta(false)}
        onBlur={() => !titulo && setAberta(false)}
        disabled={pendente}
        placeholder="Nome da tarefa (Enter para salvar, Esc para cancelar)"
        className="flex-1 bg-transparent text-[13px] outline-none"
      />
    </form>
  )
}
