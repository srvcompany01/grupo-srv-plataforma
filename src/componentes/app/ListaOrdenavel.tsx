'use client'

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useId, useRef, useState, type ReactNode } from 'react'
import { escreverOrdem, ordenarItens } from '@/dominio/tema-lateral'

function gravarCookie(chave: string, valor: string) {
  document.cookie = `${chave}=${valor}; path=/; max-age=31536000; samesite=lax`
}

type ItemOrdenavel = { id: string; no: ReactNode }

function Linha({ id, children, suprimirClique }: { id: string; children: ReactNode; suprimirClique: () => boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      tabIndex={-1}
      role="presentation"
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // Soltar depois de arrastar não pode abrir o link por baixo.
      onClickCapture={(e) => {
        if (suprimirClique()) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      className={isDragging ? 'relative z-10 cursor-grabbing opacity-80' : undefined}
    >
      {children}
    </div>
  )
}

/** Atalhos que a pessoa reorganiza segurando e arrastando. A ordem fica gravada no navegador (cookie) e vale na próxima visita. */
export function ListaOrdenavel({ itens, ordemInicial, cookie, className }: { itens: ItemOrdenavel[]; ordemInicial: string[]; cookie: string; className?: string }) {
  const idContexto = useId()
  const [ordem, setOrdem] = useState(ordemInicial)
  const acabou = useRef(false)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const exibidos = ordenarItens(itens, ordem)

  const soltar = ({ active, over }: DragEndEvent) => {
    acabou.current = true
    setTimeout(() => { acabou.current = false }, 250)
    if (!over || active.id === over.id) return
    const ids = exibidos.map((i) => i.id)
    const proxima = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    setOrdem(proxima)
    gravarCookie(cookie, escreverOrdem(proxima))
  }

  return (
    <DndContext id={idContexto} sensors={sensores} collisionDetection={closestCenter} onDragEnd={soltar}>
      <SortableContext items={exibidos.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {exibidos.map((i) => (
            <Linha key={i.id} id={i.id} suprimirClique={() => acabou.current}>{i.no}</Linha>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
