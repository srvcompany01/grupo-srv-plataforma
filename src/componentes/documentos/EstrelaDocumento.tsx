'use client'

import { Star } from 'lucide-react'
import { useOptimistic, useTransition } from 'react'
import { favoritarAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'

export function EstrelaDocumento({ id, favorito }: { id: string; favorito: boolean }) {
  const [exibido, definir] = useOptimistic(favorito)
  const [, iniciar] = useTransition()
  return (
    <button
      type="button"
      aria-label={exibido ? 'Tirar dos favoritos' : 'Favoritar'}
      onClick={() => iniciar(async () => { definir(!exibido); avisar(await favoritarAcao(id, !exibido)) })}
    >
      <Star />
    </button>
  )
}
