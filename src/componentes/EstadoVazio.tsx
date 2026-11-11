import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Bloco padrão para lista sem itens: diz o que falta e, se houver, oferece a ação para preencher. */
export function EstadoVazio({ icone: Icone, titulo, descricao, children }: { icone?: LucideIcon; titulo: string; descricao?: string; children?: ReactNode }) {
  return (
    <div>
      {Icone && <span><Icone aria-hidden="true" /></span>}
      <p>{titulo}</p>
      {descricao && <p>{descricao}</p>}
      {children && <div>{children}</div>}
    </div>
  )
}
