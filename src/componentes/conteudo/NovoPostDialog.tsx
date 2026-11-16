'use client'

import { Ic } from '@/componentes/app/Ic'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { criarPostAcao } from '@/app/(app)/conteudo/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { FORMATOS, ROTULO_FORMATO } from '@/dominio/conteudo'
import { botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'

export type TarefaMae = { id: string; titulo: string; listaId: string; cliente: string | null }

/**
 * "Novo post": com tarefa-mãe (o normal), nasce como subtarefa dela (lista e cliente vêm da mãe);
 * sem mãe, é um post avulso na lista. Cria o post em rascunho e abre.
 */
export function NovoPostDialog({ listaId, clientes, maes = [] }: { listaId: string; clientes: { id: string; nome: string }[]; maes?: TarefaMae[] }) {
  const [paiId, setPaiId] = useState(maes[0]?.id ?? '')
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '')
  const [titulo, setTitulo] = useState('')
  const [formato, setFormato] = useState<string>('feed')
  const [data, setData] = useState('')
  const [pendente, iniciar] = useTransition()

  const criar = () =>
    iniciar(async () => {
      const mae = maes.find((m) => m.id === paiId)
      const r = await criarPostAcao({ listaId: mae?.listaId ?? listaId, clienteId, titulo, formato, dataPrevista: data, paiId: mae?.id ?? null })
      if (!avisar(r, true) || !r?.id) return
      setAberto(false)
      setTitulo('')
      router.push(`/tarefas/${r.id}`)
    })

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <button className="b-out"><Ic n="add_photo_alternate" s={16} />Novo post</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo post</DialogTitle>
          <DialogDescription>O post nasce como subtarefa da tarefa-mãe (com o cliente dela), em rascunho. Depois você escreve, adiciona as mídias e agenda.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); criar() }}>
          {maes.length > 0 && (
            <label className="block space-y-1"><span className={rotulo}>Tarefa-mãe (campanha / tema)</span>
              <select value={paiId} onChange={(e) => setPaiId(e.target.value)} className={campo}>
                {maes.map((m) => <option key={m.id} value={m.id}>{m.titulo}{m.cliente ? ` · ${m.cliente}` : ''}</option>)}
                <option value="">Post avulso (sem tarefa-mãe)</option>
              </select>
            </label>
          )}
          {!paiId && (
            <label className="block space-y-1"><span className={rotulo}>Cliente</span>
              <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={campo}>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
          )}
          <label className="block space-y-1"><span className={rotulo}>Título</span><input required autoFocus maxLength={200} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Lançamento da coleção" className={campo} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><span className={rotulo}>Formato</span>
              <select value={formato} onChange={(e) => setFormato(e.target.value)} className={campo}>
                {FORMATOS.map((f) => <option key={f} value={f}>{ROTULO_FORMATO[f]}</option>)}
              </select>
            </label>
            <label className="block space-y-1"><span className={rotulo}>Data prevista</span><input required type="date" value={data} onChange={(e) => setData(e.target.value)} className={campo} /></label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={botaoSecundario} onClick={() => setAberto(false)}>Cancelar</button>
            <button disabled={pendente || !titulo.trim() || (!paiId && !clienteId) || !data} className={botaoPrimario}>{pendente ? 'Criando…' : 'Criar post'}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
