import type { Resposta } from '@/db/schema'
import { formatarDataHora } from '@/dominio/formatar'
import { Avatar } from './Avatar'

/** Resposta do cliente no formato de comentário da atividade. */
export function CartaoResposta({ resposta }: { resposta: Resposta }) {
  const aprovado = resposta.decisao === 'aprovado'
  return (
    <div>
      <Avatar nome={resposta.nomeRespondente} />
      <div>
        <p>
          <strong>{resposta.nomeRespondente}</strong>{' '}
          <span>
            {aprovado ? 'aprovou' : 'pediu ajuste'}
          </span>
          <span>{formatarDataHora(resposta.criadaEm)}</span>
        </p>
        {resposta.comentario && <p>{resposta.comentario}</p>}
      </div>
    </div>
  )
}
