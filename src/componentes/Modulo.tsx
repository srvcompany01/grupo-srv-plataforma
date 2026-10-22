import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Bloco de página com borda fina e cabeçalho (ícone, título e o que é aquela parte). Deixa as seções separadas,
 * como peças de um painel. `perigo` = zona de exclusão.
 */
export function Modulo({ icone: Icone, titulo, descricao, acoes, perigo, children }: { icone?: LucideIcon; titulo: string; descricao?: string; acoes?: ReactNode; perigo?: boolean; children: ReactNode }) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-xl border bg-white ${perigo ? 'border-perigo-borda' : 'border-borda'}`} aria-label={titulo}>
      <header className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${perigo ? 'border-perigo-borda bg-perigo-fundo/30' : 'border-borda'}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          {Icone && (
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${perigo ? 'bg-perigo-fundo text-perigo' : 'bg-fundo text-texto-2'}`}>
              <Icone className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className={`text-corpo font-semibold ${perigo ? 'text-perigo-forte' : 'text-texto'}`}>{titulo}</h2>
            {descricao && <p className="text-legenda text-texto-3">{descricao}</p>}
          </div>
        </div>
        {acoes}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}
