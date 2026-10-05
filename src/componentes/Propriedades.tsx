import type { ReactNode } from 'react'
import { Icone, type NomeIcone } from './Icone'

/** Linhas de propriedade no topo da tarefa: ícone + rótulo cinza à esquerda, valor à direita. */
export function Propriedades({ itens }: { itens: Array<{ icone: NomeIcone; rotulo: string; valor: ReactNode }> }) {
  return (
    <dl className="grid gap-y-2 text-[13px]">
      {itens.map((i) => (
        <div key={i.rotulo} className="grid grid-cols-[130px_minmax(0,1fr)] items-center">
          <dt className="flex items-center gap-2 text-texto-2">
            <Icone nome={i.icone} className="h-4 w-4 text-texto-3" />
            {i.rotulo}
          </dt>
          <dd className="min-w-0">{i.valor}</dd>
        </div>
      ))}
    </dl>
  )
}
