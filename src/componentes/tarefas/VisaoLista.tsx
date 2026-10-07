'use client'

import { ChevronRight, Flag, Trash2, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { arquivarTarefasAcao } from '@/app/(app)/tarefas/acoes'
import { IconeVisual } from '@/componentes/IconeVisual'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import type { No, TarefaResumo } from '@/dominio/tarefas'
import { avisar } from './avisar'
import { COLUNAS_BASE, LinhaTarefa, gradeDaLista, larguraDaColuna, type Contexto } from './LinhaTarefa'
import { NovaTarefa } from './NovaTarefa'

export type Grupo = { id: string; nome: string; cor: string; tarefas: No<TarefaResumo>[]; statusId?: string }

type LimiteColuna = { minima: number; maxima: number; largura: number }
type Arraste = { id: string; inicioX: number; larguraInicial: number; minima: number; maxima: number; pointerId: number }

const limitar = (valor: number, minima: number, maxima: number) => Math.min(maxima, Math.max(minima, Math.round(valor)))

function tarefasEmProfundidade(tarefas: No<TarefaResumo>[]): No<TarefaResumo>[] {
  return tarefas.flatMap((tarefa) => [tarefa, ...tarefasEmProfundidade(tarefa.filhos)])
}

function limiteDaColuna(id: string, campos: DefinicaoCampo[]): LimiteColuna {
  const base = COLUNAS_BASE.find((coluna) => coluna.id === id)
  if (base) return base
  return campos.some((campo) => `campo:${campo.id}` === id)
    ? { largura: 180, minima: 120, maxima: 600 }
    : { largura: 180, minima: 100, maxima: 600 }
}

function CabecalhoColuna({ children, colunaId, className = '', onPointerDown, onPointerMove, onPointerUp, onKeyDown, onReset }: {
  children: ReactNode
  colunaId: string
  className?: string
  onPointerDown: (id: string, evento: PointerEvent<HTMLButtonElement>) => void
  onPointerMove: (evento: PointerEvent<HTMLButtonElement>) => void
  onPointerUp: (evento: PointerEvent<HTMLButtonElement>) => void
  onKeyDown: (id: string, evento: KeyboardEvent<HTMLButtonElement>) => void
  onReset: (id: string) => void
}) {
  return (
    <span className={`relative flex h-full min-w-0 items-center px-2 ${className}`}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <button
        type="button"
        role="separator"
        aria-orientation="vertical"
        aria-label={`Redimensionar coluna ${typeof children === 'string' ? children : colunaId}`}
        title="Arraste para redimensionar. Duplo clique restaura a largura."
        onPointerDown={(evento) => onPointerDown(colunaId, evento)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => onReset(colunaId)}
        onKeyDown={(evento) => onKeyDown(colunaId, evento)}
        className="absolute -right-1 top-0 z-10 flex h-full w-3 cursor-col-resize touch-none items-center justify-center outline-none after:h-4 after:w-px after:bg-borda-forte hover:after:h-6 hover:after:bg-marca focus-visible:after:h-6 focus-visible:after:w-0.5 focus-visible:after:bg-marca"
      />
    </span>
  )
}

export function VisaoLista({ grupos, ctx, criarEm, euId, chaveLarguras }: { grupos: Grupo[]; ctx: Contexto; criarEm?: string; euId: string; chaveLarguras?: string }) {
  const [fechados, setFechados] = useState<Set<string>>(new Set())
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [excluindo, iniciarExclusao] = useTransition()
  const [larguras, setLarguras] = useState<Record<string, number>>({})
  const largurasRef = useRef(larguras)
  const arrasteRef = useRef<Arraste | null>(null)
  const campos = ctx.camposPersonalizados ?? []
  const chaveStorage = chaveLarguras ? `srv:list-columns:v1:${chaveLarguras}` : null
  const tarefas = useMemo(() => grupos.flatMap((grupo) => tarefasEmProfundidade(grupo.tarefas)), [grupos])
  const idsTarefas = useMemo(() => tarefas.map((tarefa) => tarefa.id), [tarefas])
  const todasSelecionadas = idsTarefas.length > 0 && idsTarefas.every((id) => selecionadas.has(id))

  useEffect(() => {
    if (!chaveStorage) return
    let quadro = 0
    try {
      const salvas = JSON.parse(localStorage.getItem(chaveStorage) ?? '{}') as Record<string, unknown>
      const validas = Object.fromEntries(Object.entries(salvas).filter(([, valor]) => typeof valor === 'number' && Number.isFinite(valor))) as Record<string, number>
      quadro = requestAnimationFrame(() => {
        largurasRef.current = validas
        setLarguras(validas)
      })
    } catch {
      localStorage.removeItem(chaveStorage)
    }
    return () => cancelAnimationFrame(quadro)
  }, [chaveStorage])

  const aplicarLargura = (id: string, largura: number) => {
    const limite = limiteDaColuna(id, campos)
    const proximas = { ...largurasRef.current, [id]: limitar(largura, limite.minima, limite.maxima) }
    largurasRef.current = proximas
    setLarguras(proximas)
  }

  const persistir = () => {
    if (chaveStorage) localStorage.setItem(chaveStorage, JSON.stringify(largurasRef.current))
  }

  const iniciarRedimensionamento = (id: string, evento: PointerEvent<HTMLButtonElement>) => {
    const limite = limiteDaColuna(id, campos)
    arrasteRef.current = { id, inicioX: evento.clientX, larguraInicial: larguraDaColuna(id, largurasRef.current), minima: limite.minima, maxima: limite.maxima, pointerId: evento.pointerId }
    evento.currentTarget.setPointerCapture(evento.pointerId)
    evento.preventDefault()
  }

  const moverRedimensionamento = (evento: PointerEvent<HTMLButtonElement>) => {
    const arraste = arrasteRef.current
    if (!arraste || arraste.pointerId !== evento.pointerId) return
    aplicarLargura(arraste.id, limitar(arraste.larguraInicial + evento.clientX - arraste.inicioX, arraste.minima, arraste.maxima))
  }

  const finalizarRedimensionamento = (evento: PointerEvent<HTMLButtonElement>) => {
    if (arrasteRef.current?.pointerId !== evento.pointerId) return
    arrasteRef.current = null
    if (evento.currentTarget.hasPointerCapture(evento.pointerId)) evento.currentTarget.releasePointerCapture(evento.pointerId)
    persistir()
  }

  const redimensionarComTeclado = (id: string, evento: KeyboardEvent<HTMLButtonElement>) => {
    if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return
    evento.preventDefault()
    aplicarLargura(id, larguraDaColuna(id, largurasRef.current) + (evento.key === 'ArrowRight' ? 16 : -16))
    persistir()
  }

  const restaurarLargura = (id: string) => {
    const proximas = { ...largurasRef.current }
    delete proximas[id]
    largurasRef.current = proximas
    setLarguras(proximas)
    if (chaveStorage) localStorage.setItem(chaveStorage, JSON.stringify(proximas))
  }

  const alternar = (id: string) => {
    const novo = new Set(fechados)
    if (novo.has(id)) novo.delete(id)
    else novo.add(id)
    setFechados(novo)
  }
  const alternarSelecao = (id: string, selecionada: boolean) => {
    setSelecionadas((atuais) => {
      const proximas = new Set(atuais)
      if (selecionada) proximas.add(id)
      else proximas.delete(id)
      return proximas
    })
  }
  const alternarTodas = () => setSelecionadas(todasSelecionadas ? new Set() : new Set(idsTarefas))
  const idsRaizSelecionados = () => {
    const paiPorId = new Map(tarefas.map((tarefa) => [tarefa.id, tarefa.paiId]))
    return [...selecionadas].filter((id) => {
      let pai = paiPorId.get(id)
      while (pai) {
        if (selecionadas.has(pai)) return false
        pai = paiPorId.get(pai)
      }
      return true
    })
  }
  const excluirSelecionadas = () => {
    const quantidade = selecionadas.size
    if (!quantidade || !confirm(`Excluir ${quantidade} ${quantidade === 1 ? 'tarefa' : 'tarefas'}? As subtarefas relacionadas também serão removidas da visualização.`)) return
    iniciarExclusao(async () => {
      if (!avisar(await arquivarTarefasAcao(idsRaizSelecionados()), true)) return
      setSelecionadas(new Set())
    })
  }
  const contexto = { ...ctx, largurasColunas: larguras, selecionadas, alternarSelecao }
  const propsRedimensionamento = {
    onPointerDown: iniciarRedimensionamento,
    onPointerMove: moverRedimensionamento,
    onPointerUp: finalizarRedimensionamento,
    onKeyDown: redimensionarComTeclado,
    onReset: restaurarLargura,
  }
  return (
    <div className="space-y-2">
      {selecionadas.size > 0 && (
        <div className="sticky top-0 z-20 flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-white/95 px-3 py-2 shadow-lg shadow-sky-950/5 backdrop-blur">
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700">{selecionadas.size} {selecionadas.size === 1 ? 'selecionada' : 'selecionadas'}</span>
          <button type="button" disabled={excluindo} onClick={excluirSelecionadas} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-50 px-3 text-[12px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />{excluindo ? 'Excluindo…' : 'Excluir'}</button>
          <button type="button" disabled={excluindo} onClick={() => setSelecionadas(new Set())} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-texto-3 transition hover:bg-hover hover:text-texto"><X className="h-3.5 w-3.5" /> Limpar seleção</button>
        </div>
      )}
      <div className="overflow-x-auto pb-2">
        <div className="space-y-5" style={{ width: gradeDaLista(campos, larguras).split(' ').reduce((total, parte) => total + Number.parseInt(parte, 10), 0) }}>
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
              <div className="grid min-h-8 items-center border-t border-borda bg-[#fbfbfc] text-[10px] font-semibold uppercase tracking-[0.045em] text-texto-3" style={{ gridTemplateColumns: gradeDaLista(campos, larguras) }}>
                <CabecalhoColuna colunaId="nome" className="pl-3" {...propsRedimensionamento}><span className="flex items-center gap-2"><input type="checkbox" checked={todasSelecionadas} onChange={alternarTodas} aria-label="Selecionar todas as tarefas" className="h-3.5 w-3.5 cursor-pointer accent-sky-600" /> Nome</span></CabecalhoColuna>
                <CabecalhoColuna colunaId="responsavel" {...propsRedimensionamento}><span className="flex items-center gap-1"><UserRound className="h-3 w-3" /> Responsável</span></CabecalhoColuna>
                <CabecalhoColuna colunaId="prazo" {...propsRedimensionamento}>Prazo</CabecalhoColuna>
                <CabecalhoColuna colunaId="prioridade" {...propsRedimensionamento}><Flag className="h-3 w-3" /></CabecalhoColuna>
                {campos.map((definicao) => (
                  <CabecalhoColuna key={definicao.id} colunaId={`campo:${definicao.id}`} className="border-l border-borda/70" {...propsRedimensionamento}>
                    <span className="flex min-w-0 items-center gap-1.5" title={definicao.nome}><span style={{ color: definicao.cor }}><IconeVisual icone={definicao.icone} className="h-3.5 w-3.5" /></span><span className="truncate">{definicao.nome}</span></span>
                  </CabecalhoColuna>
                ))}
              </div>
              {g.tarefas.map((t) => (
                <LinhaTarefa key={t.id} tarefa={t} nivel={0} ctx={contexto} euId={euId} />
              ))}
              {criarEm && <NovaTarefa listaId={criarEm} statusId={g.statusId} euId={euId} />}
            </>
          )}
        </section>
      ))}
        </div>
      </div>
    </div>
  )
}
