'use client'

import { ChevronRight, CornerDownRight, Flag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { COLUNAS_BASE, COLUNAS_PADRAO, LIMITE_CAMPO } from '@/dominio/colunas-lista'
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
  /** Ids das colunas após Nome, na ordem: nativas (`status`) e campos (`campo:<id>`). */
  colunas?: string[]
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

export function larguraDaColuna(id: string, larguras: Record<string, number> = {}) {
  const base = COLUNAS_BASE.find((coluna) => coluna.id === id)
  return larguras[id] ?? base?.largura ?? LIMITE_CAMPO.largura
}

export const LARGURA_NOVO_CAMPO = 40

/** Colunas exibidas quando o contexto não define `colunas` (nativas padrão + todos os campos). */
export const colunasDoContexto = (ctx: Pick<Contexto, 'colunas' | 'camposPersonalizados'>) =>
  ctx.colunas ?? [...COLUNAS_PADRAO.filter((c) => c.padrao).map((c) => c.id), ...(ctx.camposPersonalizados ?? []).map((c) => `campo:${c.id}`)]

/** `colunas` = ids após Nome, na ordem de exibição. `comMais` reserva a coluna final do "+" (só o cabeçalho usa). */
export function gradeDaLista(colunas: string[], larguras: Record<string, number> = {}, comMais = false) {
  // A coluna de nome ocupa o espaço que sobra; a largura salva vira o mínimo.
  const nome = `minmax(${larguraDaColuna('nome', larguras)}px, 1fr)`
  return [nome, ...colunas.map((id) => `${larguraDaColuna(id, larguras)}px`), ...(comMais ? [`${LARGURA_NOVO_CAMPO}px`] : [])].join(' ')
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
  const colunas = colunasDoContexto(ctx)
  const selecionada = ctx.selecionadas?.has(tarefa.id) ?? false
  const celula = (colunaId: string) => {
    if (colunaId.startsWith('campo:')) {
      const definicao = (ctx.camposPersonalizados ?? []).find((campo) => `campo:${campo.id}` === colunaId)
      if (!definicao) return null
      return (
        <div key={colunaId} className="min-w-0 border-l border-borda/70 px-1.5 py-1">
          <CelulaCampoPersonalizado tarefaId={tarefa.id} definicao={{ ...definicao, valor: tarefa.camposPersonalizados?.[definicao.id] ?? null }} equipe={ctx.equipe} />
        </div>
      )
    }
    switch (colunaId) {
      case 'responsavel':
        return <span key={colunaId} className="px-2"><SeletorResponsaveis tarefaId={tarefa.id} atuais={tarefa.responsaveis} equipe={ctx.equipe} /></span>
      case 'prazo':
        return <span key={colunaId} className="px-2 text-[12px] tabular-nums"><Prazo prazo={tarefa.prazo} concluida={!!tarefa.concluidaEm} hoje={ctx.hoje} /></span>
      case 'prioridade':
        return (
          <span key={colunaId} className="px-2" title={ROTULO_PRIORIDADE[tarefa.prioridade]}>
            {tarefa.prioridade !== 'normal' && <Flag className={`h-3.5 w-3.5 ${COR_PRIORIDADE[tarefa.prioridade]}`} />}
          </span>
        )
      case 'status':
        return <span key={colunaId} className="min-w-0 px-2"><SeletorStatus tarefaId={tarefa.id} statusId={tarefa.statusId} opcoes={status} comNome /></span>
      case 'tagcliente':
        return (
          <span key={colunaId} className="min-w-0 px-2">
            <SeletorTagCliente listaId={tarefa.listaId} atual={{ id: tarefa.clienteId, nome: tarefa.clienteNome, cor: tarefa.clienteCor }} opcoes={ctx.tagsCliente} podeGerir={ctx.podeGerirTagCliente} />
          </span>
        )
      case 'etiquetas':
        return (
          <span key={colunaId} className="flex min-w-0 flex-wrap gap-1 px-2">
            {tarefa.tags.length === 0 ? <span className="text-texto-3">—</span> : tarefa.tags.map((t) => <span key={t.id} className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ background: t.cor }}>{t.nome}</span>)}
          </span>
        )
      default:
        return null
    }
  }
  return (
    <>
      <div className={`group grid min-h-10 items-center border-t border-borda text-[13px] transition-colors ${selecionada ? 'bg-sky-50/80' : 'hover:bg-hover/80'}`} style={{ gridTemplateColumns: gradeDaLista(colunas, ctx.largurasColunas) }}>
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
          {!colunas.includes('status') && <SeletorStatus tarefaId={tarefa.id} statusId={tarefa.statusId} opcoes={status} />}
          <div className="min-w-0 flex-1">
            <Link href={`/tarefas/${tarefa.id}`} scroll={false} className="block truncate font-medium hover:text-marca">
              {tarefa.titulo.trim() || <span className="font-normal italic text-texto-3">Sem título</span>}
              {tarefa.filhos.length > 0 && <span className="ml-1.5 text-[11px] text-texto-3">{tarefa.filhos.length}</span>}
            </Link>
            {ctx.mostrarLista && <span className="block truncate text-[10px] text-texto-3" title={`${tarefa.listaNome} · @${tarefa.clienteNome}`}>{tarefa.listaNome} · @{tarefa.clienteNome}</span>}
          </div>
          {!colunas.includes('tagcliente') && (
            <SeletorTagCliente
              listaId={tarefa.listaId}
              atual={{ id: tarefa.clienteId, nome: tarefa.clienteNome, cor: tarefa.clienteCor }}
              opcoes={ctx.tagsCliente}
              podeGerir={ctx.podeGerirTagCliente}
            />
          )}
          {!colunas.includes('etiquetas') && tarefa.tags.map((t) => (
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
        {colunas.map(celula)}
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
