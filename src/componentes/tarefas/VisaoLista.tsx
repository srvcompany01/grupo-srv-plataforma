'use client'

import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { No, TarefaResumo } from '@/dominio/tarefas'
import { LinhaTarefa, type Contexto } from './LinhaTarefa'
import { NovaTarefa } from './NovaTarefa'

export type Grupo = { id: string; nome: string; cor: string; tarefas: No<TarefaResumo>[]; statusId?: string }

export function VisaoLista({ grupos, ctx, criarEm, euId }: { grupos: Grupo[]; ctx: Contexto; criarEm?: string; euId: string }) {
  const [fechados, setFechados] = useState<Set<string>>(new Set())
  const alternar = (id: string) => {
    const novo = new Set(fechados)
    if (novo.has(id)) novo.delete(id)
    else novo.add(id)
    setFechados(novo)
  }
  return (
    <div className="space-y-4">
      {grupos.map((g) => (
        <section key={g.id} className="overflow-hidden rounded-lg border border-borda bg-white">
          <button onClick={() => alternar(g.id)} className="flex w-full items-center gap-2 px-2 py-2 text-left">
            <ChevronRight className={`h-4 w-4 text-texto-3 transition ${fechados.has(g.id) ? '' : 'rotate-90'}`} />
            <span className="rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white" style={{ background: g.cor }}>
              {g.nome}
            </span>
            <span className="text-[12px] text-texto-3">{g.tarefas.length}</span>
          </button>
          {!fechados.has(g.id) && (
            <>
              {g.tarefas.map((t) => (
                <LinhaTarefa key={t.id} tarefa={t} nivel={0} ctx={ctx} />
              ))}
              {criarEm && <NovaTarefa listaId={criarEm} statusId={g.statusId} euId={euId} />}
            </>
          )}
        </section>
      ))}
    </div>
  )
}
