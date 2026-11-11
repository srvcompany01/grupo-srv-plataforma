import { ROTULO_FORMATO } from '@/dominio/formatar'
import type { Formato } from '@/dominio/tipos'

export function EtiquetaFormato({ formato }: { formato: Formato }) {
  return (
    <span>
      {ROTULO_FORMATO[formato]}
    </span>
  )
}
