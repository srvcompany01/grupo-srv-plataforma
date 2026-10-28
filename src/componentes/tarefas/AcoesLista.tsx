'use client'

import { Check, ChevronDown, Link2, Plus, Share2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { criarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { campo } from '@/lib/ui'
import { avisar } from './avisar'

type Status = { id: string; nome: string; cor: string }

export function CompartilharLista({ nome }: { nome: string }) {
  const compartilhar = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: nome, url: window.location.href })
        return
      }
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link da lista copiado.')
    } catch (erro) {
      if (erro instanceof DOMException && erro.name === 'AbortError') return
      toast.error('Não foi possível compartilhar esta lista.')
    }
  }

  return (
    <button type="button" onClick={compartilhar} className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-rotulo font-medium text-texto-2 transition hover:bg-hover hover:text-texto">
      <Share2 className="h-3.5 w-3.5 text-marca" /> Compartilhar
    </button>
  )
}

export function CriarTarefaTopo({ listaId, euId, status }: { listaId: string; euId: string; status: Status[] }) {
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [statusId, setStatusId] = useState(status[0]?.id ?? '')
  const [pendente, iniciar] = useTransition()
  const escolhido = status.find((item) => item.id === statusId) ?? status[0]

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button className="inline-flex h-7 items-center gap-1.5 rounded-md bg-petroleo px-2.5 text-rotulo font-bold text-claro shadow-cartao transition hover:bg-petroleo-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-petroleo/25">
          <Plus className="h-4 w-4" /> Tarefa <ChevronDown className="h-3 w-3 opacity-80" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-xl p-3">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            iniciar(async () => {
              const resultado = await criarTarefaAcao({ listaId, titulo, responsaveis: [euId], statusId: statusId || null })
              if (!avisar(resultado, true)) return
              setTitulo('')
              setAberto(false)
            })
          }}
        >
          <div>
            <p className="text-sm font-semibold text-texto">Criar tarefa</p>
            <p className="mt-0.5 text-legenda text-texto-3">Ela será atribuída inicialmente a você.</p>
          </div>
          <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome da tarefa" className={campo} />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full" style={{ background: escolhido?.cor ?? '#87909e' }} />
              <select value={statusId} onChange={(e) => setStatusId(e.target.value)} aria-label="Status inicial" className={`${campo} h-9 py-0 pl-8 text-rotulo`}>
                {status.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <button disabled={pendente || !titulo.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-texto px-3 text-rotulo font-semibold text-claro disabled:opacity-50">
              <Check className="h-3.5 w-3.5" /> {pendente ? 'Criando…' : 'Criar'}
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-legenda text-texto-3"><Link2 className="h-3 w-3" /> A tarefa ficará vinculada a esta lista.</p>
        </form>
      </PopoverContent>
    </Popover>
  )
}
