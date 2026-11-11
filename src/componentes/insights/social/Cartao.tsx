import type { ReactNode } from 'react'

/** Bloco da página de Insights: título, apoio e um canto para ações; sem moldura pesada. */
export function CartaoSocial({ titulo, sub, direita, children }: { titulo?: ReactNode; sub?: ReactNode; direita?: ReactNode; children: ReactNode }) {
  return (
    <section>
      {(titulo || direita) && (
        <header>
          <div>
            {titulo && <h3>{titulo}</h3>}
            {sub && <p>{sub}</p>}
          </div>
          {direita}
        </header>
      )}
      {children}
    </section>
  )
}
