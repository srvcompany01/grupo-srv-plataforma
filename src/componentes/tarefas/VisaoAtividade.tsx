import Link from 'next/link'
import { descreverAtividade, type NomesAtividade } from '@/dominio/atividade'
import { formatarDataAtividade } from '@/dominio/formatar'
import type { ItemAtividadeLista } from '@/servicos/tarefas'

/** Atividade: o que mudou nas tarefas desta lista, do mais recente para o mais antigo (últimos 200 eventos). */
export function VisaoAtividade({ itens, nomes }: { itens: ItemAtividadeLista[]; nomes: NomesAtividade }) {
  if (!itens.length) return <p className="py-10 text-center text-corpo text-texto-3">Nenhuma atividade ainda.</p>
  return (
    <ul className="mx-auto max-w-3xl divide-y divide-borda rounded-lg border border-borda bg-white">
      {itens.map((a) => (
        <li key={a.id} className="flex items-baseline gap-3 px-4 py-2.5 text-rotulo text-texto-2">
          <span className="min-w-0 flex-1">
            {descreverAtividade(a, nomes)}
            {' · '}
            <Link href={`/tarefas/${a.tarefaId}`} scroll={false} className="font-medium text-texto hover:underline">{a.tarefaTitulo}</Link>
          </span>
          <span className="shrink-0 text-legenda text-texto-3">{formatarDataAtividade(new Date(a.criadoEm))}</span>
        </li>
      ))}
    </ul>
  )
}
