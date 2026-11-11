'use client'

import { Ic } from '@/componentes/app/Ic'
import type { ReactNode } from 'react'

export type Metrica = {
  id: string
  rotulo: string
  valor: string
  /** Nome do ícone (Material Symbols Rounded). */
  icone: string
  cor: string
  /** Variação contra o período anterior, em %. undefined = sem base de comparação. */
  delta?: number
  /** Um valor por dia; com ele o cartão ganha a linha e pode ser escolhido para o gráfico grande. */
  serie?: number[]
  extra?: string
}

const pct = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

/** Chip de variação: seta de tendência, valor e cor (verde sobe, vermelho desce). */
export function ChipDelta({ delta }: { delta: number }) {
  return <span data-tom={delta < 0 ? 'ruim' : 'bom'}><Ic n={delta < 0 ? 'trending_down' : 'trending_up'} s={12} />{pct(delta)}</span>
}

/** Linha fina do cartão, na cor da métrica (reta, como no protótipo). */
export function Sparkline({ valores, cor }: { valores: number[]; cor: string }) {
  if (valores.length < 2 || !valores.some((v) => v > 0)) return <span style={{ borderColor: cor }} />
  const W = 120
  const H = 36
  const menor = Math.min(...valores)
  const faixa = Math.max(...valores) - menor || 1
  const pts = valores.map((v, i) => `${((i / (valores.length - 1)) * W).toFixed(1)},${(H - 3 - ((v - menor) / faixa) * (H - 6)).toFixed(1)}`)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke={cor} strokeWidth={1.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** Cartão de métrica: ícone colorido (24px, raio 8), rótulo, valor grande, chip de variação "vs. últimos N dias" e linha. Clicável quando tem série. */
export function CartaoMetrica({ m, dias, ativo, aoEscolher }: { m: Metrica; dias: number; ativo?: boolean; aoEscolher?: () => void }) {
  const corpo = (
    <>
      <span>
        <span style={{ background: m.cor }}><Ic n={m.icone} s={14} fill /></span>
        <span>{m.rotulo}</span>
        <Ic n="info" s={15} style={{ color: 'var(--ins-suave)' }} />
      </span>
      <span>{m.valor}</span>
      {m.delta !== undefined ? <span><ChipDelta delta={m.delta} /><span>vs. últimos {dias} dias</span></span> : m.extra ? <span>{m.extra}</span> : null}
      {m.serie ? <Sparkline valores={m.serie} cor={m.cor} /> : null}
    </>
  )
  return aoEscolher ? (
    <button type="button" data-ativo={ativo || undefined} aria-pressed={ativo} onClick={aoEscolher}>{corpo}</button>
  ) : (
    <div>{corpo}</div>
  )
}

const ROTULO_SAUDE = { bom: 'Bom', atencao: 'Atenção', ruim: 'Ruim', neutro: 'Info' } as const

/** "Saúde da conta": nota de 0 a 100 com barra segmentada em degradê vermelho → âmbar → verde e o selo do tom. */
export function CartaoSaude({ nota, tom, dias }: { nota: number | null; tom: keyof typeof ROTULO_SAUDE; dias: number }) {
  return (
    <div title="Média de engajamento, alcance por post, frequência de posts e crescimento de seguidores">
      <span><span style={{ fontSize: 13, textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--text-2)' }}>Saúde da conta</span><Ic n="info" s={15} style={{ color: 'var(--ins-suave)' }} /></span>
      <span>{nota ?? '—'}</span>
      <span><span>últimos {dias} dias</span></span>
      <span>
        <span style={{ ['--nota' as string]: `${nota ?? 0}%` }} />
        {nota !== null && <span data-tom={tom === 'bom' ? undefined : tom}>{ROTULO_SAUDE[tom]}</span>}
      </span>
    </div>
  )
}

export function GradeMetricas({ itens, dias, children }: { itens: Metrica[]; dias: number; children?: ReactNode }) {
  return <div>{children}{itens.map((m) => <CartaoMetrica key={m.id} m={m} dias={dias} />)}</div>
}
