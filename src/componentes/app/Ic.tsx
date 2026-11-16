import type { CSSProperties } from 'react'

/** Ícone Material Symbols Rounded (a mesma fonte do protótipo do redesign). `s` = tamanho em px; `fill` = versão preenchida. */
export function Ic({ n, s = 16, fill = false, w, className, style }: { n: string; s?: number; fill?: boolean; w?: number; className?: string; style?: CSSProperties }) {
  const variacao = [fill ? "'FILL' 1" : null, w ? `'wght' ${w}` : null].filter(Boolean).join(',')
  return (
    <span aria-hidden="true" className={className} style={{ font: `${s}px/1 'Material Symbols Rounded'`, fontVariationSettings: variacao || undefined, flex: 'none', userSelect: 'none', ...style }}>
      {n}
    </span>
  )
}
