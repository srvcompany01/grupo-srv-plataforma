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
      <button onClick={() => setAberta(true)} style={{ paddingLeft: recuo ?? 50 }}>
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
      />
      <button disabled={pendente || !titulo.trim()} style={{ padding: '0 12px' }}>Salvar</button>
    </form>
  )
}
