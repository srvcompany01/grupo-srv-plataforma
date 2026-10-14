'use client'

import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { CalendarDays, ChevronLeft, ChevronRight, PackageCheck } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { atualizarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { ehSubtarefa, tarefasDoCalendario } from '@/dominio/calendario'
import { type Filtros, type NivelCalendario } from '@/dominio/filtros'
import type { TarefaResumo } from '@/dominio/tarefas'
import { enderecoDaVisao } from '@/dominio/visao-salva'
import { avisar } from './avisar'

const NIVEIS: { valor: NivelCalendario; rotulo: string; dica: string }[] = [
  { valor: 'maes', rotulo: 'Tarefas-mãe', dica: 'Só as entregas (prazo da tarefa-mãe)' },
  { valor: 'subtarefas', rotulo: 'Subtarefas', dica: 'Só as subtarefas (cada uma na sua data)' },
  { valor: 'ambas', rotulo: 'Ambas', dica: 'Tarefas-mãe e subtarefas, separadas' },
]
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const formatadorMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function iso(ano: number, mes: number, dia: number) {
  return new Date(Date.UTC(ano, mes, dia)).toISOString().slice(0, 10)
}

function gradeDoMes(anoMes: string) {
  const [ano, mesHumano] = anoMes.split('-').map(Number)
  const mes = mesHumano - 1
  const primeiro = new Date(Date.UTC(ano, mes, 1)).getUTCDay()
  return Array.from({ length: 42 }, (_, indice) => {
    const data = new Date(Date.UTC(ano, mes, indice - primeiro + 1))
    return {
      iso: iso(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
      dia: data.getUTCDate(),
      atual: data.getUTCMonth() === mes,
    }
  })
}

function moverMes(anoMes: string, quantidade: number) {
  const [ano, mes] = anoMes.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1 + quantidade, 1))
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Qualquer item do calendário pode ser arrastado para outro dia (muda o vencimento). */
function Arrastavel({ id, children }: { id: string; children: (a: { arrastando: boolean }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} tabIndex={-1} className={isDragging ? 'opacity-40' : undefined}>
      {children({ arrastando: isDragging })}
    </div>
  )
}

function Dia({ iso, className, children }: { iso: string; className: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: iso })
  return <div ref={setNodeRef} className={`${className} ${isOver ? 'bg-marca/10' : ''}`}>{children}</div>
}

export function VisaoCalendario({
  tarefas: todas,
  hoje,
  mesInicial,
  coresStatus,
  caminho,
  filtros,
}: {
  tarefas: TarefaResumo[]
  hoje: string
  mesInicial?: string | null
  coresStatus: Record<string, string>
  caminho: string
  filtros: Filtros
}) {
  const niveis = filtros.niveis
  // Vencimento escolhido por arrasto, mostrado na hora até o servidor responder (null = sem data).
  const [movidas, setMovidas] = useState<Map<string, string | null>>(new Map())
  const [, iniciar] = useTransition()
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const comMovidas = useMemo(() => todas.map((t) => (movidas.has(t.id) ? { ...t, prazo: movidas.get(t.id) ?? null } : t)), [todas, movidas])
  const tarefas = useMemo(() => tarefasDoCalendario(comMovidas, niveis), [comMovidas, niveis])
  const soltar = ({ active, over }: DragEndEvent) => {
    const id = String(active.id)
    const novo = over ? String(over.id) : null
    const atual = comMovidas.find((t) => t.id === id)?.prazo ?? null
    if (!novo || novo === atual) return
    const anterior = todas.find((t) => t.id === id)?.prazo ?? null
    setMovidas((m) => new Map(m).set(id, novo))
    iniciar(async () => {
      const resultado = await atualizarTarefaAcao(id, { prazo: novo })
      if (resultado?.erro) setMovidas((m) => new Map(m).set(id, anterior))
      avisar(resultado)
    })
  }
  const tituloPai = useMemo(() => new Map(todas.map((t) => [t.id, t.titulo])), [todas])
  const [diasAbertos, setDiasAbertos] = useState<Set<string>>(new Set())
  const alternarDia = (iso: string) => setDiasAbertos((atual) => { const novo = new Set(atual); if (!novo.delete(iso)) novo.add(iso); return novo })
  const [anoMes, setAnoMes] = useState(mesInicial?.slice(0, 7) ?? hoje.slice(0, 7))
  const dias = useMemo(() => gradeDoMes(anoMes), [anoMes])
  const porData = useMemo(() => {
    const mapa = new Map<string, TarefaResumo[]>()
    for (const tarefa of tarefas) {
      if (!tarefa.prazo) continue
      const lista = mapa.get(tarefa.prazo) ?? []
      lista.push(tarefa)
      mapa.set(tarefa.prazo, lista)
    }
    return mapa
  }, [tarefas])
  const semData = tarefas.filter((tarefa) => !tarefa.prazo)
  const [ano, mes] = anoMes.split('-').map(Number)

  return (
    <section className="overflow-hidden border border-borda bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borda bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-aviso text-white shadow-sm"><CalendarDays className="h-4 w-4" /></span>
          <div>
            <h2 className="text-sm font-bold capitalize text-texto">{formatadorMes.format(new Date(Date.UTC(ano, mes - 1, 1)))}</h2>
            <p className="text-legenda text-texto-3">{tarefas.length} {niveis === 'subtarefas' ? 'subtarefas' : niveis === 'maes' ? 'tarefas-mãe' : 'itens'} nesta visualização</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="O que mostrar no calendário" className="flex items-center gap-0.5 rounded-lg border border-borda bg-white p-0.5 shadow-sm">
          {NIVEIS.map((n) => (
            <Link
              key={n.valor}
              href={enderecoDaVisao(caminho, { ...filtros, niveis: n.valor })}
              replace
              scroll={false}
              title={n.dica}
              aria-pressed={niveis === n.valor}
              className={`rounded-md px-2.5 py-1 text-legenda font-semibold transition ${niveis === n.valor ? 'bg-petroleo text-white' : 'text-texto-2 hover:bg-hover hover:text-texto'}`}
            >
              {n.rotulo}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-borda bg-white p-1 shadow-sm">
          <button type="button" aria-label="Mês anterior" onClick={() => setAnoMes(moverMes(anoMes, -1))} className="rounded-md p-1.5 text-texto-2 hover:bg-hover"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => setAnoMes(hoje.slice(0, 7))} className="rounded-md px-2.5 py-1 text-legenda font-semibold text-texto-2 hover:bg-hover">Hoje</button>
          <button type="button" aria-label="Próximo mês" onClick={() => setAnoMes(moverMes(anoMes, 1))} className="rounded-md p-1.5 text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></button>
        </div>
        </div>
      </div>

      {niveis === 'ambas' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-borda bg-fundo/40 px-4 py-1.5 text-legenda text-texto-2">
          <span className="inline-flex items-center gap-1.5"><PackageCheck className="h-3.5 w-3.5 text-petroleo" /> Tarefa-mãe (entrega)</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-texto-3" /> Subtarefa</span>
        </div>
      )}
      <DndContext sensors={sensores} onDragEnd={soltar}>
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-7 border-b border-borda bg-fundo/70">
            {DIAS.map((dia) => <div key={dia} className="px-2 py-2 text-center text-legenda font-bold uppercase tracking-rotulo text-texto-3">{dia}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {dias.map((dia) => {
              const itens = porData.get(dia.iso) ?? []
              return (
                <Dia key={dia.iso} iso={dia.iso} className={`min-h-28 border-b border-r border-borda p-1.5 ${dia.atual ? 'bg-white' : 'bg-fundo/45'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-legenda font-semibold ${dia.iso === hoje ? 'bg-marca text-white' : dia.atual ? 'text-texto-2' : 'text-texto-3/60'}`}>{dia.dia}</span>
                  <div className="mt-1 space-y-1">
                    {(diasAbertos.has(dia.iso) ? itens : itens.slice(0, 4)).map((tarefa) => {
                      const sub = ehSubtarefa(tarefa)
                      return (
                        <Arrastavel key={tarefa.id} id={tarefa.id}>{() => (
                        <Link
                          draggable={false}
                          href={`/tarefas/${tarefa.id}`}
                          scroll={false}
                          title={sub ? `${tarefa.titulo} · subtarefa de ${tituloPai.get(tarefa.paiId ?? '') ?? 'tarefa-mãe'}` : `${tarefa.titulo} · tarefa-mãe (entrega)`}
                          className={`flex items-center gap-1 truncate rounded-md border-l-[3px] px-1.5 py-1 text-legenda transition hover:text-marca ${
                            sub ? 'bg-white font-normal ring-1 ring-borda hover:bg-hover' : 'bg-fundo font-semibold hover:bg-hover'
                          } ${tarefa.concluidaEm ? 'text-texto-3 line-through' : 'text-texto'}`}
                          style={{ borderLeftColor: coresStatus[tarefa.statusId] ?? '#87909e' }}
                        >
                          {sub ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-texto-3" aria-hidden="true" /> : <PackageCheck className="h-3 w-3 shrink-0 text-petroleo" aria-hidden="true" />}
                          <span className="truncate">{tarefa.titulo}</span>
                        </Link>
                        )}</Arrastavel>
                      )
                    })}
                    {itens.length > 4 && (
                      <button type="button" onClick={() => alternarDia(dia.iso)} className="block w-full px-1 text-left text-legenda font-medium text-texto-3 hover:text-marca">
                        {diasAbertos.has(dia.iso) ? 'Mostrar menos' : `+${itens.length - 4} itens`}
                      </button>
                    )}
                  </div>
                </Dia>
              )
            })}
          </div>
        </div>
      </div>

      {semData.length > 0 && (
        <div className="border-t border-borda bg-fundo/50 px-4 py-3">
          <p className="mb-2 text-legenda font-bold uppercase tracking-rotulo text-texto-3">Sem vencimento · {semData.length} <span className="font-medium normal-case tracking-normal">(arraste para um dia)</span></p>
          <div className="flex flex-wrap gap-2">
            {semData.slice(0, 12).map((tarefa) => (
              <Arrastavel key={tarefa.id} id={tarefa.id}>{() => (
                <Link draggable={false} href={`/tarefas/${tarefa.id}`} scroll={false} className="block rounded-full border border-borda bg-white px-2.5 py-1 text-legenda font-medium text-texto-2 hover:border-marca-clara hover:text-marca-escura">{tarefa.titulo}</Link>
              )}</Arrastavel>
            ))}
            {semData.length > 12 && <span className="px-2 py-1 text-legenda text-texto-3">+{semData.length - 12}</span>}
          </div>
        </div>
      )}
      </DndContext>
    </section>
  )
}
