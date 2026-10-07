'use client'

import { Archive, ArrowRightLeft, CircleDot, Link2, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { arquivarTarefaAcao, atualizarTarefaAcao, moverParaListaAcao } from '@/app/(app)/tarefas/acoes'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/componentes/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { rotuloMes } from '@/dominio/formatar'
import { botaoFantasma, campo } from '@/lib/ui'
import type { TarefaCompleta } from '@/servicos/tarefas'
import { avisar } from '../avisar'
import type { ListaOpcao } from './TelaTarefa'

export function CabecalhoTarefa({ tarefa: t, listas, podeGerir, emJanela }: { tarefa: TarefaCompleta; listas: ListaOpcao[]; podeGerir: boolean; emJanela: boolean }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
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

  function mover(destinoId: string) {
    const destino = listas.find((l) => l.id === destinoId)
    if (!destino || destino.id === t.lista.id) return
    const aviso = destino.clienteId !== t.lista.clienteId ? `\n\nAtenção: a tag do cliente muda para @${destino.clienteNome}.` : ''
    if (!confirm(`Mover a tarefa (e as subtarefas) para "${destino.nome}"?${aviso}`)) return
    iniciar(async () => {
      if (avisar(await moverParaListaAcao(t.id, destino.id), true)) setMovendo(false)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[12px] text-texto-3">
        <span className="inline-flex items-center gap-1 rounded-md bg-hover px-2 py-1 font-medium text-texto-2">
          <CircleDot className="h-3.5 w-3.5" /> {ehSubtarefa ? 'Subtarefa' : 'Tarefa'}
        </span>
        <button onClick={copiarLink} aria-label="Copiar link da tarefa" title="Copiar link" className="rounded p-1.5 hover:bg-hover hover:text-texto">
          <Link2 className="h-4 w-4" />
        </button>
        <span className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Mais ações" className="rounded p-1.5 hover:bg-hover hover:text-texto">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!ehSubtarefa && (
              <DropdownMenuItem onSelect={() => setMovendo(true)}>
                <ArrowRightLeft className="h-4 w-4" /> Mover para lista
              </DropdownMenuItem>
            )}
            {podeGerir && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() =>
                  confirm('Arquivar esta tarefa? Ela some das listas.') &&
                  iniciar(async () => {
                    if (!avisar(await arquivarTarefaAcao(t.id), true)) return
                    if (emJanela) router.back()
                    else router.push(`/listas/${t.lista.id}`)
                  })
                }
              >
                <Archive className="h-4 w-4" /> Arquivar tarefa
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {t.pai ? (
        <Link href={`/tarefas/${t.pai.id}`} className="inline-flex max-w-full items-center gap-1.5 text-[12px] text-texto-2 hover:text-marca">
          Subtarefa de <span className="inline-block h-3 w-3 shrink-0 rounded-full border-2 border-texto-3" />
          <span className="truncate font-medium">{t.pai.titulo}</span>
        </Link>
      ) : (
        t.paiId && (
          <Link href={`/tarefas/${t.paiId}`} className="text-[12px] text-texto-2 hover:text-marca">
            Subtarefa de uma tarefa mãe
          </Link>
        )
      )}

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onBlur={() => {
          if (titulo.trim() && titulo !== t.titulo) iniciar(async () => void avisar(await atualizarTarefaAcao(t.id, { titulo })))
        }}
        aria-label="Título"
        className="w-full rounded px-1 text-2xl font-semibold outline-none hover:bg-hover focus:bg-hover"
      />

      <div className="text-[12px] text-texto-3">
        <Link href={`/listas/${t.lista.id}`} className="hover:text-marca">
          {t.lista.nome}
        </Link>
        {' · '}@{t.lista.clienteNome}
        {t.lista.mes && ` · ${rotuloMes(t.lista.mes)}`}
      </div>

      <Dialog open={movendo} onOpenChange={setMovendo}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Mover para lista</DialogTitle>
          <DialogDescription>A tarefa e as subtarefas vão para a lista escolhida.</DialogDescription>
          <select value={t.lista.id} disabled={pendente} onChange={(e) => mover(e.target.value)} className={`${campo} h-9 py-0 text-[13px]`}>
            {listas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.espacoNome} › {l.nome} · @{l.clienteNome}
                {l.mes ? ` · ${rotuloMes(l.mes)}` : ''}
              </option>
            ))}
          </select>
          <button onClick={() => setMovendo(false)} className={`${botaoFantasma} justify-self-end`}>
            Cancelar
          </button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
