import type { Resposta } from '@/db/schema'
import { formatarDataHora } from '@/dominio/formatar'

export function CartaoResposta({ resposta }: { resposta: Resposta }) {
  const aprovado = resposta.decisao === 'aprovado'
  return (
    <div className={`rounded-xl p-3 text-sm ${aprovado ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
      <p className="font-medium">
        {aprovado ? 'Aprovado' : 'Ajuste pedido'} por {resposta.nomeRespondente} em {formatarDataHora(resposta.criadaEm)}
      </p>
      {resposta.comentario && <p className="mt-1 whitespace-pre-wrap">{resposta.comentario}</p>}
    </div>
  )
}
