'use client'

import { Ic } from '@/componentes/app/Ic'
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
      <button onClick={() => setAberta(true)} className="flex h-8 w-full items-center gap-2 border-0 bg-transparent text-left text-[13px] text-texto-3 transition-colors hover:bg-[var(--bg-hover)] hover:text-texto-2" style={{ paddingLeft: recuo ?? 50 }}>
        <Ic n="add" s={16} /> {paiId ? 'Adicionar subtarefa' : 'Adicionar tarefa'}
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
      className="flex h-9 items-center gap-2 border-b border-[var(--border-soft)] pr-2"
      style={{ paddingLeft: recuo ?? 50 }}
    >
      <input
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && fechar()}
        onBlur={() => !titulo && fechar()}
        disabled={pendente}
        placeholder={`${paiId ? 'Nome da subtarefa' : 'Nome da tarefa'} — Enter salva, Esc cancela`}
        className="h-7 flex-1 rounded border border-[var(--focus)] bg-[var(--bg)] px-2 text-[13px] outline-none ring-3 ring-[var(--focus-ring)]"
      />
      <button disabled={pendente || !titulo.trim()} className="b-pri" style={{ padding: '0 12px' }}>Salvar</button>
    </form>
  )
}
