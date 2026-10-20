'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Caixa com rolagem que já abre na posição `topo` (a grade de horas abre às 7h, como no Google Agenda). */
export function RolarAoAbrir({ topo, className, children }: { topo: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = topo
  }, [topo])
  return <div ref={ref} className={className}>{children}</div>
}
