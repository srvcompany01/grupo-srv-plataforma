'use client'

import { ChevronRight, Flag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { formatarData } from '@/dominio/formatar'
import { ROTULO_PRIORIDADE, type No, type Pessoa, type StatusLista, type TarefaResumo } from '@/dominio/tarefas'
import { SeletorResponsaveis } from './SeletorResponsaveis'
import { SeletorStatus } from './SeletorStatus'

const COR_PRIORIDADE = { urgente: 'text-rose-600', alta: 'text-amber-500', normal: 'text-texto-3', baixa: 'text-sky-500' } as const

export type Contexto = {
  equipe: Pessoa[]
  hoje: string
  /** Status por lista (no departamento há tarefas de várias listas). */
  statusPorLista: Record<string, StatusLista[]>
  mostrarLista: boolean
}

export function Prazo({ prazo, concluida, hoje }: { prazo: string | null; concluida: boolean; hoje: string }) {
  if (!prazo) return <span className="text-texto-3">—</span>
  const atrasada = !concluida && prazo < hoje
  return <span className={atrasada ? 'font-medium text-rose-600' : 'text-texto-2'}>{formatarData(prazo).slice(0, 5)}</span>
}

export function LinhaTarefa({ tarefa, nivel, ctx }: { tarefa: No<TarefaResumo>; nivel: number; ctx: Contexto }) {
  const [aberta, setAberta] = useState(false)
  const status = ctx.statusPorLista[tarefa.listaId] ?? []
  return (
    <>
      <div className="group flex h-9 items-center gap-2 border-t border-borda px-2 text-[13px] hover:bg-hover" style={{ paddingLeft: 8 + nivel * 20 }}>
        <button
          aria-label={aberta ? 'Recolher subtarefas' : 'Mostrar subtarefas'}
          onClick={() => setAberta(!aberta)}
          className={`rounded p-0.5 hover:bg-black/5 ${tarefa.filhos.length ? '' : 'invisible'}`}
        >
          <ChevronRight className={`h-3.5 w-3.5 transition ${aberta ? 'rotate-90' : ''}`} />
        </button>
        <SeletorStatus tarefaId={tarefa.id} statusId={tarefa.statusId} opcoes={status} />
        <Link href={`/tarefas/${tarefa.id}`} scroll={false} className="min-w-0 flex-1 truncate hover:text-marca">
          {tarefa.titulo}
          {tarefa.filhos.length > 0 && <span className="ml-1.5 text-[11px] text-texto-3">{tarefa.filhos.length}</span>}
        </Link>
        {tarefa.tags.map((t) => (
          <span key={t.id} className="hidden rounded px-1.5 py-0.5 text-[11px] text-white md:inline" style={{ background: t.cor }}>
            {t.nome}
          </span>
        ))}
        {ctx.mostrarLista && (
          <span className="hidden w-48 truncate text-[12px] text-texto-3 lg:inline" title={`${tarefa.listaNome} · ${tarefa.clienteNome}`}>
            {tarefa.listaNome} · {tarefa.clienteNome}
          </span>
        )}
        <span className="w-20">
          <SeletorResponsaveis tarefaId={tarefa.id} atuais={tarefa.responsaveis} equipe={ctx.equipe} />
        </span>
        <span className="w-12 text-[12px]">
          <Prazo prazo={tarefa.prazo} concluida={!!tarefa.concluidaEm} hoje={ctx.hoje} />
        </span>
        <span className="w-6" title={ROTULO_PRIORIDADE[tarefa.prioridade]}>
          {tarefa.prioridade !== 'normal' && <Flag className={`h-3.5 w-3.5 ${COR_PRIORIDADE[tarefa.prioridade]}`} />}
        </span>
      </div>
      {aberta && tarefa.filhos.map((f) => <LinhaTarefa key={f.id} tarefa={f} nivel={nivel + 1} ctx={ctx} />)}
    </>
  )
}
