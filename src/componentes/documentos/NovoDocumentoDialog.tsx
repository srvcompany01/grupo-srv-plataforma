'use client'

import { FilePlus2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { criarDocumentoAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { MODELOS_DOCUMENTO } from '@/dominio/documento-modelos'
import type { Visibilidade } from '@/dominio/documentos'

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
      <DialogTrigger>
        <FilePlus2 /> {rotulo}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo documento</DialogTitle>
          <DialogDescription>{listaId ? 'Ele fica nesta lista e também na aba Documentos.' : 'Depois você pode vinculá-lo a listas e escolher quem vê.'}</DialogDescription>
        </DialogHeader>
        <div>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (opcional)" maxLength={200} autoFocus />
          <div>
            {MODELOS_DOCUMENTO.map((m) => (
              <button key={m.id} type="button" onClick={() => setModelo(m.id)}>
                <span>{m.nome}</span>
                <span>{m.descricao}</span>
              </button>
            ))}
          </div>
          <div>
            <label>
              Quem vê
              <select value={visibilidade} onChange={(e) => setVisibilidade(e.target.value as Visibilidade)}>
                <option value="team">Equipe toda</option>
                <option value="private">Só eu</option>
              </select>
            </label>
            <label>
              Cliente
              <select value={clienteId} onChange={(e) => { setClienteId(e.target.value); if (!e.target.value) setClienteVe(false) }}>
                <option value="">Sem cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
          </div>
          {clienteId && (
            <label>
              <input type="checkbox" checked={clienteVe} onChange={(e) => setClienteVe(e.target.checked)} /> O cliente pode ver (somente leitura)
            </label>
          )}
        </div>
        <div>
          <button type="button" onClick={() => setAberto(false)}>Cancelar</button>
          <button type="button" disabled={pendente} onClick={criar}>Criar documento</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
