'use client'

import { Activity, Eye, Heart, LayoutGrid, Link2, MousePointerClick, Radar, TrendingDown, TrendingUp, UserCheck, Users } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

const ICONES: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = { users: Users, radar: Radar, heart: Heart, pointer: MousePointerClick, eye: Eye, trending: TrendingUp, link: Link2, layout: LayoutGrid, check: UserCheck, activity: Activity }
export type IconeMetrica = keyof typeof ICONES

export type Metrica = {
  id: string
  rotulo: string
  valor: string
  icone: IconeMetrica
  cor: string
  /** Variação contra o período anterior, em %. undefined = sem base de comparação. */
  delta?: number
  /** Um valor por dia; com ele o cartão ganha o mini-gráfico e pode ser escolhido para o gráfico grande. */
  serie?: number[]
  extra?: string
}

const pct = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

/** Caminho em linhas retas (como nos gráficos de referência: linha fina e nervosa, sem suavizar). */
export function Sparkline({ valores }: { valores: number[] }) {
  if (valores.length < 2 || !valores.some((v) => v > 0)) return null
  const W = 100
  const H = 30
  const menor = Math.min(...valores)
  const faixa = Math.max(...valores) - menor || 1
  const pts = valores.map((v, i) => `${(i / (valores.length - 1)) * W},${H - 3 - ((v - menor) / faixa) * (H - 8)}`)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ins-spark" aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Cartão de métrica: ícone colorido, rótulo em maiúsculas, variação em chip, valor e mini-gráfico. Clicável quando tem série. */
export function CartaoMetrica({ m, ativo, aoEscolher }: { m: Metrica; ativo?: boolean; aoEscolher?: () => void }) {
  const Icone = ICONES[m.icone] ?? Activity
  const Seta = m.delta !== undefined && m.delta < 0 ? TrendingDown : TrendingUp
  const corpo = (
    <>
      <span className="ins-kpi-topo">
        <span className="ins-ico" style={{ background: m.cor }}><Icone className="h-3.5 w-3.5" strokeWidth={2} /></span>
        <span className="ins-rot">{m.rotulo}</span>
        {m.delta !== undefined && <span className="ins-chip" data-tom={m.delta < 0 ? 'ruim' : 'bom'}><Seta className="h-3 w-3" strokeWidth={2.2} />{pct(m.delta)}</span>}
      </span>
      <span className="ins-val">{m.valor}</span>
      {m.extra && <span className="ins-ext">{m.extra}</span>}
      {m.serie && <span style={{ color: m.id === 'seguidores' ? '#d98a00' : 'var(--ins-tinta)' }}><Sparkline valores={m.serie} /></span>}
    </>
  )
  return aoEscolher ? (
    <button type="button" className="ins-kpi" data-ativo={ativo || undefined} aria-pressed={ativo} onClick={aoEscolher}>{corpo}</button>
  ) : (
    <div className="ins-kpi">{corpo}</div>
  )
}

export function GradeMetricas({ itens, children }: { itens: Metrica[]; children?: ReactNode }) {
  return <div className="ins-faixa">{itens.map((m) => <CartaoMetrica key={m.id} m={m} />)}{children}</div>
}
