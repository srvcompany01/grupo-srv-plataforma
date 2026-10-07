'use client'

import { Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { criarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'

/** Criação rápida: título + Enter. Responsável inicial é quem criou. */
export function NovaTarefa({
  listaId,
  statusId,
  euId,
  paiId,
  abertaInicial = false,
  recuo,
  onFechar,
  onCriada,
}: {
  listaId: string
  statusId?: string
  euId: string
  paiId?: string
  abertaInicial?: boolean
  recuo?: number
  onFechar?: () => void
  onCriada?: () => void
}) {
  const [aberta, setAberta] = useState(abertaInicial)
  const [titulo, setTitulo] = useState('')
  const [pendente, iniciar] = useTransition()
  const fechar = () => {
    setAberta(false)
    onFechar?.()
  }

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
          if (!avisar(await criarTarefaAcao({ listaId, titulo, responsaveis: [euId], statusId, paiId }))) return
          setTitulo('')
          onCriada?.()
        })
      }}
      className="flex h-9 items-center gap-2 border-t border-borda px-9"
      style={recuo === undefined ? undefined : { paddingLeft: recuo }}
    >
      <input
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && fechar()}
        onBlur={() => !titulo && fechar()}
        disabled={pendente}
        placeholder={`${paiId ? 'Nome da subtarefa' : 'Nome da tarefa'} (Enter para salvar, Esc para cancelar)`}
        className="flex-1 bg-transparent text-[13px] outline-none"
      />
    </form>
  )
}
