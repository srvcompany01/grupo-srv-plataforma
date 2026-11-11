import { Avatar } from '@/componentes/Avatar'
import type { Pessoa } from '@/dominio/tarefas'

/** Avatares empilhados (até 3 + contador). */
export function Pessoas({ pessoas }: { pessoas: Pessoa[] }) {
  const visiveis = pessoas.slice(0, 3)
  return (
    <span title={pessoas.map((p) => p.nome).join(', ')}>
      {visiveis.map((p) => (
        <span key={p.id}>
          <Avatar nome={p.nome || '?'} tamanho="h-6 w-6 text-legenda" />
        </span>
      ))}
      {pessoas.length > 3 && (
        <span>
          +{pessoas.length - 3}
        </span>
      )}
    </span>
  )
}
