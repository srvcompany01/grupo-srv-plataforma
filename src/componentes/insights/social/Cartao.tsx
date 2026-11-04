import type { ReactNode } from 'react'

/** Bloco da página de Insights: título, apoio e um canto para ações; sem moldura pesada. */
export function CartaoSocial({ titulo, sub, direita, children }: { titulo?: ReactNode; sub?: ReactNode; direita?: ReactNode; children: ReactNode }) {
  return (
    <section className="ins-card">
      {(titulo || direita) && (
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {titulo && <h3 className="ins-titulo">{titulo}</h3>}
            {sub && <p className="ins-sub">{sub}</p>}
          </div>
          {direita}
        </header>
      )}
      {children}
    </section>
  )
}
