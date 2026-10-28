import { ROTULO_STATUS } from '@/dominio/formatar'
import type { Status } from '@/dominio/tipos'
import { COR_STATUS } from '@/lib/ui'

/** Pílula sólida de status, como os cabeçalhos de grupo da visão de lista. */
export function SeloStatus({ status, contagem }: { status: Status; contagem?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex h-[22px] items-center gap-1.5 rounded-[5px] px-2 text-legenda font-semibold uppercase tracking-rotulo text-claro ${COR_STATUS[status]}`}
      >
        <span className="h-2 w-2 rounded-full border-[1.5px] border-claro/90" />
        {ROTULO_STATUS[status]}
      </span>
      {contagem !== undefined && <span className="text-xs font-medium text-texto-3">{contagem}</span>}
    </span>
  )
}
