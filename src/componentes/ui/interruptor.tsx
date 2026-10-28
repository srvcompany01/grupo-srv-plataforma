'use client'

import { cn } from 'cn'

/** Interruptor 24×14 (medida do ClickUp): ligado na cor de ação do tema, desligado em cinza; bola de 10px. */
export function Interruptor({ marcado, aoMudar, desabilitado, rotulo, className }: { marcado: boolean; aoMudar: (valor: boolean) => void; desabilitado?: boolean; rotulo: string; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={marcado}
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={() => aoMudar(!marcado)}
      className={cn(
        'relative h-[14px] w-6 shrink-0 rounded-full border-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50',
        marcado ? 'border-petroleo bg-petroleo' : 'border-texto-3/70 bg-texto-3/70',
        className,
      )}
    >
      <span aria-hidden className={cn('absolute top-px left-px h-2.5 w-2.5 rounded-full bg-claro transition-transform', marcado && 'translate-x-2.5')} />
    </button>
  )
}
