'use client'

import { CornerDownRight } from 'lucide-react'
import { Ic } from '@/componentes/app/Ic'
import Link from 'next/link'
import { useState } from 'react'
import { formatarDuracao } from '@/dominio/formatar'
import { COLUNAS_BASE, COLUNAS_PADRAO, LIMITE_CAMPO } from '@/dominio/colunas-lista'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import { type No, type Pessoa, type StatusLista, type TarefaResumo } from '@/dominio/tarefas'
import { CelulaCampoPersonalizado } from './CamposPersonalizados'
import { EditorVencimento, Prazo } from './EditorVencimento'
import type { PropsGerenciarCampos } from './GerenciarCampos'
import { NovaTarefa } from './NovaTarefa'
import { SeletorPrioridade } from './SeletorPrioridade'
import { SeletorResponsaveis } from './SeletorResponsaveis'
import { SeletorStatus } from './SeletorStatus'
import { SeletorTagCliente, type TagCliente } from './SeletorTagCliente'


export type Contexto = {
  equipe: Pessoa[]
  hoje: string
  /** Status por lista (no departamento há tarefas de várias listas). */
  statusPorLista: Record<string, StatusLista[]>
  mostrarLista: boolean
  /** Subtarefas já abertas ao carregar (opção do botão de subtarefas da barra). */
  subtarefasAbertas?: boolean
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
  /** Células marcadas arrastando o mouse (como numa planilha): linhas × colunas. */
  faixa?: { linhas: ReadonlySet<string>; colunas: ReadonlySet<string> } | null
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
  // Três colunas fixas antes do nome (seleção, subtarefas, status), como no protótipo do redesign.
  return ['28px', '20px', '24px', nome, ...colunas.map((id) => `${larguraDaColuna(id, larguras)}px`), ...(comMais ? [`${LARGURA_NOVO_CAMPO}px`] : [])].join(' ')
}

const dia = (iso?: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().slice(0, 2).join('/') : '—')

/** Texto de uma coluna nativa extra (as que não têm editor próprio). */
export function valorDaColunaNativa(id: string, t: TarefaResumo): string {
  switch (id) {
    case 'comentarios': return String(t.comentarios ?? 0)
    case 'criado_por': return t.criadoPorNome || '—'
    case 'data_criada': return dia(t.criadaEm)
    case 'data_atualizacao': return dia(t.atualizadaEm)
    case 'data_conclusao': return dia(t.concluidaEm)
    case 'data_inicial': return dia(t.inicio)
    case 'estimativa': return t.estimativaMin ? formatarDuracao(t.estimativaMin * 60) : '—'
    case 'id_tarefa': return `SRV-${t.id.slice(0, 4).toUpperCase()}`
    case 'linha_tempo': return t.inicio || t.prazo ? `${dia(t.inicio)} → ${dia(t.prazo)}` : '—'
    case 'lista': return t.listaNome || '—'
    case 'tempo_rastreado': return t.tempoSeg ? formatarDuracao(t.tempoSeg) : '—'
    default: return '—'
  }
}

export { Prazo }

export function LinhaTarefa({ tarefa, nivel, ctx, euId }: { tarefa: No<TarefaResumo>; nivel: number; ctx: Contexto; euId: string }) {
  const [aberta, setAberta] = useState(ctx.subtarefasAbertas ?? false)
  const [criandoSubtarefa, setCriandoSubtarefa] = useState(false)
  const status = ctx.statusPorLista[tarefa.listaId] ?? []
  const colunas = colunasDoContexto(ctx)
  const selecionada = ctx.selecionadas?.has(tarefa.id) ?? false
  // Cada célula leva `data-celula` (a lista descobre por ele onde o mouse está) e ganha destaque quando está na faixa.
  const noFaixa = (colunaId: string) => !!ctx.faixa?.linhas.has(tarefa.id) && ctx.faixa.colunas.has(colunaId)
  const marca = (colunaId: string) => ({ 'data-celula': colunaId })
  const realce = (colunaId: string) => (noFaixa(colunaId) ? ' bg-[var(--sel)] ring-1 ring-inset ring-[var(--focus)]/30' : '')
  const celula = (colunaId: string) => {
    if (colunaId.startsWith('campo:')) {
      const definicao = (ctx.camposPersonalizados ?? []).find((campo) => `campo:${campo.id}` === colunaId)
      if (!definicao) return null
      return (
        <div key={colunaId} {...marca(colunaId)}>
          <CelulaCampoPersonalizado tarefaId={tarefa.id} definicao={{ ...definicao, valor: tarefa.camposPersonalizados?.[definicao.id] ?? null }} equipe={ctx.equipe} />
        </div>
      )
    }
    switch (colunaId) {
      case 'responsavel':
        return <span key={colunaId} {...marca(colunaId)}><SeletorResponsaveis tarefaId={tarefa.id} atuais={tarefa.responsaveis} equipe={ctx.equipe} /></span>
      case 'prazo':
        return <span key={colunaId} {...marca(colunaId)}><EditorVencimento tarefaId={tarefa.id} prazo={tarefa.prazo} horario={tarefa.horario} concluida={!!tarefa.concluidaEm} hoje={ctx.hoje} /></span>
      case 'prioridade':
        return <span key={colunaId} {...marca(colunaId)}><SeletorPrioridade tarefaId={tarefa.id} prioridade={tarefa.prioridade} /></span>
      case 'status':
        return <span key={colunaId} {...marca(colunaId)}><SeletorStatus tarefaId={tarefa.id} statusId={tarefa.statusId} opcoes={status} comNome /></span>
      case 'comentarios':
      case 'criado_por':
      case 'data_criada':
      case 'data_atualizacao':
      case 'data_conclusao':
      case 'data_inicial':
      case 'estimativa':
      case 'id_tarefa':
      case 'linha_tempo':
      case 'lista':
      case 'tempo_rastreado':
        return <span key={colunaId} {...marca(colunaId)}>{valorDaColunaNativa(colunaId, tarefa)}</span>
      case 'tagcliente':
        return (
          <span key={colunaId} {...marca(colunaId)}>
            <SeletorTagCliente tarefaId={tarefa.id} atual={tarefa.clienteId ? { id: tarefa.clienteId, nome: tarefa.clienteNome, cor: tarefa.clienteCor } : null} opcoes={ctx.tagsCliente} podeGerir={ctx.podeGerirTagCliente} />
          </span>
        )
      case 'etiquetas':
        return (
          <span key={colunaId} {...marca(colunaId)}>
            {tarefa.tags.length === 0 ? <span>—</span> : tarefa.tags.map((t) => <span key={t.id} style={{ background: t.cor }}>{t.nome}</span>)}
          </span>
        )
      default:
        return null
    }
  }
  return (
    <>
      <div data-linha={tarefa.id} style={{ gridTemplateColumns: gradeDaLista(colunas, ctx.largurasColunas) }}>
        <div>
          <input
            type="checkbox"
            checked={selecionada}
            data-tarefa-id={tarefa.id}
            onChange={(evento) => ctx.alternarSelecao?.(tarefa.id, evento.target.checked, (evento.nativeEvent as MouseEvent).shiftKey === true)}
            aria-label={`Selecionar ${tarefa.titulo}`}
          />
        </div>
        <div>
          {tarefa.filhos.length > 0 && (
            <button aria-label={aberta ? 'Recolher subtarefas' : 'Mostrar subtarefas'} onClick={() => setAberta(!aberta)} style={{ width: 20, height: 20, borderRadius: 4, color: 'var(--text-3)' }}>
              <Ic n={aberta ? 'expand_more' : 'chevron_right'} s={16} />
            </button>
          )}
        </div>
        <div><SeletorStatus tarefaId={tarefa.id} statusId={tarefa.statusId} opcoes={status} /></div>
        <div {...marca('nome')} style={{ padding: '0 12px 0 2px', paddingLeft: 2 + nivel * 18 }}>
          <Link href={`/tarefas/${tarefa.id}`} scroll={false} draggable={false} style={{ fontSize: 13 }}>
            {tarefa.titulo.trim() || <span>Sem título</span>}
          </Link>
          {!colunas.includes('tagcliente') && (
            <SeletorTagCliente
              compacto
              tarefaId={tarefa.id}
              atual={tarefa.clienteId ? { id: tarefa.clienteId, nome: tarefa.clienteNome, cor: tarefa.clienteCor } : null}
              opcoes={ctx.tagsCliente}
              podeGerir={ctx.podeGerirTagCliente}
            />
          )}
          {tarefa.filhos.length > 0 && (
            <span><Ic n="subdirectory_arrow_right" s={13} />{tarefa.filhos.filter((f) => f.concluidaEm).length}/{tarefa.filhos.length}</span>
          )}
          {tarefa.paiTitulo && <span className="hidden lg:inline" title={`Subtarefa de ${tarefa.paiTitulo}`}>↳ {tarefa.paiTitulo}</span>}
          {ctx.mostrarLista && <span className="hidden xl:inline" title={tarefa.listaNome}>{tarefa.listaNome}</span>}
          <button
            type="button"
            onClick={() => {
              setAberta(true)
              setCriandoSubtarefa(true)
            }}
            aria-label={`Adicionar subtarefa em ${tarefa.titulo}`}
            title="Adicionar subtarefa"
            style={{ width: 22, height: 22, borderRadius: 4, color: 'var(--text-3)' }}
          >
            <Ic n="subdirectory_arrow_right" s={14} />
          </button>
        </div>
        {colunas.map(celula)}
      </div>
      {aberta && tarefa.filhos.map((f) => <LinhaTarefa key={f.id} tarefa={f} nivel={nivel + 1} ctx={ctx} euId={euId} />)}
      {aberta && !criandoSubtarefa && (
        <button
          type="button"
          onClick={() => setCriandoSubtarefa(true)}
          style={{ paddingLeft: 50 + nivel * 18 }}
        >
          <CornerDownRight /> Adicionar subtarefa
        </button>
      )}
      {criandoSubtarefa && (
        <NovaTarefa
          listaId={tarefa.listaId}
          statusId={tarefa.statusId}
          euId={euId}
          paiId={tarefa.id}
          abertaInicial
          recuo={50 + nivel * 18}
          onFechar={() => setCriandoSubtarefa(false)}
          onCriada={() => setCriandoSubtarefa(false)}
        />
      )}
    </>
  )
}
