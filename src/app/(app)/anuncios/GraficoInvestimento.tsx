'use client'

import { useEffect, useRef, useState } from 'react'
import type { SerieInvestimento } from '@/dominio/central-anuncios'

const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const data = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '')

export function GraficoInvestimento({ dias, meta, google }: { dias: SerieInvestimento[]; meta: boolean; google: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(480)
  const [selecionado, setSelecionado] = useState<number | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setLargura(Math.max(240, entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const h = 196, esq = 57, dir = 24, topo = 16, base = 30
  const series = [...(meta ? [{ campo: 'meta' as const, nome: 'Meta', cor: 'var(--an-meta)' }] : []), ...(google ? [{ campo: 'google' as const, nome: 'Google Ads', cor: 'var(--an-google)' }] : [])]
  const maior = Math.max(1, ...dias.flatMap(d => series.map(s => d[s.campo])))
  const ordem = 10 ** Math.floor(Math.log10(maior))
  const max = Math.ceil(maior / ordem) * ordem
  const x = (i: number) => dias.length > 1 ? esq + i * (largura - esq - dir) / (dias.length - 1) : (esq + largura - dir) / 2
  const y = (v: number) => h - base - v / max * (h - topo - base)
  const passo = Math.max(1, Math.ceil((dias.length - 1) / (largura < 400 ? 3 : 6)))
  const indice = selecionado !== null && selecionado < dias.length ? selecionado : null
  return <div ref={ref} className="an-chart">
    <svg viewBox={`0 0 ${largura} ${h}`} width="100%" height={h} role="img" aria-label={`Investimento diário em reais, de ${data(dias[0]?.dia ?? '')} a ${data(dias.at(-1)?.dia ?? '')}. Os valores de cada dia estão na tabela abaixo.`}>
      {[0, max / 2, max].map(v => <g key={v}><line x1={esq} x2={largura - dir} y1={y(v)} y2={y(v)} stroke="var(--border-soft)" /><text x={esq - 9} y={y(v) + 4} textAnchor="end" fill="var(--text-3)" fontSize={11}>{v.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })}</text></g>)}
      <text x={esq - 9} y={11} textAnchor="end" fill="var(--text-3)" fontSize={10}>R$</text>
      {series.map(s => <g key={s.campo}><path d={dias.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[s.campo]).toFixed(1)}`).join(' ')} fill="none" stroke={s.cor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />{dias.length < 45 && dias.map((d, i) => <circle key={d.dia} cx={x(i)} cy={y(d[s.campo])} r={3} fill={s.cor}><title>{s.nome} · {data(d.dia)} · {reais(d[s.campo])}</title></circle>)}</g>)}
      {dias.map((d, i) => (i % passo === 0 && i < dias.length - 1 - Math.floor(passo / 2)) || i === dias.length - 1 ? <text key={d.dia} x={x(i)} y={h - 8} textAnchor="middle" fill="var(--text-3)" fontSize={11}>{data(d.dia)}</text> : null)}
      {indice !== null && <line x1={x(indice)} x2={x(indice)} y1={topo} y2={h - base} stroke="var(--text-3)" strokeDasharray="3 3" />}
      <rect x={esq} y={topo} width={Math.max(1, largura - esq - dir)} height={h - base - topo} fill="transparent" onPointerMove={e => { const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect(); const pos = (e.clientX - box.left) * largura / box.width; setSelecionado(Math.max(0, Math.min(dias.length - 1, Math.round((pos - esq) / (largura - esq - dir) * (dias.length - 1))))) }} onPointerLeave={() => setSelecionado(null)} />
    </svg>
    <div className="an-chart-reading">{indice !== null ? <><strong>{data(dias[indice].dia)}</strong>{series.map(s => <span key={s.campo}>{s.nome} {reais(dias[indice][s.campo])}</span>)}</> : <span>Investimento diário · valores em reais</span>}</div>
    <details className="an-chart-data"><summary>Ver valores por dia</summary><div className="an-table-wrap"><table><thead><tr><th>Dia</th>{series.map(s => <th key={s.campo}>{s.nome}</th>)}</tr></thead><tbody>{dias.map(d => <tr key={d.dia}><td>{data(d.dia)}</td>{series.map(s => <td key={s.campo}>{reais(d[s.campo])}</td>)}</tr>)}</tbody></table></div></details>
  </div>
}
