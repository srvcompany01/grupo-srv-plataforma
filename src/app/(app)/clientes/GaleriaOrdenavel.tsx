'use client'

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { ordenarGaleriaAcao } from './acoes'

type Item = { id: string; no: ReactNode }

function Cartao({ id, children, suprimirClique }: { id: string; children: ReactNode; suprimirClique: () => boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      tabIndex={-1}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // Soltar depois de arrastar não pode abrir o cliente.
      onClickCapture={(e) => {
        if (suprimirClique()) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      className={isDragging ? 'relative z-10 cursor-grabbing opacity-80 shadow-lg' : undefined}
    >
      {children}
    </li>
  )
}

/** Galeria em que admin/gestor reorganizam os clientes segurando e arrastando; a ordem vale para toda a equipe. */
export function GaleriaOrdenavel({ itens, podeOrdenar, hoje }: { itens: Item[]; podeOrdenar: boolean; hoje: string }) {
  const idContexto = useId()
  const router = useRouter()
  const [ordem, setOrdem] = useState(itens.map((i) => i.id))
  const [, iniciar] = useTransition()
  const acabou = useRef(false)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const porId = new Map(itens.map((i) => [i.id, i]))
  // Cliente novo (criado depois do arrasto) entra no fim; o que sumiu é ignorado.
  const ids = [...ordem.filter((id) => porId.has(id)), ...itens.map((i) => i.id).filter((id) => !ordem.includes(id))]
  // Aba deixada aberta de um dia para o outro: ao voltar a ela depois da meia-noite, recarrega para as marcas de "hoje" zerarem.
  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === 'visible' && new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Belem' }).format(new Date()) !== hoje) router.refresh()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('focus', aoVoltar)
    return () => {
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('focus', aoVoltar)
    }
  }, [hoje, router])
  const classe = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'

  if (!podeOrdenar) {
    return <ul className={classe}>{itens.map((i) => <li key={i.id}>{i.no}</li>)}</ul>
  }

  const soltar = ({ active, over }: DragEndEvent) => {
    acabou.current = true
    setTimeout(() => { acabou.current = false }, 250)
    if (!over || active.id === over.id) return
    const proxima = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    const anterior = ids
    setOrdem(proxima)
    iniciar(async () => {
      if (!avisar(await ordenarGaleriaAcao(proxima))) setOrdem(anterior)
    })
  }

  return (
    <DndContext id={idContexto} sensors={sensores} collisionDetection={closestCenter} onDragEnd={soltar}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className={classe}>
          {ids.map((id) => (
            <Cartao key={id} id={id} suprimirClique={() => acabou.current}>{porId.get(id)!.no}</Cartao>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
