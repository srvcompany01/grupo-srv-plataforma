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
    <button type="button" onClick={compartilhar}>
      <Share2 /> Compartilhar
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
    <div>
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button style={{ borderRadius: '6px 0 0 6px' }}>
          <Ic n="add" s={16} />Tarefa
        </button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <form
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
            <p>Criar tarefa</p>
            <p>Ela será atribuída inicialmente a você.</p>
          </div>
          <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome da tarefa" />
          <div>
            <label>
              <span style={{ background: escolhido?.cor ?? '#87909e' }} />
              <select value={statusId} onChange={(e) => setStatusId(e.target.value)} aria-label="Status inicial">
                {status.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <button disabled={pendente || !titulo.trim()}>
              <Check /> {pendente ? 'Criando…' : 'Criar'}
            </button>
          </div>
          <p><Link2 /> A tarefa ficará vinculada a esta lista.</p>
        </form>
      </PopoverContent>
    </Popover>
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Mais opções para criar" style={{ width: 24, padding: 0, justifyContent: 'center', borderLeft: '1px solid rgba(127,127,127,.35)', borderRadius: '0 6px 6px 0' }}><Ic n="expand_more" s={16} /></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setAberto(true)}><Plus /> Tarefa</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setModeloAberto(true)}><LayoutTemplate /> A partir de modelo…</DropdownMenuItem>
        <DropdownMenuItem disabled={csvPendente} onSelect={() => arquivo.current?.click()}><FileSpreadsheet /> {csvPendente ? 'Importando…' : 'Importar CSV…'}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <input ref={arquivo} type="file" accept=".csv,text/csv,text/plain" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importar(f) }} />
    <Dialog open={modeloAberto} onOpenChange={setModeloAberto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar a partir de modelo</DialogTitle>
          <DialogDescription>A tarefa é criada nesta lista com as subtarefas do modelo.</DialogDescription>
        </DialogHeader>
        <ul>
          {modelos.length === 0 && <li>Nenhum modelo ainda. Crie o primeiro abaixo.</li>}
          {modelos.map((m) => (
            <li key={m.id}>
              <span>
                <span>{m.nome}</span>
                <span>{m.titulo}{m.subtarefas.length ? ` · ${m.subtarefas.length} subtarefa${m.subtarefas.length > 1 ? 's' : ''}` : ''}</span>
              </span>
              <button type="button" disabled={salvandoModelo} onClick={() => iniciarModelo(async () => { if (avisar(await criarDoModeloAcao(m.id, listaId), true)) setModeloAberto(false) })}>Usar</button>
              <button type="button" aria-label={`Excluir modelo ${m.nome}`} disabled={salvandoModelo} onClick={() => iniciarModelo(async () => void avisar(await excluirModeloAcao(m.id), true))}><Trash2 /></button>
            </li>
          ))}
        </ul>
        {novoModelo ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              iniciarModelo(async () => {
                if (!avisar(await salvarModeloAcao({ nome: nomeModelo, titulo: tituloModelo, subtarefas: subsModelo.split('\n') }), true)) return
                setNomeModelo(''); setTituloModelo(''); setSubsModelo(''); setNovoModelo(false)
              })
            }}
          >
            <input value={nomeModelo} onChange={(e) => setNomeModelo(e.target.value)} placeholder="Nome do modelo (ex.: Post do mês)" maxLength={80} />
            <input value={tituloModelo} onChange={(e) => setTituloModelo(e.target.value)} placeholder="Título da tarefa criada" maxLength={200} />
            <textarea value={subsModelo} onChange={(e) => setSubsModelo(e.target.value)} placeholder="Subtarefas, uma por linha (opcional)" rows={4} />
            <div>
              <button type="button" onClick={() => setNovoModelo(false)}>Cancelar</button>
              <button disabled={salvandoModelo || !nomeModelo.trim() || !tituloModelo.trim()}>Salvar modelo</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setNovoModelo(true)}><Plus /> Novo modelo</button>
        )}
      </DialogContent>
    </Dialog>
    </div>
  )
}