'use client'

import { useState } from 'react'
import { caminhoSuave } from './Social'

type Metrica = { id: string; nome: string; valores: number[] }

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const diaCurto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

/** "Evolução": uma métrica por vez (seletor), área suave em laranja e o pico do período destacado numa etiqueta. */
export function EvolucaoSocial({ dias, metricas }: { dias: string[]; metricas: Metrica[] }) {
  const [id, setId] = useState(metricas[0]?.id ?? '')
  const m = metricas.find((x) => x.id === id) ?? metricas[0]
  if (!m || dias.length < 2) return <p className="py-8 text-center text-[13px]" style={{ color: 'var(--ins-suave)' }}>Sem dados por dia no período.</p>
  const L = 640
  const A = 210
  const M = { cima: 26, baixo: 24, esq: 44, dir: 10 }
  const w = L - M.esq - M.dir
  const h = A - M.cima - M.baixo
  const maior = Math.max(1, ...m.valores)
  const x = (i: number) => M.esq + (i / (dias.length - 1)) * w
  const y = (v: number) => M.cima + h - (v / maior) * h
  const pts = m.valores.map((v, i): [number, number] => [x(i), y(v)])
  const linha = caminhoSuave(pts)
  const pico = m.valores.indexOf(Math.max(...m.valores))
  const passo = Math.max(1, Math.ceil(dias.length / 7))
  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ins-suave)' }}>Métrica</span>
        <select value={m.id} onChange={(e) => setId(e.target.value)} className="ins-select" style={{ height: 32 }} aria-label="Métrica do gráfico">
          {metricas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      </div>
      <svg viewBox={`0 0 ${L} ${A}`} className="h-auto w-full" role="img" aria-label={`Evolução: ${m.nome}`}>
        <defs><linearGradient id="evo-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#ef6a1a" stopOpacity={0.3} /><stop offset="100%" stopColor="#ef6a1a" stopOpacity={0} /></linearGradient></defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={M.esq} x2={L - M.dir} y1={y(maior * f)} y2={y(maior * f)} stroke="var(--ins-borda)" strokeDasharray="3 5" />
            <text x={M.esq - 8} y={y(maior * f) + 3} textAnchor="end" fontSize={10} fill="var(--ins-suave)">{numero.format(maior * f)}</text>
          </g>
        ))}
        {dias.map((d, i) => i % passo === 0 && <text key={d} x={x(i)} y={A - 6} textAnchor="middle" fontSize={10} fill="var(--ins-suave)">{diaCurto(d)}</text>)}
        <path d={`${linha} L${x(dias.length - 1)},${M.cima + h} L${x(0)},${M.cima + h} Z`} fill="url(#evo-area)" />
        <path d={linha} fill="none" stroke="#ef6a1a" strokeWidth={2.2} strokeLinecap="round" />
        {m.valores[pico] > 0 && (
          <g>
            <line x1={x(pico)} x2={x(pico)} y1={y(m.valores[pico]) + 4} y2={M.cima + h} stroke="#ef6a1a" strokeOpacity={0.35} strokeDasharray="3 4" />
            <circle cx={x(pico)} cy={y(m.valores[pico])} r={4} fill="#fff" stroke="#ef6a1a" strokeWidth={2} />
            <rect x={Math.min(Math.max(x(pico) - 26, M.esq), L - M.dir - 52)} y={y(m.valores[pico]) - 24} width={52} height={18} rx={9} fill="#ef6a1a" />
            <text x={Math.min(Math.max(x(pico), M.esq + 26), L - M.dir - 26)} y={y(m.valores[pico]) - 11.5} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#fff">{numero.format(m.valores[pico])}</text>
          </g>
        )}
        {m.valores.map((v, i) => <rect key={dias[i]} x={x(i) - w / dias.length / 2} y={M.cima} width={w / dias.length} height={h} fill="transparent"><title>{`${diaCurto(dias[i])}: ${numero.format(v)}`}</title></rect>)}
      </svg>
    </div>
  )
}
