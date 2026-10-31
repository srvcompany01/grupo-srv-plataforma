'use client'

import { diaDaSemana } from '@/dominio/prazo'
import { Calendar, Check, X, Eye, EyeOff, Flag, Hourglass, Tag, Timer, User } from 'lucide-react'
import { useState, useTransition } from 'react'
import { atualizarTarefaAcao, criarEtiquetaAcao, definirEtiquetaAcao } from '@/app/(app)/tarefas/acoes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { formatarDuracao } from '@/dominio/formatar'
import { type Pessoa, type StatusLista } from '@/dominio/tarefas'
import { SeletorPrioridade } from '../SeletorPrioridade'
import { botaoFantasma, campo } from '@/lib/ui'
import type { TarefaCompleta } from '@/servicos/tarefas'
import { avisar } from '../avisar'
import { SeletorResponsaveis } from '../SeletorResponsaveis'
import { SeletorTagCliente } from '../SeletorTagCliente'
import type { Opcao } from './TelaTarefa'

function Linha({ icone: Icone, titulo, children }: { icone: React.ComponentType<{ className?: string }>; titulo: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[30px] grid-cols-[108px_1fr] items-center gap-2 text-corpo">
      <span className="flex items-center gap-2 text-texto-2">
        <Icone className="h-4 w-4 shrink-0 text-texto-3" />
        {titulo}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function Vazio({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded px-1.5 py-0.5 text-texto-3 hover:bg-hover">
      Vazio
    </button>
  )
}

export function GradePropriedades({
  tarefa: t,
  status,
  equipe,
  tags,
  tagsCliente,
  podeGerir,
  hoje,
  children,
}: {
  tarefa: TarefaCompleta
  status: StatusLista[]
  equipe: Pessoa[]
  tags: Opcao[]
  tagsCliente: Opcao[]
  podeGerir: boolean
  hoje: string
  /** Conteúdo da célula "Rastrear tempo". */
  children?: React.ReactNode
}) {
  const espacoId = t.lista.espacoId
  const [pendente, iniciar] = useTransition()
  const [novaTag, setNovaTag] = useState('')
  const [editandoEstimativa, setEditandoEstimativa] = useState(false)
  const salvar = (campos: Parameters<typeof atualizarTarefaAcao>[1]) => iniciar(async () => void avisar(await atualizarTarefaAcao(t.id, campos)))
  const vencida = !!t.prazo && !t.concluidaEm && t.prazo < hoje
  const horas = t.estimativaMin != null ? Math.floor(t.estimativaMin / 60) : ''
  const minutos = t.estimativaMin != null ? t.estimativaMin % 60 : ''

  function salvarEstimativa(form: HTMLFormElement) {
    const h = Number((form.elements.namedItem('h') as HTMLInputElement).value || 0)
    const m = Number((form.elements.namedItem('m') as HTMLInputElement).value || 0)
    const total = h * 60 + m
    if (total !== (t.estimativaMin ?? 0)) salvar({ estimativaMin: total || null })
  }

  return (
    <div className="grid gap-x-6 gap-y-1 @2xl:grid-cols-2">
      <div className="space-y-1">
        <Linha icone={Tag} titulo="Cliente">
          <SeletorTagCliente
            tarefaId={t.id}
            atual={t.lista.clienteId ? { id: t.lista.clienteId, nome: t.lista.clienteNome, cor: t.lista.clienteCor } : null}
            opcoes={tagsCliente}
            podeGerir={podeGerir}
          />
        </Linha>
        <Linha icone={Calendar} titulo="Vencimento">
          <span className="flex items-center gap-1.5">
            <input
              type="date"
              aria-label="Vencimento"
              defaultValue={t.prazo ?? ''}
              onChange={(e) => e.target.value !== (t.prazo ?? '') && salvar({ prazo: e.target.value || null, horario: e.target.value ? (t.horario ?? null) : null })}
              className={`${campo} h-8 w-36 py-0 ${vencida ? 'border-perigo-borda text-perigo' : ''}`}
            />
            {t.prazo && (
              <>
                <input
                  type="time"
                  aria-label="Horário do vencimento (opcional)"
                  title="Horário (opcional)"
                  defaultValue={t.horario ?? ''}
                  onChange={(e) => e.target.value !== (t.horario ?? '') && salvar({ prazo: t.prazo, horario: e.target.value || null })}
                  className={`${campo} h-8 w-28 py-0 ${vencida ? 'border-perigo-borda text-perigo' : ''}`}
                />
                <span className={`whitespace-nowrap text-legenda ${vencida ? 'text-perigo' : 'text-texto-3'}`}>({diaDaSemana(t.prazo)})</span>
                <button type="button" disabled={pendente} onClick={() => salvar({ prazo: null })} aria-label="Limpar vencimento" title="Limpar vencimento" className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </span>
        </Linha>

        <Linha icone={Hourglass} titulo="Estimativa de tempo">
          {editandoEstimativa || t.estimativaMin != null ? (
            <form onBlur={(e) => salvarEstimativa(e.currentTarget)} onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-1">
              <input name="h" type="number" min={0} autoFocus={editandoEstimativa} defaultValue={horas} aria-label="Horas" className={`${campo} h-8 w-16 py-0`} /> h
              <input name="m" type="number" min={0} max={59} defaultValue={minutos} aria-label="Minutos" className={`${campo} h-8 w-16 py-0`} /> min
              {t.estimativaMin != null && <span className="ml-1 text-rotulo text-texto-3">({formatarDuracao(t.estimativaMin * 60)})</span>}
            </form>
          ) : (
            <Vazio onClick={() => setEditandoEstimativa(true)} />
          )}
        </Linha>

        <Linha icone={Tag} titulo="Etiquetas">
          <div className="flex flex-wrap items-center gap-1">
            {t.tags.map((g) => (
              <span key={g.id} className="rounded px-1.5 py-0.5 text-legenda text-claro" style={{ background: g.cor }}>
                {g.nome}
              </span>
            ))}
            <Popover>
              <PopoverTrigger aria-label="Etiquetas" className="rounded px-1.5 py-0.5 text-texto-3 hover:bg-hover">
                {t.tags.length === 0 ? 'Vazio' : <Tag className="h-3.5 w-3.5" />}
              </PopoverTrigger>
              <PopoverContent className="w-56 space-y-1 p-2" align="start">
                {tags.length === 0 && <p className="text-rotulo text-texto-3">Nenhuma etiqueta neste departamento.</p>}
                {tags.map((g) => {
                  const marcada = t.tags.some((x) => x.id === g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => iniciar(async () => void avisar(await definirEtiquetaAcao(t.id, g.id, !marcada)))}
                      className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-corpo hover:bg-hover"
                    >
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.cor }} />
                      <span className="flex-1 text-left">{g.nome}</span>
                      {marcada && <Check className="h-3.5 w-3.5 text-marca" />}
                    </button>
                  )
                })}
                {podeGerir && espacoId && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      iniciar(async () => {
                        if (avisar(await criarEtiquetaAcao(t.id, espacoId, novaTag, '#7b68ee'))) setNovaTag('')
                      })
                    }}
                    className="border-t border-borda pt-1"
                  >
                    <input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} placeholder="Nova etiqueta + Enter" className="w-full px-1.5 py-1 text-corpo outline-none" />
                  </form>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </Linha>
      </div>

      <div className="space-y-1">
        <Linha icone={User} titulo="Responsáveis">
          <SeletorResponsaveis tarefaId={t.id} atuais={t.responsaveis} equipe={equipe} />
        </Linha>
        <Linha icone={Flag} titulo="Prioridade">
          <SeletorPrioridade tarefaId={t.id} prioridade={t.prioridade} className="-ml-1.5" />
        </Linha>
        <Linha icone={Timer} titulo="Rastrear tempo">
          {children ?? <span className="text-texto-3">—</span>}
        </Linha>
        <Linha icone={t.visivelCliente ? Eye : EyeOff} titulo="Cliente vê?">
          <button onClick={() => salvar({ visivelCliente: !t.visivelCliente })} disabled={pendente} className={`${botaoFantasma} ${t.visivelCliente ? 'text-sucesso-forte' : ''}`}>
            {t.visivelCliente ? 'Visível no portal' : 'Só a equipe vê'}
          </button>
        </Linha>
      </div>
    </div>
  )
}
