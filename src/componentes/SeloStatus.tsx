import { ROTULO_STATUS } from '@/dominio/formatar'
import type { Status } from '@/dominio/tipos'
import { COR_STATUS } from '@/lib/ui'

export function SeloStatus({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COR_STATUS[status]}`}>
      {ROTULO_STATUS[status]}
    </span>
  )
}
