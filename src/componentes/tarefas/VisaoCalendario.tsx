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
    <div ref={setNodeRef} {...attributes} {...listeners} tabIndex={-1}>
      {children({ arrastando: isDragging })}
    </div>
  )
}

function Dia({ iso, className, children }: { iso: string; className?: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: iso })
  return <div ref={setNodeRef}>{children}</div>
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
    <section>
      <div>
        <div>
          <CalendarDays />
          <div>
            <h2>{formatadorMes.format(new Date(Date.UTC(ano, mes - 1, 1)))}</h2>
            <p>{tarefas.length} {niveis === 'subtarefas' ? 'subtarefas' : niveis === 'maes' ? 'tarefas-mãe' : 'itens'} nesta visualização</p>
          </div>
        </div>
        <div>
        <div role="group" aria-label="O que mostrar no calendário">
          {NIVEIS.map((n) => (
            <Link
              key={n.valor}
              href={enderecoDaVisao(caminho, { ...filtros, niveis: n.valor })}
              replace
              scroll={false}
              title={n.dica}
              aria-pressed={niveis === n.valor}
            >
              {n.rotulo}
            </Link>
          ))}
        </div>
        {campos.length > 0 && (
          <Popover>
            <PopoverTrigger>
              <SlidersHorizontal /> Campos{camposVisiveis.length > 0 && <span>{camposVisiveis.length}</span>}
            </PopoverTrigger>
            <PopoverContent align="end">
              <p>Mostrar nos itens</p>
              {campos.map((c) => {
                const marcado = filtros.campos.includes(c.id)
                const novos = marcado ? filtros.campos.filter((id) => id !== c.id) : [...filtros.campos, c.id]
                return (
                  <Link key={c.id} href={enderecoDaVisao(caminho, { ...filtros, campos: novos })} replace scroll={false}>
                    <span>{marcado && '✓'}</span>
                    <span>{c.nome}</span>
                  </Link>
                )
              })}
            </PopoverContent>
          </Popover>
        )}
        <div>
          <button type="button" aria-label="Mês anterior" onClick={() => setAnoMes(moverMes(anoMes, -1))}><ChevronLeft /></button>
          <button type="button" onClick={() => setAnoMes(hoje.slice(0, 7))}>Hoje</button>
          <button type="button" aria-label="Próximo mês" onClick={() => setAnoMes(moverMes(anoMes, 1))}><ChevronRight /></button>
        </div>
        </div>
      </div>

      {niveis === 'ambas' && (
        <div>
          <span><PackageCheck /> Tarefa-mãe (entrega)</span>
          <span><span /> Subtarefa</span>
        </div>
      )}
      <DndContext sensors={sensores} onDragEnd={soltar}>
      <div>
        <div>
          <div>
            <div title="Semana do ano">Sem</div>
            {DIAS.map((dia) => <div key={dia}>{dia}</div>)}
          </div>
          <div>
            {dias.map((dia, indice) => {
              const itens = porData.get(dia.iso) ?? []
              return (
                <Fragment key={dia.iso}>
                {indice % 7 === 0 && (
                  <div title={`Semana ${numeroDaSemana(dia.iso)} do ano`}>
                    <span>S{numeroDaSemana(dia.iso)}</span>
                  </div>
                )}
                <Dia key={dia.iso} iso={dia.iso}>
                  <span>{dia.dia}</span>
                  <div>
                    {(diasAbertos.has(dia.iso) ? itens : itens.slice(0, 4)).map((tarefa) => {
                      const sub = ehSubtarefa(tarefa)
                      // Cada campo escolhido vira um bloquinho; pequenos ficam lado a lado, grandes ocupam a linha.
                      const blocos = camposVisiveis.flatMap((c) => {
                        const valor = tarefa.camposPersonalizados?.[c.id]
                        if (valor == null || valor === '' || (Array.isArray(valor) && valor.length === 0)) return []
                        const texto = c.tipo === 'people' && Array.isArray(valor) ? valor.map((id) => equipe.find((p) => p.id === id)?.nome ?? '—').join(', ') : formatarValorCampo(c, valor)
                        const cor = c.tipo === 'dropdown' || c.tipo === 'labels' ? corDaOpcao(c.configuracao, String(Array.isArray(valor) ? valor[0] : valor)) : null
                        return [
                          <span key={c.id} title={`${c.nome}: ${texto}`} style={cor ? { background: `${cor}22` } : undefined}>
                            <span>{c.nome}:</span> <span>{texto}</span>
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
                          style={{ borderLeftColor: coresStatus[tarefa.statusId] ?? '#87909e' }}
                        >
                          <span>
                            {sub ? <span aria-hidden="true" /> : <PackageCheck aria-hidden="true" />}
                            <span>{tarefa.titulo}</span>
                          </span>
                          {blocos.length > 0 && <span>{blocos}</span>}
                        </Link>
                        )}</Arrastavel>
                      )
                    })}
                    {itens.length > 4 && (
                      <button type="button" onClick={() => alternarDia(dia.iso)}>
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
        <div>
          {emAtraso.length > 0 && (
            <div>
              <p>Em atraso · {emAtraso.length} <span>(arraste para um dia)</span></p>
              <div>
                {emAtraso.slice(0, 12).map((tarefa) => (
                  <Arrastavel key={tarefa.id} id={tarefa.id}>{() => (
                <Link draggable={false} href={`/tarefas/${tarefa.id}`} scroll={false}>{tarefa.titulo}</Link>
                  )}</Arrastavel>
                ))}
                {emAtraso.length > 12 && <span>+{emAtraso.length - 12}</span>}
              </div>
            </div>
          )}
          {semData.length > 0 && <><p>Sem vencimento · {semData.length} <span>(arraste para um dia)</span></p>
          <div>
            {semData.slice(0, 12).map((tarefa) => (
              <Arrastavel key={tarefa.id} id={tarefa.id}>{() => (
                <Link draggable={false} href={`/tarefas/${tarefa.id}`} scroll={false}>{tarefa.titulo}</Link>
              )}</Arrastavel>
            ))}
            {semData.length > 12 && <span>+{semData.length - 12}</span>}
          </div></>}
        </div>
      )}
      </DndContext>
    </section>
  )
}
