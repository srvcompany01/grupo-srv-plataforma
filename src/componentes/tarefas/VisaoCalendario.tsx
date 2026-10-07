'use client'

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { TarefaResumo } from '@/dominio/tarefas'

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

export function VisaoCalendario({
  tarefas,
  hoje,
  mesInicial,
  coresStatus,
}: {
  tarefas: TarefaResumo[]
  hoje: string
  mesInicial?: string | null
  coresStatus: Record<string, string>
}) {
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
    <section className="overflow-hidden rounded-xl border border-borda bg-white shadow-[0_8px_30px_rgba(32,32,32,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borda bg-gradient-to-r from-orange-50 via-white to-sky-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm"><CalendarDays className="h-4 w-4" /></span>
          <div>
            <h2 className="text-sm font-bold capitalize text-texto">{formatadorMes.format(new Date(Date.UTC(ano, mes - 1, 1)))}</h2>
            <p className="text-[10px] text-texto-3">{tarefas.length} tarefas nesta visualização</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-borda bg-white p-1 shadow-sm">
          <button type="button" aria-label="Mês anterior" onClick={() => setAnoMes(moverMes(anoMes, -1))} className="rounded-md p-1.5 text-texto-2 hover:bg-hover"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => setAnoMes(hoje.slice(0, 7))} className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-texto-2 hover:bg-hover">Hoje</button>
          <button type="button" aria-label="Próximo mês" onClick={() => setAnoMes(moverMes(anoMes, 1))} className="rounded-md p-1.5 text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-7 border-b border-borda bg-fundo/70">
            {DIAS.map((dia) => <div key={dia} className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-texto-3">{dia}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {dias.map((dia) => {
              const itens = porData.get(dia.iso) ?? []
              return (
                <div key={dia.iso} className={`min-h-28 border-b border-r border-borda p-1.5 ${dia.atual ? 'bg-white' : 'bg-fundo/45'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${dia.iso === hoje ? 'bg-teal-500 text-white' : dia.atual ? 'text-texto-2' : 'text-texto-3/60'}`}>{dia.dia}</span>
                  <div className="mt-1 space-y-1">
                    {itens.slice(0, 3).map((tarefa) => (
                      <Link
                        key={tarefa.id}
                        href={`/tarefas/${tarefa.id}`}
                        scroll={false}
                        title={tarefa.titulo}
                        className={`block truncate rounded-md border-l-[3px] bg-fundo px-1.5 py-1 text-[10px] font-medium transition hover:bg-hover hover:text-marca ${tarefa.concluidaEm ? 'text-texto-3 line-through' : 'text-texto'}`}
                        style={{ borderLeftColor: coresStatus[tarefa.statusId] ?? '#87909e' }}
                      >
                        {tarefa.titulo}
                      </Link>
                    ))}
                    {itens.length > 3 && <span className="block px-1 text-[9px] font-medium text-texto-3">+{itens.length - 3} tarefas</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {semData.length > 0 && (
        <div className="border-t border-borda bg-fundo/50 px-4 py-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-texto-3">Sem data definida · {semData.length}</p>
          <div className="flex flex-wrap gap-2">
            {semData.slice(0, 12).map((tarefa) => (
              <Link key={tarefa.id} href={`/tarefas/${tarefa.id}`} scroll={false} className="rounded-full border border-borda bg-white px-2.5 py-1 text-[11px] font-medium text-texto-2 hover:border-sky-200 hover:text-sky-700">{tarefa.titulo}</Link>
            ))}
            {semData.length > 12 && <span className="px-2 py-1 text-[11px] text-texto-3">+{semData.length - 12}</span>}
          </div>
        </div>
      )}
    </section>
  )
}
