'use client'

import { Link2, Unlink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { desvincularListaAcao, vincularListaAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'

/** Vincula a esta lista um documento que já existe. */
export function VincularExistente({ listaId, candidatos }: { listaId: string; candidatos: { id: string; titulo: string; donoNome: string }[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [, iniciar] = useTransition()
  const opcoes = candidatos.filter((c) => c.titulo.toLowerCase().includes(busca.toLowerCase())).slice(0, 30)
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger><Link2 /> Vincular existente</PopoverTrigger>
      <PopoverContent align="end">
        <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar documento…" />
        <div>
          {opcoes.map((c) => (
            <button key={c.id} type="button" onClick={() => iniciar(async () => { if (avisar(await vincularListaAcao(c.id, listaId), true)) { setAberto(false); router.refresh() } })}>
              <span>{c.titulo}</span>
              <span>{c.donoNome}</span>
            </button>
          ))}
          {opcoes.length === 0 && <p>Nenhum documento disponível.</p>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Tira o documento desta lista (ele não é apagado). */
export function DesvincularDocumento({ listaId, documentoId }: { listaId: string; documentoId: string }) {
  const router = useRouter()
  const [, iniciar] = useTransition()
  return (
    <button type="button" title="Desvincular desta lista (o documento continua existindo)" aria-label="Desvincular desta lista" onClick={() => iniciar(async () => { if (avisar(await desvincularListaAcao(documentoId, listaId), true)) router.refresh() })}>
      <Unlink />
    </button>
  )
}
