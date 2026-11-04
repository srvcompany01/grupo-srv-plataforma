import type { ComponentType, ReactNode } from 'react'

/** Caminho suave (curvas com tangente horizontal, sem estourar entre os pontos) para o mini-gráfico e o gráfico de evolução. */
export function caminhoSuave(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
  }
  return d
}

/** Mini-gráfico de área sob o número do cartão. Sem dados suficientes, não desenha nada. */
export function Sparkline({ valores, cor, id }: { valores: number[]; cor: string; id: string }) {
  if (valores.length < 2 || !valores.some((v) => v > 0)) return null
  const W = 100
  const H = 34
  const maior = Math.max(...valores)
  const pts = valores.map((v, i): [number, number] => [(i / (valores.length - 1)) * W, H - 3 - (v / maior) * (H - 8)])
  const linha = caminhoSuave(pts)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ins-spark" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={cor} stopOpacity={0.28} /><stop offset="100%" stopColor={cor} stopOpacity={0} /></linearGradient>
      </defs>
      <path d={`${linha} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path d={linha} fill="none" stroke={cor} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export type Kpi = { id: string; rotulo: string; valor: string; extra?: string; chip?: string; tom?: 'bom' | 'ruim'; icone: ComponentType<{ className?: string; strokeWidth?: number }>; cor: string; serie?: number[] }

/** Cartão de número: ícone num quadradinho colorido, variação em chip, rótulo pequeno em maiúsculas, valor leve e mini-gráfico. */
export function CartaoKpi({ k }: { k: Kpi }) {
  const Icone = k.icone
  return (
    <div className="ins-kpi">
      <div className="ins-kpi-topo">
        <span className="ins-ico" style={{ background: `${k.cor}1f`, color: k.cor }}><Icone className="h-4 w-4" strokeWidth={1.7} /></span>
        {k.chip && <span className="ins-chip" data-tom={k.tom}>{k.chip}</span>}
      </div>
      <p className="ins-rot">{k.rotulo}</p>
      <p className="ins-val">{k.valor}</p>
      {k.extra && <p className="ins-ext">{k.extra}</p>}
      {k.serie && <Sparkline valores={k.serie} cor={k.cor} id={`sp-${k.id}`} />}
    </div>
  )
}

export function GradeKpis({ itens }: { itens: Kpi[] }) {
  return <div className="ins-grade">{itens.map((k) => <CartaoKpi key={k.id} k={k} />)}</div>
}

export function CartaoSocial({ titulo, sub, direita, children }: { titulo?: string; sub?: ReactNode; direita?: ReactNode; children: ReactNode }) {
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
