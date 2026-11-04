'use client'

import { useState } from 'react'

type Metrica = { id: string; nome: string; valores: number[] }

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const inteiro = new Intl.NumberFormat('pt-BR')
const diaCurto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

/**
 * Gráfico de barras hachuradas com uma bolinha vazada no topo; a barra em foco (a de maior valor ou a que está sob o mouse)
 * fica sólida em verde com um balão do valor. Uma métrica por vez, escolhida no seletor.
 */
export function EvolucaoSocial({ dias, metricas }: { dias: string[]; metricas: Metrica[] }) {
  const [id, setId] = useState(metricas[0]?.id ?? '')
  const [sobre, setSobre] = useState<number | null>(null)
  const m = metricas.find((x) => x.id === id) ?? metricas[0]
  if (!m || dias.length < 1) return <p className="py-8 text-center text-[13px]" style={{ color: 'var(--ins-suave)' }}>Sem dados por dia no período.</p>
  const L = 640
  const A = 240
  const M = { cima: 34, baixo: 26, esq: 44, dir: 8 }
  const w = L - M.esq - M.dir
  const h = A - M.cima - M.baixo
  const maior = Math.max(1, ...m.valores)
  const n = dias.length
  const passoX = w / n
  const largura = Math.max(3, passoX - Math.min(6, passoX * 0.3))
  const cx = (i: number) => M.esq + passoX * i + passoX / 2
  const y = (v: number) => M.cima + h - (v / maior) * h
  const pico = m.valores.indexOf(Math.max(...m.valores))
  const foco = sobre ?? (m.valores[pico] > 0 ? pico : null)
  const passo = Math.max(1, Math.ceil(n / 8))
  const soma = m.valores.reduce((s, v) => s + v, 0)
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="ins-grande">{inteiro.format(soma)}</p>
          <p className="ins-sub">soma dos dias no período</p>
        </div>
        <label className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--ins-suave)' }}>
          Métrica
          <select value={m.id} onChange={(e) => setId(e.target.value)} className="ins-select" aria-label="Métrica do gráfico">
            {metricas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select>
        </label>
      </div>
      <svg viewBox={`0 0 ${L} ${A}`} className="h-auto w-full" role="img" aria-label={`Gráfico: ${m.nome} por dia`} onMouseLeave={() => setSobre(null)}>
        <defs>
          <pattern id="evo-hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--ins-hach-a)" /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--ins-hach-b)" strokeWidth="2.2" /></pattern>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={M.esq} x2={L - M.dir} y1={y(maior * f)} y2={y(maior * f)} stroke="var(--ins-borda)" strokeDasharray="2 4" />
            <text x={M.esq - 8} y={y(maior * f) + 3} textAnchor="end" fontSize={10} fill="var(--ins-suave)">{numero.format(maior * f)}</text>
          </g>
        ))}
        {dias.map((d, i) => i % passo === 0 && <text key={d} x={cx(i)} y={A - 8} textAnchor="middle" fontSize={10} fill="var(--ins-suave)">{diaCurto(d)}</text>)}
        {m.valores.map((v, i) => {
          const noFoco = foco === i
          const topo = y(v)
          return (
            <g key={dias[i]} onMouseEnter={() => setSobre(i)}>
              <rect x={cx(i) - passoX / 2} y={M.cima} width={passoX} height={h} fill="transparent" />
              <rect x={cx(i) - largura / 2} y={topo} width={largura} height={Math.max(2, M.cima + h - topo)} rx={2} fill={noFoco ? 'var(--ins-acc)' : 'url(#evo-hach)'} />
              {!noFoco && n <= 31 && v > 0 && <circle cx={cx(i)} cy={topo - 1} r={3} fill="var(--bg)" stroke="var(--ins-suave)" strokeWidth={1.2} />}
            </g>
          )
        })}
        {foco !== null && (
          <g pointerEvents="none">
            <rect x={Math.min(Math.max(cx(foco) - 30, M.esq), L - M.dir - 60)} y={y(m.valores[foco]) - 28} width={60} height={20} rx={4} fill="var(--ins-tinta)" />
            <text x={Math.min(Math.max(cx(foco), M.esq + 30), L - M.dir - 30)} y={y(m.valores[foco]) - 14.5} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--bg)">{numero.format(m.valores[foco])}</text>
          </g>
        )}
      </svg>
    </div>
  )
}
