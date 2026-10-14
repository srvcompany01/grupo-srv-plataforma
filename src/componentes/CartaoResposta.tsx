import type { Resposta } from '@/db/schema'
import { formatarDataHora } from '@/dominio/formatar'
import { Avatar } from './Avatar'

/** Resposta do cliente no formato de comentário da atividade. */
export function CartaoResposta({ resposta }: { resposta: Resposta }) {
  const aprovado = resposta.decisao === 'aprovado'
  return (
    <div className="flex gap-2.5">
      <Avatar nome={resposta.nomeRespondente} />
      <div className="min-w-0 flex-1 rounded-lg border border-borda bg-white p-3">
        <p className="text-corpo">
          <strong className="font-semibold">{resposta.nomeRespondente}</strong>{' '}
          <span className={aprovado ? 'font-medium text-st-aprovado' : 'font-medium text-st-ajuste'}>
            {aprovado ? 'aprovou' : 'pediu ajuste'}
          </span>
          <span className="ml-2 text-xs text-texto-3">{formatarDataHora(resposta.criadaEm)}</span>
        </p>
        {resposta.comentario && <p className="mt-1.5 whitespace-pre-wrap break-words text-destaque">{resposta.comentario}</p>}
      </div>
    </div>
  )
}
