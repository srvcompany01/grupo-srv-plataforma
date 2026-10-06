import { Avatar } from '@/componentes/Avatar'
import type { Pessoa } from '@/dominio/tarefas'

/** Avatares empilhados (até 3 + contador). */
export function Pessoas({ pessoas }: { pessoas: Pessoa[] }) {
  const visiveis = pessoas.slice(0, 3)
  return (
    <span className="flex -space-x-1.5" title={pessoas.map((p) => p.nome).join(', ')}>
      {visiveis.map((p) => (
        <span key={p.id} className="rounded-full ring-2 ring-white">
          <Avatar nome={p.nome || '?'} tamanho="h-6 w-6 text-[10px]" />
        </span>
      ))}
      {pessoas.length > 3 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-hover text-[10px] ring-2 ring-white">
          +{pessoas.length - 3}
        </span>
      )}
    </span>
  )
}
