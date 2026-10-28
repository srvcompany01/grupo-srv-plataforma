'use client'

import { Ic } from '@/componentes/app/Ic'
import { Check, FileSpreadsheet, LayoutTemplate, Link2, Plus, Share2, Trash2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { criarDoModeloAcao, criarTarefaAcao, excluirModeloAcao, importarTarefasAcao, salvarModeloAcao } from '@/app/(app)/tarefas/acoes'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { lerCsvDeTarefas } from '@/dominio/csv-tarefas'
import type { ModeloTarefa } from '@/servicos/modelos'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { botaoPrimario, botaoSecundario, campo } from '@/lib/ui'
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

export function CriarTarefaTopo({ listaId, euId, status, modelos = [] }: { listaId: string; euId: string; status: Status[]; modelos?: ModeloTarefa[] }) {
  const [modeloAberto, setModeloAberto] = useState(false)
  const [csvPendente, iniciarCsv] = useTransition()
  const [novoModelo, setNovoModelo] = useState(false)
  const [nomeModelo, setNomeModelo] = useState('')
  const [tituloModelo, setTituloModelo] = useState('')
  const [subsModelo, setSubsModelo] = useState('')
  const [salvandoModelo, iniciarModelo] = useTransition()
  const arquivo = useRef<HTMLInputElement>(null)
  const importar = (f: File) =>
    iniciarCsv(async () => {
      const linhas = lerCsvDeTarefas(await f.text())
      avisar(await importarTarefasAcao(listaId, linhas), true)
    })
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [statusId, setStatusId] = useState(status[0]?.id ?? '')
  const [pendente, iniciar] = useTransition()
  const escolhido = status.find((item) => item.id === statusId) ?? status[0]

  return (
    <div className="inline-flex items-center">
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button className="b-pri" style={{ borderRadius: '6px 0 0 6px' }}>
          <Ic n="add" s={16} />Tarefa
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-lg p-3">
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
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Mais opções para criar" className="b-pri" style={{ width: 24, padding: 0, justifyContent: 'center', borderLeft: '1px solid rgba(127,127,127,.35)', borderRadius: '0 6px 6px 0' }}><Ic n="expand_more" s={16} /></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => setAberto(true)}><Plus className="h-4 w-4" /> Tarefa</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setModeloAberto(true)}><LayoutTemplate className="h-4 w-4" /> A partir de modelo…</DropdownMenuItem>
        <DropdownMenuItem disabled={csvPendente} onSelect={() => arquivo.current?.click()}><FileSpreadsheet className="h-4 w-4" /> {csvPendente ? 'Importando…' : 'Importar CSV…'}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <input ref={arquivo} type="file" accept=".csv,text/csv,text/plain" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importar(f) }} />
    <Dialog open={modeloAberto} onOpenChange={setModeloAberto}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar a partir de modelo</DialogTitle>
          <DialogDescription>A tarefa é criada nesta lista com as subtarefas do modelo.</DialogDescription>
        </DialogHeader>
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {modelos.length === 0 && <li className="py-4 text-center text-corpo text-texto-3">Nenhum modelo ainda. Crie o primeiro abaixo.</li>}
          {modelos.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-md border border-borda px-2 py-1.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-corpo font-medium">{m.nome}</span>
                <span className="block truncate text-rotulo text-texto-3">{m.titulo}{m.subtarefas.length ? ` · ${m.subtarefas.length} subtarefa${m.subtarefas.length > 1 ? 's' : ''}` : ''}</span>
              </span>
              <button type="button" disabled={salvandoModelo} onClick={() => iniciarModelo(async () => { if (avisar(await criarDoModeloAcao(m.id, listaId), true)) setModeloAberto(false) })} className={botaoPrimario}>Usar</button>
              <button type="button" aria-label={`Excluir modelo ${m.nome}`} disabled={salvandoModelo} onClick={() => iniciarModelo(async () => void avisar(await excluirModeloAcao(m.id), true))} className="rounded p-1.5 text-texto-3 hover:bg-hover hover:text-perigo"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
        {novoModelo ? (
          <form
            className="space-y-2 border-t border-borda-fraca pt-3"
            onSubmit={(e) => {
              e.preventDefault()
              iniciarModelo(async () => {
                if (!avisar(await salvarModeloAcao({ nome: nomeModelo, titulo: tituloModelo, subtarefas: subsModelo.split('\n') }), true)) return
                setNomeModelo(''); setTituloModelo(''); setSubsModelo(''); setNovoModelo(false)
              })
            }}
          >
            <input value={nomeModelo} onChange={(e) => setNomeModelo(e.target.value)} placeholder="Nome do modelo (ex.: Post do mês)" maxLength={80} className={campo} />
            <input value={tituloModelo} onChange={(e) => setTituloModelo(e.target.value)} placeholder="Título da tarefa criada" maxLength={200} className={campo} />
            <textarea value={subsModelo} onChange={(e) => setSubsModelo(e.target.value)} placeholder="Subtarefas, uma por linha (opcional)" rows={4} className={campo} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setNovoModelo(false)} className={botaoSecundario}>Cancelar</button>
              <button disabled={salvandoModelo || !nomeModelo.trim() || !tituloModelo.trim()} className={botaoPrimario}>Salvar modelo</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setNovoModelo(true)} className={`${botaoSecundario} w-full`}><Plus className="h-4 w-4" /> Novo modelo</button>
        )}
      </DialogContent>
    </Dialog>
    </div>
  )
}