'use client'

import { ChevronRight, CornerDownRight, Flag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { formatarData } from '@/dominio/formatar'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import { ROTULO_PRIORIDADE, type No, type Pessoa, type StatusLista, type TarefaResumo } from '@/dominio/tarefas'
import { CelulaCampoPersonalizado } from './CamposPersonalizados'
import type { PropsGerenciarCampos } from './GerenciarCampos'
import { NovaTarefa } from './NovaTarefa'
import { SeletorResponsaveis } from './SeletorResponsaveis'
import { SeletorStatus } from './SeletorStatus'
import { SeletorTagCliente, type TagCliente } from './SeletorTagCliente'

const COR_PRIORIDADE = { urgente: 'text-rose-600', alta: 'text-amber-500', normal: 'text-texto-3', baixa: 'text-sky-500' } as const

export type Contexto = {
  equipe: Pessoa[]
  hoje: string
  /** Status por lista (no departamento há tarefas de várias listas). */
  statusPorLista: Record<string, StatusLista[]>
  mostrarLista: boolean
  camposPersonalizados?: DefinicaoCampo[]
  tagsCliente?: TagCliente[]
  podeGerirTagCliente?: boolean
  /** Admin: libera configurar e arquivar campos a partir do cabeçalho da lista. */
  podeEditarCampos?: boolean
  /** Habilita o "+" do cabeçalho para criar ou adicionar campos à lista. */
  gerirCampos?: PropsGerenciarCampos
  largurasColunas?: Record<string, number>
  selecionadas?: ReadonlySet<string>
  alternarSelecao?: (id: string, selecionada: boolean) => void
}

export const COLUNAS_BASE = [
  { id: 'nome', largura: 360, minima: 220, maxima: 800 },
  { id: 'responsavel', largura: 110, minima: 80, maxima: 320 },
  { id: 'prazo', largura: 78, minima: 62, maxima: 240 },
  { id: 'prioridade', largura: 44, minima: 36, maxima: 120 },
] as const

export function larguraDaColuna(id: string, larguras: Record<string, number> = {}) {
  const base = COLUNAS_BASE.find((coluna) => coluna.id === id)
  return larguras[id] ?? base?.largura ?? 180
}

export const LARGURA_NOVO_CAMPO = 40

/** `comMais` reserva a coluna final do "+" (só o cabeçalho usa). */
export function gradeDaLista(campos: DefinicaoCampo[], larguras: Record<string, number> = {}, comMais = false) {
  // A coluna de nome ocupa o espaço que sobra; a largura salva vira o mínimo.
  const fixas = COLUNAS_BASE.map((coluna) => (coluna.id === 'nome' ? `minmax(${larguraDaColuna(coluna.id, larguras)}px, 1fr)` : `${larguraDaColuna(coluna.id, larguras)}px`))
  const personalizadas = campos.map((campo) => `${larguraDaColuna(`campo:${campo.id}`, larguras)}px`)
  return [...fixas, ...personalizadas, ...(comMais ? [`${LARGURA_NOVO_CAMPO}px`] : [])].join(' ')
}

export function Prazo({ prazo, concluida, hoje }: { prazo: string | null; concluida: boolean; hoje: string }) {
  if (!prazo) return <span className="text-texto-3">—</span>
  const atrasada = !concluida && prazo < hoje
  return <span className={atrasada ? 'font-medium text-rose-600' : 'text-texto-2'}>{formatarData(prazo).slice(0, 5)}</span>
}

export function LinhaTarefa({ tarefa, nivel, ctx, euId }: { tarefa: No<TarefaResumo>; nivel: number; ctx: Contexto; euId: string }) {
  const [aberta, setAberta] = useState(false)
  const [criandoSubtarefa, setCriandoSubtarefa] = useState(false)
  const status = ctx.statusPorLista[tarefa.listaId] ?? []
  const campos = ctx.camposPersonalizados ?? []
  const selecionada = ctx.selecionadas?.has(tarefa.id) ?? false
  return (
    <>
      <div className={`group grid min-h-10 items-center border-t border-borda text-[13px] transition-colors ${selecionada ? 'bg-sky-50/80' : 'hover:bg-hover/80'}`} style={{ gridTemplateColumns: gradeDaLista(campos, ctx.largurasColunas) }}>
        <div className="flex min-w-0 items-center gap-2 px-3" style={{ paddingLeft: 12 + nivel * 20 }}>
          <input
            type="checkbox"
            checked={selecionada}
            onChange={(evento) => ctx.alternarSelecao?.(tarefa.id, evento.target.checked)}
            aria-label={`Selecionar ${tarefa.titulo}`}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-sky-600"
          />
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
              {tarefa.titulo.trim() || <span className="font-normal italic text-texto-3">Sem título</span>}
              {tarefa.filhos.length > 0 && <span className="ml-1.5 text-[11px] text-texto-3">{tarefa.filhos.length}</span>}
            </Link>
            {ctx.mostrarLista && <span className="block truncate text-[10px] text-texto-3" title={`${tarefa.listaNome} · @${tarefa.clienteNome}`}>{tarefa.listaNome} · @{tarefa.clienteNome}</span>}
          </div>
          <SeletorTagCliente
            listaId={tarefa.listaId}
            atual={{ id: tarefa.clienteId, nome: tarefa.clienteNome, cor: tarefa.clienteCor }}
            opcoes={ctx.tagsCliente}
            podeGerir={ctx.podeGerirTagCliente}
          />
          {tarefa.tags.map((t) => (
            <span key={t.id} className="hidden rounded-full px-2 py-0.5 text-[10px] font-medium text-white xl:inline" style={{ background: t.cor }}>
              {t.nome}
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              setAberta(true)
              setCriandoSubtarefa(true)
            }}
            aria-label={`Adicionar subtarefa em ${tarefa.titulo}`}
            title="Adicionar subtarefa"
            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-texto-3 opacity-60 transition hover:bg-white hover:text-marca focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline">Subtarefa</span>
          </button>
        </div>
        <span className="px-2">
          <SeletorResponsaveis tarefaId={tarefa.id} atuais={tarefa.responsaveis} equipe={ctx.equipe} />
        </span>
        <span className="px-2 text-[12px] tabular-nums">
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
      {aberta && tarefa.filhos.map((f) => <LinhaTarefa key={f.id} tarefa={f} nivel={nivel + 1} ctx={ctx} euId={euId} />)}
      {criandoSubtarefa && (
        <NovaTarefa
          listaId={tarefa.listaId}
          statusId={tarefa.statusId}
          euId={euId}
          paiId={tarefa.id}
          abertaInicial
          recuo={52 + nivel * 20}
          onFechar={() => setCriandoSubtarefa(false)}
          onCriada={() => setCriandoSubtarefa(false)}
        />
      )}
    </>
  )
}
