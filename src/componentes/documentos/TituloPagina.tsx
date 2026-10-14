'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { atualizarPaginaAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'

/** Título da página: salva ao sair do campo. */
export function TituloPagina({ id, inicial, podeEditar }: { id: string; inicial: string; podeEditar: boolean }) {
  const router = useRouter()
  const [valor, setValor] = useState(inicial)
  const [, iniciar] = useTransition()
  return (
    <input
      value={valor}
      readOnly={!podeEditar}
      maxLength={200}
      onChange={(e) => setValor(e.target.value)}
      onBlur={() => {
        if (valor === inicial) return
        iniciar(async () => {
          if (avisar(await atualizarPaginaAcao(id, { titulo: valor }))) router.refresh()
        })
      }}
      placeholder="Sem título"
      className="mx-auto block w-full max-w-3xl bg-white px-10 pt-6 text-[1.9rem] font-bold leading-tight text-texto outline-none placeholder:text-texto-3"
    />
  )
}
