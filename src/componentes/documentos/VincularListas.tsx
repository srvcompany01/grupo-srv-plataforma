'use client'

import { ListChecks, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { desvincularListaAcao, vincularListaAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import type { ListaVinculada } from '@/dominio/documentos'
import { botaoFantasma, campo } from '@/lib/ui'

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
      <PopoverTrigger className={`${botaoFantasma} gap-1.5`}>
        <ListChecks className="h-3.5 w-3.5" /> {vinculadas.length ? `${vinculadas.length} ${vinculadas.length === 1 ? 'lista' : 'listas'}` : 'Vincular a listas'}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-2 p-3">
        <p className="text-legenda font-medium text-texto-3">Listas vinculadas</p>
        {vinculadas.length === 0 && <p className="text-legenda text-texto-3">Em nenhuma lista ainda.</p>}
        <div className="flex flex-wrap gap-1">
          {vinculadas.map((l) => (
            <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-fundo px-2 py-0.5 text-legenda ring-1 ring-borda">
              <Link href={`/listas/${l.id}?visao=documentos`} className="hover:text-marca">{l.nome}</Link>
              {podeEditar && <button type="button" aria-label={`Desvincular ${l.nome}`} onClick={() => mudar(() => desvincularListaAcao(documentoId, l.id))} className="text-texto-3 hover:text-perigo"><X className="h-3 w-3" /></button>}
            </span>
          ))}
        </div>
        {podeEditar && (
          <>
            <input className={`${campo} h-8`} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar lista para vincular…" />
            <div className="max-h-48 overflow-y-auto">
              {opcoes.map((l) => (
                <button key={l.id} type="button" onClick={() => mudar(() => vincularListaAcao(documentoId, l.id))} className="flex w-full flex-col rounded-md px-2 py-1 text-left hover:bg-hover">
                  <span className="text-rotulo text-texto">{l.nome}</span>
                  {l.espacoNome && <span className="text-legenda text-texto-3">{l.espacoNome}</span>}
                </button>
              ))}
              {opcoes.length === 0 && <p className="px-2 py-1 text-legenda text-texto-3">Nenhuma lista encontrada.</p>}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
