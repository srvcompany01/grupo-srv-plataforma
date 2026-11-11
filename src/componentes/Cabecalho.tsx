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
    <header>
      <nav>
        {trilha.map((p, i) => (
          <span key={i}>
            {i > 0 && <Icone nome="seta" className="hidden" />}
            {p.href ? (
              <Link href={p.href}>
                {i === anterior && <Icone nome="voltar" />}
                {p.rotulo}
              </Link>
            ) : (
              <span>{p.rotulo}</span>
            )}
          </span>
        ))}
      </nav>
      {acoes && <div>{acoes}</div>}
    </header>
  )
}
