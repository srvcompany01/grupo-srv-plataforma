'use client'

import { ChevronRight, Flag, UserRound } from 'lucide-react'
import { useState } from 'react'
import { IconeVisual } from '@/componentes/IconeVisual'
import type { No, TarefaResumo } from '@/dominio/tarefas'
import { LinhaTarefa, gradeDaLista, type Contexto } from './LinhaTarefa'
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
  const campos = ctx.camposPersonalizados ?? []
  return (
    <div className="overflow-x-auto pb-2">
      <div className="space-y-5" style={{ minWidth: 560 + campos.length * 175 }}>
      {grupos.map((g) => (
        <section key={g.id} className="overflow-hidden rounded-xl border border-borda bg-white shadow-[0_6px_24px_rgba(32,32,32,0.035)]" style={{ boxShadow: `inset 3px 0 0 ${g.cor}, 0 6px 24px rgba(32,32,32,0.035)` }}>
          <button onClick={() => alternar(g.id)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:brightness-[0.985]" style={{ background: `linear-gradient(90deg, ${g.cor}12, #f8f9fa 42%, #ffffff)` }}>
            <ChevronRight className={`h-4 w-4 text-texto-3 transition ${fechados.has(g.id) ? '' : 'rotate-90'}`} />
            <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-white" style={{ background: g.cor }}>
              {g.nome}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-texto-3 ring-1 ring-borda">{g.tarefas.length}</span>
          </button>
          {!fechados.has(g.id) && (
            <>
              <div className="grid min-h-8 items-center border-t border-borda bg-[#fbfbfc] text-[10px] font-semibold uppercase tracking-[0.045em] text-texto-3" style={{ gridTemplateColumns: gradeDaLista(campos.length) }}>
                <span className="px-4">Nome</span>
                <span className="flex items-center gap-1 px-2"><UserRound className="h-3 w-3" /> Responsável</span>
                <span className="px-2">Prazo</span>
                <span className="px-2"><Flag className="h-3 w-3" /></span>
                {campos.map((definicao) => (
                  <span key={definicao.id} className="flex min-w-0 items-center gap-1.5 border-l border-borda/70 px-2" title={definicao.nome}>
                    <span style={{ color: definicao.cor }}><IconeVisual icone={definicao.icone} className="h-3.5 w-3.5" /></span>
                    <span className="truncate">{definicao.nome}</span>
                  </span>
                ))}
              </div>
              {g.tarefas.map((t) => (
                <LinhaTarefa key={t.id} tarefa={t} nivel={0} ctx={ctx} />
              ))}
              {criarEm && <NovaTarefa listaId={criarEm} statusId={g.statusId} euId={euId} />}
            </>
          )}
        </section>
      ))}
      </div>
    </div>
  )
}
