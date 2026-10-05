import { formatarData, ROTULO_FORMATO } from '@/dominio/formatar'
import type { Formato } from '@/dominio/tipos'

export function TextosPost({
  formato,
  dataPrevista,
  ideia,
  objetivo,
  legenda,
}: {
  formato: Formato
  dataPrevista: string
  ideia: string
  objetivo: string
  legenda: string
}) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-neutral-500">
        {ROTULO_FORMATO[formato]} · previsto para {formatarData(dataPrevista)}
      </p>
      {[
        ['Ideia', ideia],
        ['Objetivo', objetivo],
        ['Legenda', legenda],
      ].map(([titulo, texto]) => (
        <section key={titulo}>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">{titulo}</h3>
          <p className="whitespace-pre-wrap break-words">{texto || '—'}</p>
        </section>
      ))}
    </div>
  )
}
