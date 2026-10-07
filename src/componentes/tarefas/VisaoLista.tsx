'use client'

import { Archive, ArrowLeftToLine, ArrowRightToLine, ChevronRight, EyeOff, Flag, MoveHorizontal, Settings2, Trash2, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { arquivarCampoGestaoAcao } from '@/app/(app)/config/campos/acoes'
import { arquivarTarefasAcao } from '@/app/(app)/tarefas/acoes'
import { IconeVisual } from '@/componentes/IconeVisual'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import type { No, TarefaResumo } from '@/dominio/tarefas'
import { avisar } from './avisar'
import { ConfigurarCampo } from './ConfigurarCampo'
import { COLUNAS_BASE, LinhaTarefa, gradeDaLista, larguraDaColuna, type Contexto } from './LinhaTarefa'
import { NovaTarefa } from './NovaTarefa'

export type Grupo = { id: string; nome: string; cor: string; tarefas: No<TarefaResumo>[]; statusId?: string }

type LimiteColuna = { minima: number; maxima: number; largura: number }
type ConfigCampos = { ocultas: string[]; ordem: string[] }
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
  const [configurando, setConfigurando] = useState<string | null>(null)
  const [config, setConfig] = useState<ConfigCampos>({ ocultas: [], ordem: [] })
  const campos = useMemo(() => ctx.camposPersonalizados ?? [], [ctx.camposPersonalizados])
  const chaveStorage = chaveLarguras ? `srv:list-columns:v1:${chaveLarguras}` : null
  const chaveCampos = chaveLarguras ? `srv:list-fields:v1:${chaveLarguras}` : null
  // A visibilidade na lista é independente da tarefa: ocultar aqui não remove o campo da tarefa.
  const camposVisiveis = useMemo(() => {
    const posicao = (id: string) => { const i = config.ordem.indexOf(id); return i < 0 ? config.ordem.length : i }
    return campos.filter((campo) => !config.ocultas.includes(campo.id)).sort((a, b) => posicao(a.id) - posicao(b.id))
  }, [campos, config])
  const camposOcultos = campos.filter((campo) => config.ocultas.includes(campo.id))
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

  useEffect(() => {
    if (!chaveCampos) return
    let quadro = 0
    try {
      const salva = JSON.parse(localStorage.getItem(chaveCampos) ?? 'null') as Partial<ConfigCampos> | null
      const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
      if (salva) quadro = requestAnimationFrame(() => setConfig({ ocultas: lista(salva.ocultas), ordem: lista(salva.ordem) }))
    } catch {
      localStorage.removeItem(chaveCampos)
    }
    return () => cancelAnimationFrame(quadro)
  }, [chaveCampos])

  const atualizarCampos = (mudar: (atual: ConfigCampos) => ConfigCampos) => {
    const proxima = mudar(config)
    setConfig(proxima)
    if (chaveCampos) localStorage.setItem(chaveCampos, JSON.stringify(proxima))
  }
  const ocultarCampo = (id: string) => atualizarCampos((c) => ({ ...c, ocultas: [...c.ocultas, id] }))
  const mostrarCampo = (id: string) => atualizarCampos((c) => ({ ...c, ocultas: c.ocultas.filter((x) => x !== id) }))
  const moverCampo = (id: string, para: 'inicio' | 'final') =>
    atualizarCampos((c) => {
      const ids = camposVisiveis.map((campo) => campo.id).filter((x) => x !== id)
      return { ...c, ordem: para === 'inicio' ? [id, ...ids] : [...ids, id] }
    })

  const arquivarCampo = (id: string, nome: string) => {
    if (!confirm(`Arquivar "${nome}"? Ele some das listas, mas os valores já preenchidos nas tarefas são preservados.`)) return
    void arquivarCampoGestaoAcao(id).then((r) => avisar(r, true))
  }

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
  const contexto = { ...ctx, camposPersonalizados: camposVisiveis, largurasColunas: larguras, selecionadas, alternarSelecao }
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
      {configurando && <ConfigurarCampo campoId={configurando} aoFechar={() => setConfigurando(null)} />}
      {camposOcultos.length > 0 && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-texto-3 outline-none transition hover:bg-hover hover:text-texto"><EyeOff className="h-3.5 w-3.5" />{camposOcultos.length} {camposOcultos.length === 1 ? 'coluna oculta' : 'colunas ocultas'}</DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {camposOcultos.map((campo) => <DropdownMenuItem key={campo.id} onSelect={() => mostrarCampo(campo.id)}><span style={{ color: campo.cor }}><IconeVisual icone={campo.icone} className="h-4 w-4" /></span>Mostrar {campo.nome}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="overflow-x-auto pb-2">
        <div className="space-y-5" style={{ minWidth: gradeDaLista(camposVisiveis, larguras).match(/\d+(?=px)/g)!.reduce((total, parte) => total + Number(parte), 0) }}>
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
              <div className="grid min-h-8 items-center border-t border-borda bg-[#fbfbfc] text-[10px] font-semibold uppercase tracking-[0.045em] text-texto-3" style={{ gridTemplateColumns: gradeDaLista(camposVisiveis, larguras) }}>
                <CabecalhoColuna colunaId="nome" className="pl-3" {...propsRedimensionamento}><span className="flex items-center gap-2"><input type="checkbox" checked={todasSelecionadas} onChange={alternarTodas} aria-label="Selecionar todas as tarefas" className="h-3.5 w-3.5 cursor-pointer accent-sky-600" /> Nome</span></CabecalhoColuna>
                <CabecalhoColuna colunaId="responsavel" {...propsRedimensionamento}><span className="flex items-center gap-1"><UserRound className="h-3 w-3" /> Responsável</span></CabecalhoColuna>
                <CabecalhoColuna colunaId="prazo" {...propsRedimensionamento}>Prazo</CabecalhoColuna>
                <CabecalhoColuna colunaId="prioridade" {...propsRedimensionamento}><Flag className="h-3 w-3" /></CabecalhoColuna>
                {camposVisiveis.map((definicao) => (
                  <CabecalhoColuna key={definicao.id} colunaId={`campo:${definicao.id}`} className="border-l border-borda/70" {...propsRedimensionamento}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex w-full min-w-0 items-center gap-1.5 rounded px-1 py-1 text-left uppercase outline-none transition hover:bg-hover focus-visible:ring-2 focus-visible:ring-marca/30" title={definicao.nome}>
                        <span style={{ color: definicao.cor }}><IconeVisual icone={definicao.icone} className="h-3.5 w-3.5" /></span><span className="truncate">{definicao.nome}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52 normal-case">
                        <DropdownMenuItem onSelect={() => ocultarCampo(definicao.id)}><EyeOff className="h-4 w-4" />Ocultar coluna</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => moverCampo(definicao.id, 'inicio')}><ArrowLeftToLine className="h-4 w-4" />Mover para o início</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => moverCampo(definicao.id, 'final')}><ArrowRightToLine className="h-4 w-4" />Mover para o final</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => restaurarLargura(`campo:${definicao.id}`)}><MoveHorizontal className="h-4 w-4" />Restaurar largura</DropdownMenuItem>
                        {ctx.podeEditarCampos && (
                          <>
                            <DropdownMenuItem onSelect={() => setConfigurando(definicao.id)}><Settings2 className="h-4 w-4" />Configurar campo…</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onSelect={() => arquivarCampo(definicao.id, definicao.nome)}><Archive className="h-4 w-4" />Arquivar campo</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
