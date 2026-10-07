import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Bloco padrão para lista sem itens: diz o que falta e, se houver, oferece a ação para preencher. */
export function EstadoVazio({ icone: Icone, titulo, descricao, children }: { icone?: LucideIcon; titulo: string; descricao?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-borda px-4 py-10 text-center">
      {Icone && <span className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-texto-3"><Icone className="h-5 w-5" aria-hidden="true" /></span>}
      <p className="text-corpo font-medium text-texto">{titulo}</p>
      {descricao && <p className="max-w-sm text-rotulo text-texto-3">{descricao}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}
