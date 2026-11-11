import { ROTULO_STATUS } from '@/dominio/formatar'
import type { Status } from '@/dominio/tipos'

/** Pílula sólida de status, como os cabeçalhos de grupo da visão de lista. */
export function SeloStatus({ status, contagem }: { status: Status; contagem?: number }) {
  return (
    <span>
      <span
      >
        <span />
        {ROTULO_STATUS[status]}
      </span>
      {contagem !== undefined && <span>{contagem}</span>}
    </span>
  )
}
