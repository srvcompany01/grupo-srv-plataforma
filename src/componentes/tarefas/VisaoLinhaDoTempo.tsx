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
    <div>
      <div>
        <button type="button" onClick={() => setSemanas(0)}>Hoje</button>
        <button type="button" aria-label="Quatro semanas antes" onClick={() => setSemanas((s) => s - 4)}><ChevronLeft /></button>
        <button type="button" aria-label="Quatro semanas depois" onClick={() => setSemanas((s) => s + 4)}><ChevronRight /></button>
        <span>{rotuloPeriodo.format(new Date(`${dias[0]}T00:00:00Z`)).replace('.', '')} – {rotuloPeriodo.format(new Date(`${dias[DIAS - 1]}T00:00:00Z`)).replace('.', '')}</span>
        {fora > 0 && <span>· {fora} tarefa{fora > 1 ? 's' : ''} com vencimento fora deste período</span>}
      </div>
      <div>
        <div>
          <div style={colunas}>
            <span>Tarefa</span>
            {dias.map((d) => {
              const dia = new Date(`${d}T00:00:00Z`).getUTCDay()
              return (
                <span key={d}>
                  <span>{SEMANA[dia]}</span>
                  <span>{Number(d.slice(8))}</span>
                </span>
              )
            })}
          </div>
          {visiveis.length === 0 && <p>Nenhuma tarefa com vencimento neste período.</p>}
          {visiveis.map((t) => {
            const col = dias.indexOf(t.prazo as string)
            return (
              <div key={t.id} style={colunas}>
                <Link href={`/tarefas/${t.id}`}>{t.titulo}</Link>
                {dias.map((d, i) => (
                  <span key={d}>
                    {i === col && <span title={`${t.titulo} · vence ${rotuloPeriodo.format(new Date(`${d}T00:00:00Z`)).replace('.', '')}`} style={{ background: cor(t) }} />}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      {semPrazo.length > 0 && (
        <section>
          <h3>Sem vencimento ({semPrazo.length})</h3>
          <ul>
            {semPrazo.map((t) => <li key={t.id}><Link href={`/tarefas/${t.id}`}><span style={{ background: cor(t) }} />{t.titulo}</Link></li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
