'use client'

import { Archive, Check, Eye, EyeOff, Tag } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs'
import { descreverAtividade } from '@/dominio/atividade'
import { formatarDataHora, rotuloMes } from '@/dominio/formatar'
import { PRIORIDADES, ROTULO_PRIORIDADE, type Pessoa, type Prioridade, type StatusLista } from '@/dominio/tarefas'
import { botaoFantasma, campo, rotulo } from '@/lib/ui'
import type { Comentario } from '@/servicos/comentarios'
import type { ItemAtividade, TarefaCompleta } from '@/servicos/tarefas'
import {
  arquivarTarefaAcao,
  atualizarTarefaAcao,
  criarEtiquetaAcao,
  definirEtiquetaAcao,
  moverParaListaAcao,
} from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'
import { Comentarios } from './Comentarios'
import { CamposPersonalizados } from './CamposPersonalizados'
import { EditorDescricao } from './EditorDescricao'
import { Prazo } from './LinhaTarefa'
import { NovaTarefa } from './NovaTarefa'
import { SeletorResponsaveis } from './SeletorResponsaveis'
import { SeletorStatus } from './SeletorStatus'
import type { DefinicaoCampo } from '@/dominio/personalizacao'

type Opcao = { id: string; nome: string; cor: string }
type ListaOpcao = { id: string; nome: string; mes: string | null; clienteId: string; clienteNome: string; espacoNome: string }

export type PropsDetalhe = {
  tarefa: TarefaCompleta
  status: StatusLista[]
  equipe: Pessoa[]
  tags: Opcao[]
  listas: ListaOpcao[]
  comentarios: Comentario[]
  atividade: ItemAtividade[]
  camposPersonalizados: DefinicaoCampo[]
  euId: string
  podeGerir: boolean
  hoje: string
  noPainel?: boolean
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2 text-[13px]">
      <span className={rotulo}>{titulo}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function DetalheTarefa(p: PropsDetalhe) {
  const t = p.tarefa
  const espacoId = t.lista.espacoId
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [titulo, setTitulo] = useState(t.titulo)
  const [novaTag, setNovaTag] = useState('')
  const salvar = (campos: Parameters<typeof atualizarTarefaAcao>[1]) => iniciar(async () => void avisar(await atualizarTarefaAcao(t.id, campos)))
  const horas = t.estimativaMin != null ? Math.floor(t.estimativaMin / 60) : ''
  const minutos = t.estimativaMin != null ? t.estimativaMin % 60 : ''

  const nomes = {
    status: Object.fromEntries(p.status.map((s) => [s.id, s.nome])),
    usuarios: Object.fromEntries(p.equipe.map((u) => [u.id, u.nome])),
    tags: Object.fromEntries(p.tags.map((g) => [g.id, g.nome])),
  }

  function salvarEstimativa(form: HTMLFormElement) {
    const h = Number((form.elements.namedItem('h') as HTMLInputElement).value || 0)
    const m = Number((form.elements.namedItem('m') as HTMLInputElement).value || 0)
    const total = h * 60 + m
    if (total !== (t.estimativaMin ?? 0)) salvar({ estimativaMin: total || null })
  }

  return (
    <div className="space-y-5">
      <div className="text-[12px] text-texto-3">
        <Link href={`/listas/${t.lista.id}`} className="hover:text-marca">
          {t.lista.nome}
        </Link>
        {' · '}
        @{t.lista.clienteNome}
        {t.lista.mes && ` · ${rotuloMes(t.lista.mes)}`}
        {t.paiId && (
          <>
            {' · '}
            <Link href={`/tarefas/${t.paiId}`} className="hover:text-marca">
              tarefa mãe
            </Link>
          </>
        )}
      </div>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onBlur={() => titulo.trim() && titulo !== t.titulo && salvar({ titulo })}
        aria-label="Título"
        className="w-full rounded px-1 text-xl font-semibold outline-none hover:bg-hover focus:bg-hover"
      />

      <div className="space-y-2">
        <Campo titulo="Status">
          <SeletorStatus tarefaId={t.id} statusId={t.statusId} opcoes={p.status} comNome />
        </Campo>
        <Campo titulo="Responsáveis">
          <SeletorResponsaveis tarefaId={t.id} atuais={t.responsaveis} equipe={p.equipe} />
        </Campo>
        <Campo titulo="Prioridade">
          <select
            value={t.prioridade}
            onChange={(e) => salvar({ prioridade: e.target.value as Prioridade })}
            className={`${campo} h-8 w-40 py-0 text-[13px]`}
          >
            {PRIORIDADES.map((x) => (
              <option key={x} value={x}>
                {ROTULO_PRIORIDADE[x]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo titulo="Início">
          <input type="date" defaultValue={t.inicio ?? ''} onBlur={(e) => e.target.value !== (t.inicio ?? '') && salvar({ inicio: e.target.value || null })} className={`${campo} h-8 w-40 py-0`} />
        </Campo>
        <Campo titulo="Prazo">
          <span className="flex items-center gap-2">
            <input type="date" defaultValue={t.prazo ?? ''} onBlur={(e) => e.target.value !== (t.prazo ?? '') && salvar({ prazo: e.target.value || null })} className={`${campo} h-8 w-40 py-0`} />
            <Prazo prazo={t.prazo} concluida={!!t.concluidaEm} hoje={p.hoje} />
          </span>
        </Campo>
        <Campo titulo="Estimativa">
          <form onBlur={(e) => salvarEstimativa(e.currentTarget)} onSubmit={(e) => e.preventDefault()} className="flex items-center gap-1">
            <input name="h" type="number" min={0} defaultValue={horas} aria-label="Horas" className={`${campo} h-8 w-16 py-0`} /> h
            <input name="m" type="number" min={0} max={59} defaultValue={minutos} aria-label="Minutos" className={`${campo} h-8 w-16 py-0`} /> min
          </form>
        </Campo>
        <Campo titulo="Etiquetas">
          <div className="flex flex-wrap items-center gap-1">
            {t.tags.map((g) => (
              <span key={g.id} className="rounded px-1.5 py-0.5 text-[11px] text-white" style={{ background: g.cor }}>
                {g.nome}
              </span>
            ))}
            <Popover>
              <PopoverTrigger aria-label="Etiquetas" className="rounded p-1 text-texto-3 hover:bg-hover">
                <Tag className="h-3.5 w-3.5" />
              </PopoverTrigger>
              <PopoverContent className="w-56 space-y-1 p-2" align="start">
                {p.tags.length === 0 && <p className="text-[12px] text-texto-3">Nenhuma etiqueta neste departamento.</p>}
                {p.tags.map((g) => {
                  const marcada = t.tags.some((x) => x.id === g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => iniciar(async () => void avisar(await definirEtiquetaAcao(t.id, g.id, !marcada)))}
                      className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-[13px] hover:bg-hover"
                    >
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.cor }} />
                      <span className="flex-1 text-left">{g.nome}</span>
                      {marcada && <Check className="h-3.5 w-3.5 text-marca" />}
                    </button>
                  )
                })}
                {p.podeGerir && espacoId && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      iniciar(async () => {
                        if (avisar(await criarEtiquetaAcao(t.id, espacoId, novaTag, '#7b68ee'))) setNovaTag('')
                      })
                    }}
                    className="border-t border-borda pt-1"
                  >
                    <input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} placeholder="Nova etiqueta + Enter" className="w-full px-1.5 py-1 text-[13px] outline-none" />
                  </form>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </Campo>
        <Campo titulo="Cliente vê?">
          <button onClick={() => salvar({ visivelCliente: !t.visivelCliente })} disabled={pendente} className={`${botaoFantasma} ${t.visivelCliente ? 'text-emerald-700' : ''}`}>
            {t.visivelCliente ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {t.visivelCliente ? 'Visível no portal' : 'Só a equipe vê'}
          </button>
        </Campo>
        {!t.paiId && (
          <Campo titulo="Lista">
            <select
              value={t.lista.id}
              onChange={(e) => {
                const destino = p.listas.find((l) => l.id === e.target.value)
                if (!destino) return
                const aviso = destino.clienteId !== t.lista.clienteId ? `\n\nAtenção: a tag do cliente muda para @${destino.clienteNome}.` : ''
                if (confirm(`Mover a tarefa (e as subtarefas) para "${destino.nome}"?${aviso}`)) {
                  iniciar(async () => void avisar(await moverParaListaAcao(t.id, destino.id), true))
                } else e.target.value = t.lista.id
              }}
              className={`${campo} h-8 py-0 text-[13px]`}
            >
              {p.listas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.espacoNome} › {l.nome} · @{l.clienteNome}
                  {l.mes ? ` · ${rotuloMes(l.mes)}` : ''}
                </option>
              ))}
            </select>
          </Campo>
        )}
      </div>

      <div className="space-y-1">
        <span className={rotulo}>Descrição</span>
        <EditorDescricao key={t.id} tarefaId={t.id} inicial={t.descricao} />
      </div>

      <CamposPersonalizados tarefaId={t.id} campos={p.camposPersonalizados} equipe={p.equipe} />

      <div className="space-y-1">
        <span className={rotulo}>Subtarefas</span>
        <div className="rounded-md border border-borda">
          {t.subtarefas.map((s) => (
            <div key={s.id} className="flex h-9 items-center gap-2 border-b border-borda px-2 text-[13px] last:border-b-0">
              <SeletorStatus tarefaId={s.id} statusId={s.statusId} opcoes={p.status} />
              <Link href={`/tarefas/${s.id}`} className="flex-1 truncate hover:text-marca">
                {s.titulo}
              </Link>
              <Prazo prazo={s.prazo} concluida={!!s.concluidaEm} hoje={p.hoje} />
            </div>
          ))}
          <NovaTarefa listaId={t.lista.id} euId={p.euId} paiId={t.id} />
        </div>
      </div>

      <Tabs defaultValue="comentarios">
        <TabsList>
          <TabsTrigger value="comentarios">Comentários ({p.comentarios.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="comentarios" className="pt-3">
          <Comentarios tarefaId={t.id} comentarios={p.comentarios} euId={p.euId} />
        </TabsContent>
        <TabsContent value="historico" className="space-y-2 pt-3">
          {p.atividade.map((a) => (
            <div key={a.id} className="flex gap-2 text-[13px]">
              <span className="flex-1">{descreverAtividade(a, nomes)}</span>
              <span className="shrink-0 text-[12px] text-texto-3">{formatarDataHora(new Date(a.criadoEm))}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {p.podeGerir && (
        <button
          disabled={pendente}
          onClick={() =>
            confirm('Arquivar esta tarefa? Ela some das listas.') &&
            iniciar(async () => {
              if (!avisar(await arquivarTarefaAcao(t.id), true)) return
              if (p.noPainel) router.back()
              else router.push(`/listas/${t.lista.id}`)
            })
          }
          className={`${botaoFantasma} text-rose-600`}
        >
          <Archive className="h-4 w-4" /> Arquivar tarefa
        </button>
      )}
    </div>
  )
}
