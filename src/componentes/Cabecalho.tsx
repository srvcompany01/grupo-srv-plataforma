import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icone } from './Icone'

export interface Passo {
  rotulo: string
  href?: string
}

/** Barra do topo da área de trabalho: trilha (breadcrumb) e ações à direita. */
export function Cabecalho({ trilha, acoes }: { trilha: Passo[]; acoes?: ReactNode }) {
  // No celular mostra só o passo anterior (como "voltar"); o atual já é o título da página.
  const anterior = trilha.findLastIndex((p) => p.href)
  return (
    <header className="flex min-h-14 items-center justify-between gap-2 border-b border-borda bg-white px-4 py-2 sm:px-6">
      <nav className="flex min-w-0 items-center gap-1 text-sm">
        {trilha.map((p, i) => (
          <span key={i} className={`min-w-0 items-center gap-1 ${i === anterior || (anterior < 0 && !p.href) ? 'flex' : 'hidden sm:flex'}`}>
            {i > 0 && <Icone nome="seta" className="hidden h-3.5 w-3.5 shrink-0 text-texto-3 sm:block" />}
            {p.href ? (
              <Link href={p.href} className="flex items-center truncate rounded px-1.5 py-1 text-texto-2 hover:bg-hover hover:text-texto">
                {i === anterior && <Icone nome="voltar" className="-ml-1 mr-0.5 h-4 w-4 shrink-0 sm:hidden" />}
                {p.rotulo}
              </Link>
            ) : (
              <span className="truncate px-1.5 py-1 font-semibold text-texto">{p.rotulo}</span>
            )}
          </span>
        ))}
      </nav>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </header>
  )
}
