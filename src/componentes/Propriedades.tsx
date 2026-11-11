import type { ReactNode } from 'react'
import { Icone, type NomeIcone } from './Icone'

/** Linhas de propriedade no topo da tarefa: ícone + rótulo cinza à esquerda, valor à direita. */
export function Propriedades({ itens }: { itens: Array<{ icone: NomeIcone; rotulo: string; valor: ReactNode }> }) {
  return (
    <dl>
      {itens.map((i) => (
        <div key={i.rotulo}>
          <dt>
            <Icone nome={i.icone} />
            {i.rotulo}
          </dt>
          <dd>{i.valor}</dd>
        </div>
      ))}
    </dl>
  )
}
