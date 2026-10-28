import type { ComponentType, ReactNode } from 'react'

/**
 * Bloco de página com borda fina e cabeçalho (ícone, título e o que é aquela parte). Deixa as seções separadas,
 * como peças de um painel. `perigo` = zona de exclusão.
 */
export function Modulo({ icone: Icone, titulo, descricao, acoes, perigo, children }: { icone?: ComponentType<{ className?: string }>; titulo: string; descricao?: ReactNode; acoes?: ReactNode; perigo?: boolean; children: ReactNode }) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-lg border bg-white ${perigo ? 'border-perigo-borda' : 'border-borda'}`} aria-label={titulo}>
      <header className={`flex flex-wrap items-center min-h-10 justify-between gap-3 border-b px-3 py-1.5 ${perigo ? 'border-perigo-borda bg-perigo-fundo/30' : 'border-borda-fraca'}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          {Icone && (
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${perigo ? 'bg-perigo-fundo text-perigo' : 'bg-[var(--bg-active)] text-texto-2'}`}>
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
      <div className="p-3">{children}</div>
    </section>
  )
}
