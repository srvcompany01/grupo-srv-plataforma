'use client'

import { FilePlus2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { criarDocumentoAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { MODELOS_DOCUMENTO } from '@/dominio/documento-modelos'
import type { Visibilidade } from '@/dominio/documentos'
import { botaoFantasma, botaoPrimario, campo } from '@/lib/ui'

/** Cria um documento (em branco ou de um modelo). Com `listaId`, ele já nasce vinculado à lista. */
export function NovoDocumentoDialog({ listaId, clientes, rotulo = 'Novo documento', clienteInicial }: { listaId?: string; clientes: { id: string; nome: string }[]; rotulo?: string; clienteInicial?: string | null }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [modelo, setModelo] = useState('em-branco')
  const [visibilidade, setVisibilidade] = useState<Visibilidade>('team')
  const [clienteId, setClienteId] = useState(clienteInicial ?? '')
  const [clienteVe, setClienteVe] = useState(false)
  const [pendente, iniciar] = useTransition()

  const criar = () =>
    iniciar(async () => {
      const r = await criarDocumentoAcao({ titulo, modelo, listaId, visibilidade, clienteId: clienteId || null, clienteVisivel: !!clienteId && clienteVe })
      if (avisar(r) && r?.id) {
        setAberto(false)
        router.push(`/documentos/${r.id}`)
      }
    })

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger className={`${botaoPrimario} gap-1.5`}>
        <FilePlus2 className="h-3.5 w-3.5" /> {rotulo}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo documento</DialogTitle>
          <DialogDescription>{listaId ? 'Ele fica nesta lista e também na aba Documentos.' : 'Depois você pode vinculá-lo a listas e escolher quem vê.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <input className={`${campo} h-9`} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (opcional)" maxLength={200} autoFocus />
          <div className="grid grid-cols-2 gap-2">
            {MODELOS_DOCUMENTO.map((m) => (
              <button key={m.id} type="button" onClick={() => setModelo(m.id)} className={`rounded-lg border p-2 text-left ${modelo === m.id ? 'border-marca bg-marca-fundo' : 'border-borda hover:bg-hover'}`}>
                <span className="block text-rotulo font-semibold text-texto">{m.nome}</span>
                <span className="block text-legenda text-texto-3">{m.descricao}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-legenda text-texto-3">
              Quem vê
              <select className={`${campo} h-9`} value={visibilidade} onChange={(e) => setVisibilidade(e.target.value as Visibilidade)}>
                <option value="team">Equipe toda</option>
                <option value="private">Só eu</option>
              </select>
            </label>
            <label className="space-y-1 text-legenda text-texto-3">
              Cliente
              <select className={`${campo} h-9`} value={clienteId} onChange={(e) => { setClienteId(e.target.value); if (!e.target.value) setClienteVe(false) }}>
                <option value="">Sem cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
          </div>
          {clienteId && (
            <label className="flex items-center gap-2 text-rotulo">
              <input type="checkbox" checked={clienteVe} onChange={(e) => setClienteVe(e.target.checked)} /> O cliente pode ver (somente leitura)
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={botaoFantasma} onClick={() => setAberto(false)}>Cancelar</button>
          <button type="button" className={botaoPrimario} disabled={pendente} onClick={criar}>Criar documento</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
