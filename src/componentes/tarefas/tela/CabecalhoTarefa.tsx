'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Archive, ArrowRightLeft, CircleDot, Link2, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { arquivarTarefaAcao, atualizarTarefaAcao, moverParaListaAcao } from '@/app/(app)/tarefas/acoes'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/componentes/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { rotuloMes } from '@/dominio/formatar'
import type { StatusLista } from '@/dominio/tarefas'
import type { TarefaCompleta } from '@/servicos/tarefas'
import { Ic } from '@/componentes/app/Ic'
import { avisar } from '../avisar'
import type { ListaOpcao } from './TelaTarefa'
import { NomeCliente } from '@/componentes/NomeCliente'

export function CabecalhoTarefa({ tarefa: t, listas, status, podeGerir, emJanela }: { tarefa: TarefaCompleta; listas: ListaOpcao[]; status: StatusLista[]; podeGerir: boolean; emJanela: boolean }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const [titulo, setTitulo] = useState(t.titulo)
  const [movendo, setMovendo] = useState(false)
  const ehSubtarefa = !!t.paiId

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/tarefas/${t.id}`)
      toast.success('Link copiado')
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  async function mover(destinoId: string) {
    const destino = listas.find((l) => l.id === destinoId)
    if (!destino || destino.id === t.lista.id) return
    const aviso = destino.clienteId !== t.lista.clienteId ? (destino.clienteNome ? `Atenção: a tag do cliente muda para @${destino.clienteNome}.` : 'Atenção: a tag do cliente será removida (a lista de destino não tem cliente).') : undefined
    if (!(await confirmar({ titulo: `Mover a tarefa (e as subtarefas) para "${destino.nome}"?`, descricao: aviso, confirmar: 'Mover' }))) return
    iniciar(async () => {
      if (avisar(await moverParaListaAcao(t.id, destino.id), true)) setMovendo(false)
    })
  }

  return (
    <div>
      <div>
        <CircleDot />
        <Link href={`/listas/${t.lista.id}`}>{t.lista.nome}</Link>
        <span>/</span>
        <span>{ehSubtarefa ? 'Subtarefa' : 'Tarefa'}</span>
        <button onClick={copiarLink} aria-label="Copiar link da tarefa" title="Copiar link">
          <Link2 />
        </button>
        <span />
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Mais ações">
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!ehSubtarefa && (
              <DropdownMenuItem onSelect={() => setMovendo(true)}>
                <ArrowRightLeft /> Mover para lista
              </DropdownMenuItem>
            )}
            {podeGerir && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={async () =>
                  (await confirmar({ titulo: 'Arquivar esta tarefa?', descricao: 'Ela some das listas.', confirmar: 'Arquivar', perigo: true })) &&
                  iniciar(async () => {
                    if (!avisar(await arquivarTarefaAcao(t.id), true)) return
                    if (emJanela) router.back()
                    else router.push(`/listas/${t.lista.id}`)
                  })
                }
              >
                <Archive /> Arquivar tarefa
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {t.pai ? (
        <Link href={`/tarefas/${t.pai.id}`}>
          Subtarefa de <span />
          <span>{t.pai.titulo}</span>
        </Link>
      ) : (
        t.paiId && (
          <Link href={`/tarefas/${t.paiId}`}>
            Subtarefa de uma tarefa mãe
          </Link>
        )
      )}

      <div style={{ gap: 0 }}>
        {(() => {
          const atual = status.find((x) => x.id === t.statusId)
          const proximo = status[status.findIndex((x) => x.id === t.statusId) + 1]
          const cor = atual?.cor ?? '#8b8b94'
          const mudar = (statusId: string) => iniciar(async () => void avisar(await atualizarTarefaAcao(t.id, { statusId })))
          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger disabled={pendente} style={{ height: 26, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px 0 8px', border: 0, borderRadius: proximo ? '4px 0 0 4px' : 4, background: cor, color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  {atual?.nome ?? 'Status'}<Ic n="expand_more" s={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {status.map((x) => <DropdownMenuItem key={x.id} onSelect={() => x.id !== t.statusId && mudar(x.id)}><span style={{ width: 8, height: 8, borderRadius: '50%', background: x.cor }} />{x.nome}</DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
              {proximo && (
                <button type="button" disabled={pendente} onClick={() => mudar(proximo.id)} title={`Avançar para ${proximo.nome}`} aria-label={`Avançar para ${proximo.nome}`} style={{ height: 26, width: 26, marginLeft: -5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, borderLeft: '1px solid rgba(255,255,255,.35)', borderRadius: '0 4px 4px 0', background: cor, color: '#fff', cursor: 'pointer' }}><Ic n="chevron_right" s={15} /></button>
              )}
            </>
          )
        })()}
        <span />
        <span>SRV-{t.id.slice(0, 4).toUpperCase()}</span>
      </div>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onBlur={() => {
          if (titulo.trim() && titulo !== t.titulo) iniciar(async () => void avisar(await atualizarTarefaAcao(t.id, { titulo })))
        }}
        aria-label="Título"
      />

      <div>
        {t.lista.clienteNome && <><NomeCliente nome={t.lista.clienteNome} arroba href={t.lista.clienteId ? `/clientes/${t.lista.clienteId}` : undefined} /></>}
        {t.lista.mes && `${t.lista.clienteNome ? ' · ' : ''}${rotuloMes(t.lista.mes)}`}
      </div>

      <Dialog open={movendo} onOpenChange={setMovendo}>
        <DialogContent>
          <DialogTitle>Mover para lista</DialogTitle>
          <DialogDescription>A tarefa e as subtarefas vão para a lista escolhida.</DialogDescription>
          <select value={t.lista.id} disabled={pendente} onChange={(e) => mover(e.target.value)}>
            {listas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.espacoNome} › {l.nome}{l.clienteNome ? ` · @${l.clienteNome}` : ''}
                {l.mes ? ` · ${rotuloMes(l.mes)}` : ''}
              </option>
            ))}
          </select>
          <button onClick={() => setMovendo(false)}>
            Cancelar
          </button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
