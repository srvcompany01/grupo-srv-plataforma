'use client'

import { ChevronRight, Flag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { formatarData } from '@/dominio/formatar'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import { ROTULO_PRIORIDADE, type No, type Pessoa, type StatusLista, type TarefaResumo } from '@/dominio/tarefas'
import { CelulaCampoPersonalizado } from './CamposPersonalizados'
import { SeletorResponsaveis } from './SeletorResponsaveis'
import { SeletorStatus } from './SeletorStatus'

const COR_PRIORIDADE = { urgente: 'text-rose-600', alta: 'text-amber-500', normal: 'text-texto-3', baixa: 'text-sky-500' } as const

export type Contexto = {
  equipe: Pessoa[]
  hoje: string
  /** Status por lista (no departamento há tarefas de várias listas). */
  statusPorLista: Record<string, StatusLista[]>
  mostrarLista: boolean
  camposPersonalizados?: DefinicaoCampo[]
}

export function gradeDaLista(quantidadeCampos: number) {
  return `minmax(300px, 1fr) 96px 72px 38px${quantidadeCampos ? ` repeat(${quantidadeCampos}, minmax(160px, 190px))` : ''}`
}

export function Prazo({ prazo, concluida, hoje }: { prazo: string | null; concluida: boolean; hoje: string }) {
  if (!prazo) return <span className="text-texto-3">—</span>
  const atrasada = !concluida && prazo < hoje
  return <span className={atrasada ? 'font-medium text-rose-600' : 'text-texto-2'}>{formatarData(prazo).slice(0, 5)}</span>
}

export function LinhaTarefa({ tarefa, nivel, ctx }: { tarefa: No<TarefaResumo>; nivel: number; ctx: Contexto }) {
  const [aberta, setAberta] = useState(false)
  const status = ctx.statusPorLista[tarefa.listaId] ?? []
  const campos = ctx.camposPersonalizados ?? []
  return (
    <>
      <div className="group grid min-h-10 items-center border-t border-borda text-[13px] transition-colors hover:bg-hover/80" style={{ gridTemplateColumns: gradeDaLista(campos.length) }}>
        <div className="flex min-w-0 items-center gap-2 px-3" style={{ paddingLeft: 12 + nivel * 20 }}>
          <button
            aria-label={aberta ? 'Recolher subtarefas' : 'Mostrar subtarefas'}
            onClick={() => setAberta(!aberta)}
            className={`rounded p-0.5 hover:bg-black/5 ${tarefa.filhos.length ? '' : 'invisible'}`}
          >
            <ChevronRight className={`h-3.5 w-3.5 transition ${aberta ? 'rotate-90' : ''}`} />
          </button>
          <SeletorStatus tarefaId={tarefa.id} statusId={tarefa.statusId} opcoes={status} />
          <div className="min-w-0 flex-1">
            <Link href={`/tarefas/${tarefa.id}`} scroll={false} className="block truncate font-medium hover:text-marca">
              {tarefa.titulo}
              {tarefa.filhos.length > 0 && <span className="ml-1.5 text-[11px] text-texto-3">{tarefa.filhos.length}</span>}
            </Link>
            {ctx.mostrarLista && <span className="block truncate text-[10px] text-texto-3" title={`${tarefa.listaNome} · @${tarefa.clienteNome}`}>{tarefa.listaNome} · @{tarefa.clienteNome}</span>}
          </div>
          {tarefa.tags.map((t) => (
            <span key={t.id} className="hidden rounded-full px-2 py-0.5 text-[10px] font-medium text-white xl:inline" style={{ background: t.cor }}>
              {t.nome}
            </span>
          ))}
        </div>
        <span className="px-2">
          <SeletorResponsaveis tarefaId={tarefa.id} atuais={tarefa.responsaveis} equipe={ctx.equipe} />
        </span>
        <span className="px-2 text-[12px]">
          <Prazo prazo={tarefa.prazo} concluida={!!tarefa.concluidaEm} hoje={ctx.hoje} />
        </span>
        <span className="px-2" title={ROTULO_PRIORIDADE[tarefa.prioridade]}>
          {tarefa.prioridade !== 'normal' && <Flag className={`h-3.5 w-3.5 ${COR_PRIORIDADE[tarefa.prioridade]}`} />}
        </span>
        {campos.map((definicao) => (
          <div key={definicao.id} className="min-w-0 border-l border-borda/70 px-1.5 py-1">
            <CelulaCampoPersonalizado
              tarefaId={tarefa.id}
              definicao={{ ...definicao, valor: tarefa.camposPersonalizados?.[definicao.id] ?? null }}
              equipe={ctx.equipe}
            />
          </div>
        ))}
      </div>
      {aberta && tarefa.filhos.map((f) => <LinhaTarefa key={f.id} tarefa={f} nivel={nivel + 1} ctx={ctx} />)}
    </>
  )
}
