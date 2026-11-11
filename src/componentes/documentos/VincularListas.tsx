'use client'

import { ListChecks, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { desvincularListaAcao, vincularListaAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import type { ListaVinculada } from '@/dominio/documentos'

export type ListaEscolha = { id: string; nome: string; espacoNome: string }

/** Listas em que o documento aparece (visualização "Documentos" da lista). Vincular/desvincular nunca apaga o documento. */
export function VincularListas({ documentoId, vinculadas, todas, podeEditar }: { documentoId: string; vinculadas: ListaVinculada[]; todas: ListaEscolha[]; podeEditar: boolean }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [, iniciar] = useTransition()
  const ids = new Set(vinculadas.map((l) => l.id))
  const opcoes = todas.filter((l) => !ids.has(l.id) && `${l.nome} ${l.espacoNome}`.toLowerCase().includes(busca.toLowerCase())).slice(0, 30)

  const mudar = (fn: () => ReturnType<typeof vincularListaAcao>) =>
    iniciar(async () => {
      if (avisar(await fn(), true)) router.refresh()
    })

  return (
    <Popover>
      <PopoverTrigger>
        <ListChecks /> {vinculadas.length ? `${vinculadas.length} ${vinculadas.length === 1 ? 'lista' : 'listas'}` : 'Vincular a listas'}
      </PopoverTrigger>
      <PopoverContent align="end">
        <p>Listas vinculadas</p>
        {vinculadas.length === 0 && <p>Em nenhuma lista ainda.</p>}
        <div>
          {vinculadas.map((l) => (
            <span key={l.id}>
              <Link href={`/listas/${l.id}?visao=documentos`}>{l.nome}</Link>
              {podeEditar && <button type="button" aria-label={`Desvincular ${l.nome}`} onClick={() => mudar(() => desvincularListaAcao(documentoId, l.id))}><X /></button>}
            </span>
          ))}
        </div>
        {podeEditar && (
          <>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar lista para vincular…" />
            <div>
              {opcoes.map((l) => (
                <button key={l.id} type="button" onClick={() => mudar(() => vincularListaAcao(documentoId, l.id))}>
                  <span>{l.nome}</span>
                  {l.espacoNome && <span>{l.espacoNome}</span>}
                </button>
              ))}
              {opcoes.length === 0 && <p>Nenhuma lista encontrada.</p>}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
