import { ROTULO_FORMATO } from '@/dominio/formatar'
import type { Formato } from '@/dominio/tipos'
import { COR_FORMATO } from '@/lib/ui'

export function EtiquetaFormato({ formato }: { formato: Formato }) {
  return (
    <span className={`inline-flex h-[22px] items-center rounded-[5px] px-2 text-xs font-medium ${COR_FORMATO[formato]}`}>
      {ROTULO_FORMATO[formato]}
    </span>
  )
}
