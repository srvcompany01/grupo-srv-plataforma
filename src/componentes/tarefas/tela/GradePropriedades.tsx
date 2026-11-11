'use client'

import { diaDaSemana } from '@/dominio/prazo'
import { Calendar, Check, X, Eye, EyeOff, Flag, Hourglass, Tag, Timer, User } from 'lucide-react'
import { useState, useTransition } from 'react'
import { atualizarTarefaAcao, criarEtiquetaAcao, definirEtiquetaAcao } from '@/app/(app)/tarefas/acoes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { formatarDuracao } from '@/dominio/formatar'
import { type Pessoa, type StatusLista } from '@/dominio/tarefas'
import { SeletorPrioridade } from '../SeletorPrioridade'
import type { TarefaCompleta } from '@/servicos/tarefas'
import { avisar } from '../avisar'
import { SeletorResponsaveis } from '../SeletorResponsaveis'
import { SeletorTagCliente } from '../SeletorTagCliente'
import type { Opcao } from './TelaTarefa'

function Linha({ icone: Icone, titulo, children }: { icone: React.ComponentType<{ className?: string }>; titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <span>
        <Icone />
        {titulo}
      </span>
      <div>{children}</div>
    </div>
  )
}

function Vazio({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}>
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
    <div>
      <div>
        <Linha icone={Tag} titulo="Cliente">
          <SeletorTagCliente
            tarefaId={t.id}
            atual={t.lista.clienteId ? { id: t.lista.clienteId, nome: t.lista.clienteNome, cor: t.lista.clienteCor } : null}
            opcoes={tagsCliente}
            podeGerir={podeGerir}
          />
        </Linha>
        <Linha icone={Calendar} titulo="Vencimento">
          <span>
            <input
              type="date"
              aria-label="Vencimento"
              defaultValue={t.prazo ?? ''}
              onChange={(e) => e.target.value !== (t.prazo ?? '') && salvar({ prazo: e.target.value || null, horario: e.target.value ? (t.horario ?? null) : null })}
            />
            {t.prazo && (
              <>
                <input
                  type="time"
                  aria-label="Horário do vencimento (opcional)"
                  title="Horário (opcional)"
                  defaultValue={t.horario ?? ''}
                  onChange={(e) => e.target.value !== (t.horario ?? '') && salvar({ prazo: t.prazo, horario: e.target.value || null })}
                />
                <span>({diaDaSemana(t.prazo)})</span>
                <button type="button" disabled={pendente} onClick={() => salvar({ prazo: null })} aria-label="Limpar vencimento" title="Limpar vencimento">
                  <X />
                </button>
              </>
            )}
          </span>
        </Linha>

        <Linha icone={Hourglass} titulo="Estimativa de tempo">
          {editandoEstimativa || t.estimativaMin != null ? (
            <form onBlur={(e) => salvarEstimativa(e.currentTarget)} onSubmit={(e) => e.preventDefault()}>
              <input name="h" type="number" min={0} autoFocus={editandoEstimativa} defaultValue={horas} aria-label="Horas" /> h
              <input name="m" type="number" min={0} max={59} defaultValue={minutos} aria-label="Minutos" /> min
              {t.estimativaMin != null && <span>({formatarDuracao(t.estimativaMin * 60)})</span>}
            </form>
          ) : (
            <Vazio onClick={() => setEditandoEstimativa(true)} />
          )}
        </Linha>

        <Linha icone={Tag} titulo="Etiquetas">
          <div>
            {t.tags.map((g) => (
              <span key={g.id} style={{ background: g.cor }}>
                {g.nome}
              </span>
            ))}
            <Popover>
              <PopoverTrigger aria-label="Etiquetas">
                {t.tags.length === 0 ? 'Vazio' : <Tag />}
              </PopoverTrigger>
              <PopoverContent align="start">
                {tags.length === 0 && <p>Nenhuma etiqueta neste departamento.</p>}
                {tags.map((g) => {
                  const marcada = t.tags.some((x) => x.id === g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => iniciar(async () => void avisar(await definirEtiquetaAcao(t.id, g.id, !marcada)))}
                    >
                      <span style={{ background: g.cor }} />
                      <span>{g.nome}</span>
                      {marcada && <Check />}
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
                  >
                    <input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} placeholder="Nova etiqueta + Enter" />
                  </form>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </Linha>
      </div>

      <div>
        <Linha icone={User} titulo="Responsáveis">
          <SeletorResponsaveis tarefaId={t.id} atuais={t.responsaveis} equipe={equipe} />
        </Linha>
        <Linha icone={Flag} titulo="Prioridade">
          <SeletorPrioridade tarefaId={t.id} prioridade={t.prioridade} />
        </Linha>
        <Linha icone={Timer} titulo="Rastrear tempo">
          {children ?? <span>—</span>}
        </Linha>
        <Linha icone={t.visivelCliente ? Eye : EyeOff} titulo="Cliente vê?">
          <button onClick={() => salvar({ visivelCliente: !t.visivelCliente })} disabled={pendente}>
            {t.visivelCliente ? 'Visível no portal' : 'Só a equipe vê'}
          </button>
        </Linha>
      </div>
    </div>
  )
}
