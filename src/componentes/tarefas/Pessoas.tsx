import { Avatar } from '@/componentes/Avatar'
import type { Pessoa } from '@/dominio/tarefas'

/** Avatares empilhados (até 3 + contador). */
export function Pessoas({ pessoas }: { pessoas: Pessoa[] }) {
  const visiveis = pessoas.slice(0, 3)
  return (
    <span className="flex -space-x-1.5" title={pessoas.map((p) => p.nome).join(', ')}>
      {visiveis.map((p) => (
        <span key={p.id} className="rounded-full ring-2 ring-claro">
          <Avatar nome={p.nome || '?'} tamanho="h-6 w-6 text-legenda" />
        </span>
      ))}
      {pessoas.length > 3 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-hover text-legenda ring-2 ring-claro">
          +{pessoas.length - 3}
        </span>
      )}
    </span>
  )
}
