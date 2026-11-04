'use client'

import { Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'

export type Explicacao = { formula: string; fonte: string; atualizado: string; excluido?: string }

/** Botão (i) do cartão: abre "como calculamos" com a fórmula, a fonte do dado, a atualização e o que ficou de fora. */
export function ComoCalculamos({ titulo, e }: { titulo: string; e: Explicacao }) {
  return (
    <Popover>
      <PopoverTrigger className="ins-info" aria-label={`Como calculamos: ${titulo}`}><Info className="h-3.5 w-3.5" strokeWidth={1.8} /></PopoverTrigger>
      <PopoverContent align="end" className="ins-pop">
        <p className="ins-titulo">{titulo}</p>
        <p className="ins-formula"><span style={{ color: 'var(--ins-suave)' }}>fx </span>{e.formula}</p>
        <dl className="space-y-0.5">
          <div><dt>Fonte: </dt><dd>{e.fonte}</dd></div>
          <div><dt>Atualizado: </dt><dd>{e.atualizado}</dd></div>
          {e.excluido && <div><dt>Fora do cálculo: </dt><dd>{e.excluido}</dd></div>}
        </dl>
      </PopoverContent>
    </Popover>
  )
}
