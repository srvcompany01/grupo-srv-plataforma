/**
 * Gráfico por dia em SVG (sem biblioteca): barras para uma série, linhas para até 3 séries da MESMA unidade
 * (nunca dois eixos). Passar o mouse mostra o valor do dia. Cores: paleta categorial validada (azul, laranja, aqua).
 */
export const CORES_SERIE = ['#2a78d6', '#eb6834', '#1baf7a'] as const

const diaCurto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

export function GraficoDiario({ titulo, dias, series, formato, tipo = 'linha', rotulo = diaCurto }: { titulo: string; dias: string[]; series: { nome: string; valores: number[] }[]; formato: (n: number) => string; tipo?: 'linha' | 'barras'; /** Rótulo do eixo (padrão dd/mm; para meses, passe outro). */ rotulo?: (d: string) => string }) {
  const L = 640
  const A = 160
  const M = { cima: 8, baixo: 22, esq: 44, dir: 8 }
  const maior = Math.max(1, ...series.flatMap((s) => s.valores))
  const w = L - M.esq - M.dir
  const h = A - M.cima - M.baixo
  const x = (i: number) => M.esq + (dias.length <= 1 ? w / 2 : (i / (dias.length - 1)) * w)
  const y = (v: number) => M.cima + h - (v / maior) * h
  const passo = Math.max(1, Math.ceil(dias.length / 8))
  const larguraBarra = Math.max(2, w / Math.max(1, dias.length) - 2)
  if (!dias.length) return <p className="py-6 text-center text-rotulo text-texto-3">Sem dados por dia no período.</p>
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-legenda text-texto-2">
        <span className="font-semibold text-texto">{titulo}</span>
        {series.length > 1 && series.map((s, i) => (
          <span key={s.nome} className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm" style={{ background: CORES_SERIE[i] }} />{s.nome}</span>
        ))}
      </figcaption>
      <svg viewBox={`0 0 ${L} ${A}`} className="h-auto max-h-56 w-full" role="img" aria-label={titulo}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={M.esq} x2={L - M.dir} y1={y(maior * f)} y2={y(maior * f)} stroke="#e5e4e0" strokeWidth={1} />
            <text x={M.esq - 6} y={y(maior * f) + 3} textAnchor="end" fontSize={10} fill="#76756f">{formato(maior * f)}</text>
          </g>
        ))}
        {dias.map((d, i) => i % passo === 0 && <text key={d} x={x(i)} y={A - 6} textAnchor="middle" fontSize={10} fill="#76756f">{rotulo(d)}</text>)}
        {tipo === 'barras'
          ? series[0]?.valores.map((v, i) => (
              <rect key={dias[i]} x={x(i) - larguraBarra / 2} y={y(v)} width={larguraBarra} height={Math.max(0, M.cima + h - y(v))} rx={Math.min(4, larguraBarra / 2)} fill={CORES_SERIE[0]}>
                <title>{`${rotulo(dias[i])}: ${formato(v)}`}</title>
              </rect>
            ))
          : series.map((s, k) => (
              <g key={s.nome}>
                <polyline points={s.valores.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={CORES_SERIE[k]} strokeWidth={2} strokeLinejoin="round" />
                {s.valores.map((v, i) => (
                  <circle key={dias[i]} cx={x(i)} cy={y(v)} r={dias.length > 45 ? 6 : 8} fill="transparent">
                    <title>{`${rotulo(dias[i])} · ${s.nome}: ${formato(v)}`}</title>
                  </circle>
                ))}
              </g>
            ))}
      </svg>
    </figure>
  )
}
