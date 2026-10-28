'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { somarDias } from '@/dominio/filtros'
import type { TarefaResumo } from '@/dominio/tarefas'
import type { Contexto } from './LinhaTarefa'

const DIAS = 28
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
/** Domingo da semana da data (YYYY-MM-DD). */
const domingoDe = (iso: string) => somarDias(iso, -new Date(`${iso}T00:00:00Z`).getUTCDay())

/** Linha do tempo de 4 semanas: cada tarefa com vencimento vira um marcador no dia; as sem vencimento ficam numa lista abaixo. */
export function VisaoLinhaDoTempo({ tarefas, ctx }: { tarefas: TarefaResumo[]; ctx: Contexto }) {
  const [semanas, setSemanas] = useState(0)
  const inicio = somarDias(domingoDe(ctx.hoje), semanas * 7)
  const dias = Array.from({ length: DIAS }, (_, i) => somarDias(inicio, i))
  const comPrazo = tarefas.filter((t) => t.prazo).sort((a, b) => (a.prazo as string).localeCompare(b.prazo as string))
  const semPrazo = tarefas.filter((t) => !t.prazo)
  const visiveis = comPrazo.filter((t) => (t.prazo as string) >= dias[0] && (t.prazo as string) <= dias[DIAS - 1])
  const fora = comPrazo.length - visiveis.length
  const rotuloPeriodo = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
  const cor = (t: TarefaResumo) => ctx.statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)?.cor ?? '#8d8d8d'
  const colunas = { gridTemplateColumns: '14rem repeat(28, minmax(1.75rem, 1fr))' }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-rotulo">
        <button type="button" onClick={() => setSemanas(0)} className="controle rounded-md border border-borda px-2.5 py-1 font-medium text-texto-2 hover:bg-hover">Hoje</button>
        <button type="button" aria-label="Quatro semanas antes" onClick={() => setSemanas((s) => s - 4)} className="rounded-md p-1 text-texto-2 hover:bg-hover"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" aria-label="Quatro semanas depois" onClick={() => setSemanas((s) => s + 4)} className="rounded-md p-1 text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></button>
        <span className="font-medium text-texto-2">{rotuloPeriodo.format(new Date(`${dias[0]}T00:00:00Z`)).replace('.', '')} – {rotuloPeriodo.format(new Date(`${dias[DIAS - 1]}T00:00:00Z`)).replace('.', '')}</span>
        {fora > 0 && <span className="text-texto-3">· {fora} tarefa{fora > 1 ? 's' : ''} com vencimento fora deste período</span>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-borda bg-white">
        <div className="min-w-[1000px]">
          <div className="grid border-b border-borda text-center text-legenda text-texto-3" style={colunas}>
            <span className="px-3 py-1.5 text-left text-rotulo font-medium">Tarefa</span>
            {dias.map((d) => {
              const dia = new Date(`${d}T00:00:00Z`).getUTCDay()
              return (
                <span key={d} className={`py-1 ${dia === 0 || dia === 6 ? 'bg-hover' : ''} ${d === ctx.hoje ? 'font-bold text-marca' : ''}`}>
                  <span className="block">{SEMANA[dia]}</span>
                  <span className="block tabular-nums">{Number(d.slice(8))}</span>
                </span>
              )
            })}
          </div>
          {visiveis.length === 0 && <p className="px-3 py-6 text-center text-corpo text-texto-3">Nenhuma tarefa com vencimento neste período.</p>}
          {visiveis.map((t) => {
            const col = dias.indexOf(t.prazo as string)
            return (
              <div key={t.id} className="grid h-9 items-center border-b border-borda last:border-0 hover:bg-hover" style={colunas}>
                <Link href={`/tarefas/${t.id}`} className={`truncate px-3 text-corpo font-medium hover:underline ${t.concluidaEm ? 'text-texto-3 line-through' : 'text-texto'}`}>{t.titulo}</Link>
                {dias.map((d, i) => (
                  <span key={d} className={`flex h-full items-center justify-center ${new Date(`${d}T00:00:00Z`).getUTCDay() % 6 === 0 ? 'bg-hover/60' : ''} ${d === ctx.hoje ? 'border-x border-marca/40' : ''}`}>
                    {i === col && <span title={`${t.titulo} · vence ${rotuloPeriodo.format(new Date(`${d}T00:00:00Z`)).replace('.', '')}`} className="h-3 w-3 rotate-45 rounded-[3px]" style={{ background: cor(t) }} />}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      {semPrazo.length > 0 && (
        <section className="rounded-lg border border-borda bg-white p-3">
          <h3 className="mb-1.5 text-rotulo font-semibold text-texto-2">Sem vencimento ({semPrazo.length})</h3>
          <ul className="flex flex-wrap gap-1.5">
            {semPrazo.map((t) => <li key={t.id}><Link href={`/tarefas/${t.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-borda px-2 py-1 text-rotulo text-texto-2 hover:bg-hover"><span className="h-2 w-2 rotate-45 rounded-[2px]" style={{ background: cor(t) }} />{t.titulo}</Link></li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
