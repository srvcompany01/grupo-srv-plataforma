'use client'

import { ChevronRight, CornerDownRight, Flag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { COLUNAS_BASE, COLUNAS_PADRAO, LIMITE_CAMPO } from '@/dominio/colunas-lista'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import { ROTULO_PRIORIDADE, type No, type Pessoa, type StatusLista, type TarefaResumo } from '@/dominio/tarefas'
import { CelulaCampoPersonalizado } from './CamposPersonalizados'
import { EditorVencimento, Prazo } from './EditorVencimento'
import type { PropsGerenciarCampos } from './GerenciarCampos'
import { NovaTarefa } from './NovaTarefa'
import { SeletorResponsaveis } from './SeletorResponsaveis'
import { SeletorStatus } from './SeletorStatus'
import { SeletorTagCliente, type TagCliente } from './SeletorTagCliente'

const COR_PRIORIDADE = { urgente: 'text-perigo', alta: 'text-aviso', normal: 'text-texto-3', baixa: 'text-marca' } as const

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
  /** `intervalo` = Shift segurado: marca/desmarca tudo entre a última linha clicada e esta. */
  alternarSelecao?: (id: string, selecionada: boolean, intervalo?: boolean) => void
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
  // A coluna de nome ocupa o espaço que sobra, até o usuário arrastar a borda: aí a largura escolhida vale
  // (encolher a coluna só funciona se ela deixar de ser flexível).
  const nome = larguras.nome ? `${larguras.nome}px` : `minmax(${larguraDaColuna('nome', larguras)}px, 1fr)`
  return [nome, ...colunas.map((id) => `${larguraDaColuna(id, larguras)}px`), ...(comMais ? [`${LARGURA_NOVO_CAMPO}px`] : [])].join(' ')
}

export { Prazo }

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
        return <span key={colunaId} className="px-1 text-rotulo"><EditorVencimento tarefaId={tarefa.id} prazo={tarefa.prazo} concluida={!!tarefa.concluidaEm} hoje={ctx.hoje} /></span>
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
            <SeletorTagCliente tarefaId={tarefa.id} atual={tarefa.clienteId ? { id: tarefa.clienteId, nome: tarefa.clienteNome, cor: tarefa.clienteCor } : null} opcoes={ctx.tagsCliente} podeGerir={ctx.podeGerirTagCliente} />
          </span>
        )
      case 'etiquetas':
        return (
          <span key={colunaId} className="flex min-w-0 flex-wrap gap-1 px-2">
            {tarefa.tags.length === 0 ? <span className="text-texto-3">—</span> : tarefa.tags.map((t) => <span key={t.id} className="rounded-full px-2 py-0.5 text-legenda font-medium text-white" style={{ background: t.cor }}>{t.nome}</span>)}
          </span>
        )
      default:
        return null
    }
  }
  return (
    <>
      <div className={`group grid min-h-10 items-center border-t border-borda text-corpo transition-colors ${selecionada ? 'bg-marca-fundo/80' : 'hover:bg-hover/80'}`} style={{ gridTemplateColumns: gradeDaLista(colunas, ctx.largurasColunas) }}>
        <div className="flex min-w-0 items-center gap-2 px-3" style={{ paddingLeft: 12 + nivel * 20 }}>
          <input
            type="checkbox"
            checked={selecionada}
            data-tarefa-id={tarefa.id}
            onChange={(evento) => ctx.alternarSelecao?.(tarefa.id, evento.target.checked, (evento.nativeEvent as MouseEvent).shiftKey === true)}
            aria-label={`Selecionar ${tarefa.titulo}`}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-marca"
          />
          <button
            aria-label={aberta ? 'Recolher subtarefas' : 'Mostrar subtarefas'}
            onClick={() => setAberta(!aberta)}
            className="rounded p-0.5 text-texto-3 hover:bg-black/5 hover:text-texto"
          >
            <ChevronRight className={`h-3.5 w-3.5 transition ${aberta ? 'rotate-90' : ''}`} />
          </button>
          {!colunas.includes('status') && <SeletorStatus tarefaId={tarefa.id} statusId={tarefa.statusId} opcoes={status} />}
          <div className="min-w-0 flex-1">
            <Link href={`/tarefas/${tarefa.id}`} scroll={false} className="block truncate font-medium hover:text-marca">
              {tarefa.titulo.trim() || <span className="font-normal italic text-texto-3">Sem título</span>}
              {tarefa.filhos.length > 0 && <span className="ml-1.5 text-legenda text-texto-3">{tarefa.filhos.length}</span>}
            </Link>
            {ctx.mostrarLista && <span className="block truncate text-legenda text-texto-3" title={tarefa.clienteNome ? `${tarefa.listaNome} · @${tarefa.clienteNome}` : tarefa.listaNome}>{tarefa.listaNome}{tarefa.clienteNome && ` · @${tarefa.clienteNome}`}</span>}
          </div>
          {!colunas.includes('tagcliente') && (
            <SeletorTagCliente
              tarefaId={tarefa.id}
              atual={tarefa.clienteId ? { id: tarefa.clienteId, nome: tarefa.clienteNome, cor: tarefa.clienteCor } : null}
              opcoes={ctx.tagsCliente}
              podeGerir={ctx.podeGerirTagCliente}
            />
          )}
          {!colunas.includes('etiquetas') && tarefa.tags.map((t) => (
            <span key={t.id} className="hidden rounded-full px-2 py-0.5 text-legenda font-medium text-white xl:inline" style={{ background: t.cor }}>
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
            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-legenda font-semibold text-texto-3 opacity-60 transition hover:bg-white hover:text-marca focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline">Subtarefa</span>
          </button>
        </div>
        {colunas.map(celula)}
      </div>
      {aberta && tarefa.filhos.map((f) => <LinhaTarefa key={f.id} tarefa={f} nivel={nivel + 1} ctx={ctx} euId={euId} />)}
      {aberta && !criandoSubtarefa && (
        <button
          type="button"
          onClick={() => setCriandoSubtarefa(true)}
          className="flex min-h-8 w-full items-center gap-2 border-t border-borda py-1 text-left text-corpo text-texto-3 transition-colors hover:bg-hover/80 hover:text-marca"
          style={{ paddingLeft: 52 + nivel * 20 }}
        >
          <CornerDownRight className="h-3.5 w-3.5" /> Adicionar subtarefa
        </button>
      )}
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
