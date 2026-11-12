import type { ComponentType, ReactNode } from 'react'

/**
 * Bloco de página com borda fina e cabeçalho (ícone, título e o que é aquela parte). Deixa as seções separadas,
 * como peças de um painel. `perigo` = zona de exclusão.
 */
export function Modulo({ icone: Icone, titulo, descricao, acoes, perigo, children }: { icone?: ComponentType<{ className?: string }>; titulo: string; descricao?: ReactNode; acoes?: ReactNode; perigo?: boolean; children: ReactNode }) {
  return (
    <section aria-label={titulo} className="modulo" data-perigo={perigo ? '' : undefined}>
      <header>
        <div>
          {Icone && (
            <span>
              <Icone />
            </span>
          )}
          <div>
            <h2>{titulo}</h2>
            {descricao && <p>{descricao}</p>}
          </div>
        </div>
        {acoes}
      </header>
      <div>{children}</div>
    </section>
  )
}
