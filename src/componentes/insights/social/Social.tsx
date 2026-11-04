import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { ComoCalculamos, type Explicacao } from './ComoCalculamos'

/** Caminho suave (curvas com tangente horizontal, sem estourar entre os pontos) para o mini-gráfico. */
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

/** Mini-gráfico sob o número do cartão. Sem dados suficientes, não desenha nada. */
export function Sparkline({ valores, id }: { valores: number[]; id: string }) {
  if (valores.length < 2 || !valores.some((v) => v > 0)) return null
  const W = 100
  const H = 28
  const maior = Math.max(...valores)
  const pts = valores.map((v, i): [number, number] => [(i / (valores.length - 1)) * W, H - 3 - (v / maior) * (H - 8)])
  const linha = caminhoSuave(pts)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ins-spark" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" style={{ stopColor: 'var(--ins-acc)', stopOpacity: 0.22 }} /><stop offset="100%" style={{ stopColor: 'var(--ins-acc)', stopOpacity: 0 }} /></linearGradient>
      </defs>
      <path d={`${linha} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path d={linha} fill="none" style={{ stroke: 'var(--ins-acc)' }} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const ROTULO_TOM = { bom: 'Bom', atencao: 'Atenção', ruim: 'Ruim', neutro: 'Info' } as const
export type TomIns = keyof typeof ROTULO_TOM

export type Kpi = {
  id: string
  rotulo: string
  valor: string
  /** Variação em chip: seta num quadradinho, valor e o texto cinza ao lado. */
  chip?: { valor: string; sentido: 'sobe' | 'desce'; tom: 'bom' | 'ruim'; texto: string }
  extra?: string
  serie?: number[]
  /** Medidor de pontinhos (0 a 1) com o selo do tom. */
  medidor?: { posicao: number; tom: TomIns }
  explicacao: Explicacao
  foco?: boolean
}

const CORES_PONTO = ['#e5484d', '#e5484d', '#ee7a2f', '#f0a928', '#e8c619', '#c4d21c', '#8cc63f', '#52c04c', '#26b95e', '#12b76a']

/** Cartão de número (rótulo + "como calculamos"), valor grande e leve, variação em chip, medidor de pontinhos ou mini-gráfico. */
export function CartaoKpi({ k }: { k: Kpi }) {
  const Seta = k.chip?.sentido === 'desce' ? ArrowDownRight : ArrowUpRight
  return (
    <div className="ins-kpi" data-foco={k.foco || undefined}>
      <div className="ins-kpi-topo"><span>{k.rotulo}</span><ComoCalculamos titulo={k.rotulo} e={k.explicacao} /></div>
      <p className="ins-val">{k.valor}</p>
      {k.chip ? (
        <p className="ins-delta" data-tom={k.chip.tom}><span className="ins-seta"><Seta className="h-3 w-3" strokeWidth={2.4} /></span><b>{k.chip.valor}</b>{k.chip.texto}</p>
      ) : k.extra ? (
        <p className="ins-delta">{k.extra}</p>
      ) : null}
      {k.medidor && (
        <div className="mt-2 flex items-center gap-2">
          <div className="ins-pontos flex-1" style={{ marginTop: 0 }} aria-hidden="true">
            {CORES_PONTO.map((c, i) => <i key={c + i} style={{ background: c }} data-on={i / CORES_PONTO.length <= k.medidor!.posicao || undefined} />)}
          </div>
          <span className="ins-selo" data-tom={k.medidor.tom}>{ROTULO_TOM[k.medidor.tom]}</span>
        </div>
      )}
      {k.serie && <Sparkline valores={k.serie} id={`sp-${k.id}`} />}
    </div>
  )
}

export function FaixaKpis({ itens }: { itens: Kpi[] }) {
  return <div className="ins-faixa" data-n={itens.length}>{itens.map((k) => <CartaoKpi key={k.id} k={k} />)}</div>
}

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
