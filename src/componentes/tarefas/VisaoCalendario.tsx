'use client'

import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { CalendarDays, ChevronLeft, ChevronRight, PackageCheck, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useMemo, useState, useTransition } from 'react'
import { atualizarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { ehSubtarefa, tarefasDoCalendario } from '@/dominio/calendario'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { type Filtros, type NivelCalendario } from '@/dominio/filtros'
import { corDaOpcao, formatarValorCampo, type DefinicaoCampo } from '@/dominio/personalizacao'
import type { Pessoa, TarefaResumo } from '@/dominio/tarefas'
import { enderecoDaVisao } from '@/dominio/visao-salva'
import { avisar } from './avisar'

const NIVEIS: { valor: NivelCalendario; rotulo: string; dica: string }[] = [
  { valor: 'maes', rotulo: 'Tarefas-mãe', dica: 'Só as entregas (prazo da tarefa-mãe)' },
  { valor: 'subtarefas', rotulo: 'Subtarefas', dica: 'Só as subtarefas (cada uma na sua data)' },
  { valor: 'ambas', rotulo: 'Ambas', dica: 'Tarefas-mãe e subtarefas, separadas' },
]
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const formatadorMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function iso(ano: number, mes: number, dia: number) {
  return new Date(Date.UTC(ano, mes, dia)).toISOString().slice(0, 10)
}

function gradeDoMes(anoMes: string) {
  const [ano, mesHumano] = anoMes.split('-').map(Number)
  const mes = mesHumano - 1
  const primeiro = new Date(Date.UTC(ano, mes, 1)).getUTCDay()
  return Array.from({ length: 42 }, (_, indice) => {
    const data = new Date(Date.UTC(ano, mes, indice - primeiro + 1))
    return {
      iso: iso(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
      dia: data.getUTCDate(),
      atual: data.getUTCMonth() === mes,
    }
  })
}

/** Número da semana (ISO) da linha que começa neste domingo: usa a segunda-feira dela. */
function numeroDaSemana(domingo: string) {
  const d = new Date(`${domingo}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  const quinta = new Date(d)
  quinta.setUTCDate(d.getUTCDate() + 3)
  const inicioAno = Date.UTC(quinta.getUTCFullYear(), 0, 1)
  return Math.floor((quinta.getTime() - inicioAno) / 86400000 / 7) + 1
}

function moverMes(anoMes: string, quantidade: number) {
  const [ano, mes] = anoMes.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1 + quantidade, 1))
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Qualquer item do calendário pode ser arrastado para outro dia (muda o vencimento). */
function Arrastavel({ id, children }: { id: string; children: (a: { arrastando: boolean }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} tabIndex={-1} className={isDragging ? 'opacity-40' : undefined}>
      {children({ arrastando: isDragging })}
    </div>
  )
}

function Dia({ iso, className, children }: { iso: string; className: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: iso })
  return <div ref={setNodeRef} className={`${className} ${isOver ? 'bg-[var(--sel)]' : ''}`}>{children}</div>
}

export function VisaoCalendario({
  tarefas: todas,
  hoje,
  mesInicial,
  coresStatus,
  caminho,
  filtros,
  campos,
  equipe,
}: {
  tarefas: TarefaResumo[]
  hoje: string
  mesInicial?: string | null
  coresStatus: Record<string, string>
  caminho: string
  filtros: Filtros
  /** Campos personalizados da lista (as escolhas valem para todos os itens). */
  campos: DefinicaoCampo[]
  equipe: Pessoa[]
}) {
  const niveis = filtros.niveis
  // Vencimento escolhido por arrasto, mostrado na hora até o servidor responder (null = sem data).
  const [movidas, setMovidas] = useState<Map<string, string | null>>(new Map())
  const camposVisiveis = useMemo(() => campos.filter((c) => filtros.campos.includes(c.id)), [campos, filtros.campos])
  const [, iniciar] = useTransition()
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const comMovidas = useMemo(() => todas.map((t) => (movidas.has(t.id) ? { ...t, prazo: movidas.get(t.id) ?? null } : t)), [todas, movidas])
  const tarefas = useMemo(() => tarefasDoCalendario(comMovidas, niveis), [comMovidas, niveis])
  const soltar = ({ active, over }: DragEndEvent) => {
    const id = String(active.id)
    const novo = over ? String(over.id) : null
    const atual = comMovidas.find((t) => t.id === id)?.prazo ?? null
    if (!novo || novo === atual) return
    const anterior = todas.find((t) => t.id === id)?.prazo ?? null
    setMovidas((m) => new Map(m).set(id, novo))
    iniciar(async () => {
      const resultado = await atualizarTarefaAcao(id, { prazo: novo })
      if (resultado?.erro) setMovidas((m) => new Map(m).set(id, anterior))
      avisar(resultado)
    })
  }
  const tituloPai = useMemo(() => new Map(todas.map((t) => [t.id, t.titulo])), [todas])
  const [diasAbertos, setDiasAbertos] = useState<Set<string>>(new Set())
  const alternarDia = (iso: string) => setDiasAbertos((atual) => { const novo = new Set(atual); if (!novo.delete(iso)) novo.add(iso); return novo })
  const [anoMes, setAnoMes] = useState(mesInicial?.slice(0, 7) ?? hoje.slice(0, 7))
  const dias = useMemo(() => gradeDoMes(anoMes), [anoMes])
  const porData = useMemo(() => {
    const mapa = new Map<string, TarefaResumo[]>()
    for (const tarefa of tarefas) {
      if (!tarefa.prazo) continue
      const lista = mapa.get(tarefa.prazo) ?? []
      lista.push(tarefa)
      mapa.set(tarefa.prazo, lista)
    }
    return mapa
  }, [tarefas])
  const semData = tarefas.filter((tarefa) => !tarefa.prazo)
  const emAtraso = tarefas.filter((tarefa) => tarefa.prazo && tarefa.prazo < hoje && !tarefa.concluidaEm)
  const [ano, mes] = anoMes.split('-').map(Number)

  return (
    <section className="area-lista overflow-hidden bg-white">
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-3 border-b border-borda-fraca bg-white px-3 py-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-texto-3" />
          <div>
            <h2 className="text-destaque font-semibold capitalize text-texto">{formatadorMes.format(new Date(Date.UTC(ano, mes - 1, 1)))}</h2>
            <p className="text-legenda text-texto-3">{tarefas.length} {niveis === 'subtarefas' ? 'subtarefas' : niveis === 'maes' ? 'tarefas-mãe' : 'itens'} nesta visualização</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="O que mostrar no calendário" className="controle flex items-center gap-0.5 rounded-md border border-borda bg-white p-0.5">
          {NIVEIS.map((n) => (
            <Link
              key={n.valor}
              href={enderecoDaVisao(caminho, { ...filtros, niveis: n.valor })}
              replace
              scroll={false}
              title={n.dica}
              aria-pressed={niveis === n.valor}
              className={`rounded-md px-2.5 py-1 text-legenda font-semibold transition ${niveis === n.valor ? 'bg-petroleo text-claro' : 'text-texto-2 hover:bg-hover hover:text-texto'}`}
            >
              {n.rotulo}
            </Link>
          ))}
        </div>
        {campos.length > 0 && (
          <Popover>
            <PopoverTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-borda bg-white px-2.5 py-1.5 text-legenda font-semibold text-texto-2 shadow-sm hover:bg-hover">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Campos{camposVisiveis.length > 0 && <span className="rounded-md bg-petroleo px-1.5 text-micro text-claro">{camposVisiveis.length}</span>}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-0.5 p-2">
              <p className="px-2 pb-1 text-legenda font-medium text-texto-3">Mostrar nos itens</p>
              {campos.map((c) => {
                const marcado = filtros.campos.includes(c.id)
                const novos = marcado ? filtros.campos.filter((id) => id !== c.id) : [...filtros.campos, c.id]
                return (
                  <Link key={c.id} href={enderecoDaVisao(caminho, { ...filtros, campos: novos })} replace scroll={false} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-rotulo hover:bg-hover">
                    <span className={`flex h-4 w-4 items-center justify-center rounded border text-micro ${marcado ? 'border-petroleo bg-petroleo text-claro' : 'border-borda'}`}>{marcado && '✓'}</span>
                    <span className="truncate">{c.nome}</span>
                  </Link>
                )
              })}
            </PopoverContent>
          </Popover>
        )}
        <div className="controle flex items-center gap-1 rounded-md border border-borda bg-white p-0.5">
          <button type="button" aria-label="Mês anterior" onClick={() => setAnoMes(moverMes(anoMes, -1))} className="rounded-md p-1.5 text-texto-2 hover:bg-hover"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => setAnoMes(hoje.slice(0, 7))} className="rounded-md px-2.5 py-1 text-legenda font-semibold text-texto-2 hover:bg-hover">Hoje</button>
          <button type="button" aria-label="Próximo mês" onClick={() => setAnoMes(moverMes(anoMes, 1))} className="rounded-md p-1.5 text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></button>
        </div>
        </div>
      </div>

      {niveis === 'ambas' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-borda bg-fundo/40 px-4 py-1.5 text-legenda text-texto-2">
          <span className="inline-flex items-center gap-1.5"><PackageCheck className="h-3.5 w-3.5 text-petroleo" /> Tarefa-mãe (entrega)</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-texto-3" /> Subtarefa</span>
        </div>
      )}
      <DndContext sensors={sensores} onDragEnd={soltar}>
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] border-b border-borda bg-[var(--bg-subtle)]">
            <div className="px-1 py-2 text-center text-legenda font-medium text-texto-3" title="Semana do ano">Sem</div>
            {DIAS.map((dia) => <div key={dia} className="px-2 py-2 text-center text-legenda font-medium text-texto-3">{dia}</div>)}
          </div>
          <div className="grid auto-rows-fr grid-cols-[2.25rem_repeat(7,minmax(0,1fr))]">
            {dias.map((dia, indice) => {
              const itens = porData.get(dia.iso) ?? []
              return (
                <Fragment key={dia.iso}>
                {indice % 7 === 0 && (
                  <div className="flex items-start justify-center border-b border-r border-borda bg-fundo/70 pt-2" title={`Semana ${numeroDaSemana(dia.iso)} do ano`}>
                    <span className="rounded-md bg-white px-1 py-0.5 text-legenda font-bold text-texto-2 ring-1 ring-borda">S{numeroDaSemana(dia.iso)}</span>
                  </div>
                )}
                <Dia key={dia.iso} iso={dia.iso} className={`min-h-[104px] border-b border-r border-borda-fraca p-1 ${dia.atual ? 'bg-white' : 'bg-[var(--bg-subtle)]'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-legenda font-semibold ${dia.iso === hoje ? 'bg-[#d80d12] text-white' : dia.atual ? 'text-texto-2' : 'text-texto-3/60'}`}>{dia.dia}</span>
                  <div className="mt-1 space-y-1">
                    {(diasAbertos.has(dia.iso) ? itens : itens.slice(0, 4)).map((tarefa) => {
                      const sub = ehSubtarefa(tarefa)
                      // Cada campo escolhido vira um bloquinho; pequenos ficam lado a lado, grandes ocupam a linha.
                      const blocos = camposVisiveis.flatMap((c) => {
                        const valor = tarefa.camposPersonalizados?.[c.id]
                        if (valor == null || valor === '' || (Array.isArray(valor) && valor.length === 0)) return []
                        const texto = c.tipo === 'people' && Array.isArray(valor) ? valor.map((id) => equipe.find((p) => p.id === id)?.nome ?? '—').join(', ') : formatarValorCampo(c, valor)
                        const cor = c.tipo === 'dropdown' || c.tipo === 'labels' ? corDaOpcao(c.configuracao, String(Array.isArray(valor) ? valor[0] : valor)) : null
                        return [
                          <span key={c.id} title={`${c.nome}: ${texto}`} className="max-w-full rounded bg-fundo px-1.5 py-0.5 text-micro font-medium text-texto-2 ring-1 ring-borda" style={cor ? { background: `${cor}22` } : undefined}>
                            <span className="text-texto-3">{c.nome}:</span> <span className="break-words">{texto}</span>
                          </span>,
                        ]
                      })
                      return (
                        <Arrastavel key={tarefa.id} id={tarefa.id}>{() => (
                        <Link
                          draggable={false}
                          href={`/tarefas/${tarefa.id}`}
                          scroll={false}
                          title={sub ? `${tarefa.titulo} · subtarefa de ${tituloPai.get(tarefa.paiId ?? '') ?? 'tarefa-mãe'}` : `${tarefa.titulo} · tarefa-mãe (entrega)`}
                          className={`flex min-h-[22px] flex-col gap-1 rounded border border-borda border-l-[3px] bg-[var(--bg)] px-1.5 py-0.5 text-[12px] transition hover:bg-hover ${
                            sub ? 'font-normal' : 'font-semibold'
                          } ${tarefa.concluidaEm ? 'text-texto-3 line-through' : 'text-texto'}`}
                          style={{ borderLeftColor: coresStatus[tarefa.statusId] ?? '#87909e' }}
                        >
                          <span className="flex min-w-0 items-center gap-1">
                            {sub ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-texto-3" aria-hidden="true" /> : <PackageCheck className="h-3 w-3 shrink-0 text-petroleo" aria-hidden="true" />}
                            <span className="truncate">{tarefa.titulo}</span>
                          </span>
                          {blocos.length > 0 && <span className="flex flex-wrap gap-1">{blocos}</span>}
                        </Link>
                        )}</Arrastavel>
                      )
                    })}
                    {itens.length > 4 && (
                      <button type="button" onClick={() => alternarDia(dia.iso)} className="block w-full px-1 text-left text-legenda font-medium text-texto-3 hover:text-marca">
                        {diasAbertos.has(dia.iso) ? 'Mostrar menos' : `+${itens.length - 4} itens`}
                      </button>
                    )}
                  </div>
                </Dia>
                </Fragment>
              )
            })}
          </div>
        </div>
      </div>

      {(semData.length > 0 || emAtraso.length > 0) && (
        <div className="border-t border-borda bg-fundo/50 px-4 py-3">
          {emAtraso.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-legenda font-medium text-perigo">Em atraso · {emAtraso.length} <span className="font-medium text-texto-3">(arraste para um dia)</span></p>
              <div className="flex flex-wrap gap-2">
                {emAtraso.slice(0, 12).map((tarefa) => (
                  <Arrastavel key={tarefa.id} id={tarefa.id}>{() => (
                <Link draggable={false} href={`/tarefas/${tarefa.id}`} scroll={false} className="controle block rounded-md border border-perigo/40 bg-white px-2.5 py-1 text-legenda font-medium text-texto-2 hover:border-marca-clara hover:text-marca-escura">{tarefa.titulo}</Link>
                  )}</Arrastavel>
                ))}
                {emAtraso.length > 12 && <span className="px-2 py-1 text-legenda text-texto-3">+{emAtraso.length - 12}</span>}
              </div>
            </div>
          )}
          {semData.length > 0 && <><p className="mb-2 text-legenda font-medium text-texto-3">Sem vencimento · {semData.length} <span className="font-medium">(arraste para um dia)</span></p>
          <div className="flex flex-wrap gap-2">
            {semData.slice(0, 12).map((tarefa) => (
              <Arrastavel key={tarefa.id} id={tarefa.id}>{() => (
                <Link draggable={false} href={`/tarefas/${tarefa.id}`} scroll={false} className="controle block rounded-md border border-borda bg-white px-2.5 py-1 text-legenda font-medium text-texto-2 hover:border-marca-clara hover:text-marca-escura">{tarefa.titulo}</Link>
              )}</Arrastavel>
            ))}
            {semData.length > 12 && <span className="px-2 py-1 text-legenda text-texto-3">+{semData.length - 12}</span>}
          </div></>}
        </div>
      )}
      </DndContext>
    </section>
  )
}
