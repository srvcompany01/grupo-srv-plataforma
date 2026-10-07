'use client'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { indiceAoSoltar, posicaoAoSoltar, statusDaCategoria } from '@/dominio/kanban'
import type { Categoria, TarefaResumo } from '@/dominio/tarefas'
import { moverTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'
import { Prazo, type Contexto } from './LinhaTarefa'
import { Pessoas } from './Pessoas'

export type Coluna = { id: string; nome: string; cor: string }
type Itens = Record<string, TarefaResumo[]>

/**
 * modo "status": colunas são os status da lista (id da coluna = status).
 * modo "categoria": colunas são A fazer / Em andamento / Concluído; soltar leva ao primeiro status
 * daquela categoria na lista da própria tarefa (departamento mistura listas).
 */
export function VisaoKanban({
  colunas,
  tarefas,
  ctx,
  modo,
  subtarefas,
}: {
  colunas: Coluna[]
  tarefas: Itens
  ctx: Contexto
  modo: 'status' | 'categoria'
  subtarefas: Record<string, number>
}) {
  const [base, setBase] = useState(tarefas)
  const [itens, setItens] = useState(tarefas)
  // Dados novos do servidor substituem o estado otimista.
  if (base !== tarefas) {
    setBase(tarefas)
    setItens(tarefas)
  }
  const [arrastando, setArrastando] = useState<TarefaResumo | null>(null)
  const [, iniciar] = useTransition()
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const colunaDe = (id: string) => (id in itens ? id : Object.keys(itens).find((c) => itens[c].some((t) => t.id === id)))

  function inicio(e: DragStartEvent) {
    const col = colunaDe(String(e.active.id))
    setArrastando(col ? (itens[col].find((t) => t.id === e.active.id) ?? null) : null)
  }

  function fim(e: DragEndEvent) {
    setArrastando(null)
    if (!e.over) return
    const id = String(e.active.id)
    const origem = colunaDe(id)
    const destino = colunaDe(String(e.over.id))
    if (!origem || !destino) return
    const tarefa = itens[origem].find((t) => t.id === id)!
    const indice = indiceAoSoltar(itens[destino], id, String(e.over.id), origem === destino)
    if (indice === null) return
    const alvo = itens[destino].filter((t) => t.id !== id)
    const statusId = modo === 'status' ? destino : statusDaCategoria(ctx.statusPorLista[tarefa.listaId] ?? [], destino as Categoria)
    if (!statusId) return void avisar({ erro: 'A lista desta tarefa não tem status nessa coluna.' })
    let posicao: string
    try {
      posicao = posicaoAoSoltar(itens[destino], id, indice)
    } catch (erro) {
      console.error(erro)
      return void avisar({ erro: 'Não foi possível mover o cartão. Recarregue a página e tente de novo.' })
    }
    if (origem === destino && tarefa.posicao === posicao) return

    const anterior = itens
    const movida = { ...tarefa, statusId, posicao }
    const novaColuna = [...alvo.slice(0, indice), movida, ...alvo.slice(indice)]
    setItens({ ...itens, [origem]: itens[origem].filter((t) => t.id !== id), [destino]: novaColuna })
    iniciar(async () => {
      if (!avisar(await moverTarefaAcao(id, statusId, posicao))) setItens(anterior)
    })
  }

  return (
    <DndContext id="kanban-tarefas" sensors={sensores} collisionDetection={closestCorners} onDragStart={inicio} onDragEnd={fim} onDragCancel={() => setArrastando(null)}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {colunas.map((c) => (
          <ColunaKanban key={c.id} coluna={c} tarefas={itens[c.id] ?? []} ctx={ctx} subtarefas={subtarefas} />
        ))}
      </div>
      <DragOverlay>{arrastando && <Cartao tarefa={arrastando} ctx={ctx} subtarefas={subtarefas[arrastando.id] ?? 0} />}</DragOverlay>
    </DndContext>
  )
}

function ColunaKanban({ coluna, tarefas, ctx, subtarefas }: { coluna: Coluna; tarefas: TarefaResumo[]; ctx: Contexto; subtarefas: Record<string, number> }) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id })
  return (
    <section ref={setNodeRef} className={`flex w-72 shrink-0 flex-col rounded-xl border border-borda bg-fundo p-2.5 transition ${isOver ? 'ring-2 ring-marca/20' : ''}`}>
      <header className="mb-2.5 flex items-center gap-2 px-1">
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-white" style={{ background: coluna.cor }}>
          {coluna.nome}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-texto-3 ring-1 ring-borda">{tarefas.length}</span>
      </header>
      <SortableContext items={tarefas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-16 flex-col gap-2">
          {tarefas.map((t) => (
            <CartaoArrastavel key={t.id} tarefa={t} ctx={ctx} subtarefas={subtarefas[t.id] ?? 0} />
          ))}
        </div>
      </SortableContext>
    </section>
  )
}

function CartaoArrastavel({ tarefa, ctx, subtarefas }: { tarefa: TarefaResumo; ctx: Contexto; subtarefas: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tarefa.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? 'opacity-40' : ''} {...attributes} {...listeners}>
      <Cartao tarefa={tarefa} ctx={ctx} subtarefas={subtarefas} />
    </div>
  )
}

function Cartao({ tarefa, ctx, subtarefas }: { tarefa: TarefaResumo; ctx: Contexto; subtarefas: number }) {
  return (
    <div className="space-y-2.5 rounded-xl border border-borda bg-white p-3 text-[13px] transition hover:border-borda-forte">
      {ctx.mostrarLista && (
        <p className="truncate text-[11px] text-texto-3">
          {tarefa.listaNome} · @{tarefa.clienteNome}
        </p>
      )}
      <Link href={`/tarefas/${tarefa.id}`} scroll={false} className="block font-medium hover:text-marca">
        {tarefa.titulo}
      </Link>
      {tarefa.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tarefa.tags.map((t) => (
            <span key={t.id} className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ background: t.cor }}>
              {t.nome}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 text-[12px]">
        <Pessoas pessoas={tarefa.responsaveis} />
        <span className="ml-auto">
          <Prazo prazo={tarefa.prazo} concluida={!!tarefa.concluidaEm} hoje={ctx.hoje} />
        </span>
        {subtarefas > 0 && <span className="text-texto-3">{subtarefas} sub</span>}
      </div>
    </div>
  )
}
