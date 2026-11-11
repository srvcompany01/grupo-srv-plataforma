import Link from 'next/link'
import { descreverAtividade, type NomesAtividade } from '@/dominio/atividade'
import { formatarDataAtividade } from '@/dominio/formatar'
import type { ItemAtividadeLista } from '@/servicos/tarefas'

/** Atividade: o que mudou nas tarefas desta lista, do mais recente para o mais antigo (últimos 200 eventos). */
export function VisaoAtividade({ itens, nomes }: { itens: ItemAtividadeLista[]; nomes: NomesAtividade }) {
  if (!itens.length) return <p>Nenhuma atividade ainda.</p>
  return (
    <ul>
      {itens.map((a) => (
        <li key={a.id}>
          <span>
            {descreverAtividade(a, nomes)}
            {' · '}
            <Link href={`/tarefas/${a.tarefaId}`} scroll={false}>{a.tarefaTitulo}</Link>
          </span>
          <span>{formatarDataAtividade(new Date(a.criadoEm))}</span>
        </li>
      ))}
    </ul>
  )
}
