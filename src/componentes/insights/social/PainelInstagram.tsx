'use client'

import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { CartaoMetrica, type Metrica } from './Metricas'

export type PostLista = { id: string; titulo: string; formato: string; engajamento: string; valor: string; link: string; imagem: string | null }
export type Interacao = { nome: string; valor: number }

const inteiro = new Intl.NumberFormat('pt-BR')
const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const diaCurto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const diaMes = (d: string) => `${Number(d.slice(8, 10))} ${MESES[Number(d.slice(5, 7)) - 1]}`

/** Linha vermelha com área suave e o dia sob o mouse destacado num balão; passo de rótulos por quantidade de dias. */
function Evolucao({ dias, valores, nome }: { dias: string[]; valores: number[]; nome: string }) {
  const [sobre, setSobre] = useState<number | null>(null)
  if (dias.length < 2) return <p className="py-8 text-center text-[13px]" style={{ color: 'var(--ins-suave)' }}>Sem dados por dia no período.</p>
  const L = 640
  const A = 230
  const M = { cima: 30, baixo: 24, esq: 52, dir: 10 }
  const w = L - M.esq - M.dir
  const h = A - M.cima - M.baixo
  const menor = Math.min(...valores)
  const maior = Math.max(...valores)
  const base = Math.max(0, menor - (maior - menor) * 0.15)
  const topo = maior + (maior - menor) * 0.05 || 1
  const x = (i: number) => M.esq + (i / (dias.length - 1)) * w
  const y = (v: number) => M.cima + h - ((v - base) / (topo - base || 1)) * h
  const pts = valores.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const passo = Math.max(1, Math.round(dias.length / 5))
  const cx = sobre !== null ? Math.min(Math.max(x(sobre), M.esq + 38), L - M.dir - 38) : 0
  return (
    <svg viewBox={`0 0 ${L} ${A}`} className="h-auto w-full" role="img" aria-label={`Evolução: ${nome}`} onMouseLeave={() => setSobre(null)}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const v = base + (topo - base) * f
        return (
          <g key={f}>
            <line x1={M.esq} x2={L - M.dir} y1={y(v)} y2={y(v)} stroke="var(--ins-borda)" strokeDasharray="2 4" />
            <text x={M.esq - 8} y={y(v) + 3} textAnchor="end" fontSize={10} fill="var(--ins-suave)">{inteiro.format(Math.round(v))}</text>
          </g>
        )
      })}
      {dias.map((d, i) => i % passo === 0 ? <text key={d} x={x(i)} y={A - 6} textAnchor="middle" fontSize={10} fill="var(--ins-suave)">{diaMes(d)}</text> : null)}
      <polygon points={`${x(0)},${M.cima + h} ${pts} ${x(dias.length - 1)},${M.cima + h}`} fill="#d80d12" fillOpacity={0.1} />
      <polyline points={pts} fill="none" stroke="#d80d12" strokeWidth={1.8} strokeLinejoin="round" />
      {sobre !== null && (
        <g pointerEvents="none">
          <line x1={x(sobre)} x2={x(sobre)} y1={M.cima} y2={M.cima + h} stroke="#d80d12" strokeOpacity={0.35} strokeDasharray="3 3" />
          <circle cx={x(sobre)} cy={y(valores[sobre])} r={3.5} fill="#fff" stroke="#d80d12" strokeWidth={1.8} />
          <rect x={cx - 38} y={y(valores[sobre]) - 30} width={76} height={20} rx={5} fill="var(--ins-tinta)" />
          <text x={cx} y={y(valores[sobre]) - 16} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--bg)">{diaCurto(dias[sobre])} · {numero.format(valores[sobre])}</text>
        </g>
      )}
      {valores.map((_, i) => <rect key={dias[i]} x={x(i) - w / dias.length / 2} y={M.cima} width={w / dias.length} height={h} fill="transparent" onMouseEnter={() => setSobre(i)} />)}
    </svg>
  )
}

/**
 * Corpo do Instagram no padrão de referência: cartões de métricas (clique escolhe a métrica do gráfico),
 * evolução em linha vermelha, "como as pessoas interagem" e a lista de posts de melhor desempenho.
 */
export function PainelInstagram({ metricas, dias, interacoes, totalInteracoes, posts }: { metricas: Metrica[]; dias: string[]; interacoes: Interacao[]; totalInteracoes: number; posts: PostLista[] }) {
  const comSerie = metricas.filter((m) => m.serie && m.serie.length === dias.length)
  const [id, setId] = useState(comSerie[0]?.id ?? '')
  const atual = comSerie.find((m) => m.id === id) ?? comSerie[0]
  const maior = Math.max(1, ...interacoes.map((i) => i.valor))
  return (
    <div className="flex flex-col gap-4">
      <div className="ins-faixa">
        {metricas.map((m) => {
          const clicavel = !!m.serie && m.serie.length === dias.length
          return <CartaoMetrica key={m.id} m={m} ativo={atual?.id === m.id} aoEscolher={clicavel ? () => setId(m.id) : undefined} />
        })}
      </div>
      <div className="ins-principal">
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="ins-titulo">Evolução{atual ? ` · ${atual.rotulo}` : ''}</h3>
              <p className="ins-sub">Últimos {dias.length} dias · uma métrica por vez</p>
            </div>
            <p className="ins-sub">Escolha a métrica nos cartões acima</p>
          </div>
          {atual?.serie ? <Evolucao dias={dias} valores={atual.serie} nome={atual.rotulo} /> : <p className="py-8 text-center text-[13px]" style={{ color: 'var(--ins-suave)' }}>A Meta não entrega nenhuma métrica por dia para esta conta no período.</p>}
        </section>
        <aside className="flex flex-col gap-6">
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <div>
                <h3 className="ins-titulo">Como as pessoas interagem</h3>
                <p className="ins-sub">Soma dos últimos {dias.length} dias</p>
              </div>
              <p className="ins-titulo tabular-nums">{inteiro.format(totalInteracoes)}</p>
            </div>
            <ul className="flex flex-col gap-3.5">
              {interacoes.map((i) => (
                <li key={i.nome}>
                  <p className="mb-1 flex items-center justify-between text-[12.5px]"><span>{i.nome}</span><span className="tabular-nums font-semibold">{inteiro.format(i.valor)}</span></p>
                  <div className="ins-trilho"><span style={{ width: `${Math.max(2, (i.valor / maior) * 100)}%`, background: i.valor === maior ? '#d80d12' : 'var(--ins-tinta)' }} /></div>
                </li>
              ))}
            </ul>
          </section>
          {posts.length > 0 && (
            <section>
              <h3 className="ins-titulo mb-1">Posts de melhor desempenho</h3>
              <ul>
                {posts.map((p) => (
                  <li key={p.id} className="ins-linha-post">
                    <a href={p.link} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-2.5">
                      {p.imagem && (
                        // eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Instagram (URL que expira)
                        <img src={p.imagem} alt="" className="h-9 w-9 flex-none rounded-md object-cover" loading="lazy" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{p.titulo}</span>
                        <span className="block truncate text-[11.5px]" style={{ color: 'var(--ins-suave)' }}>{p.formato} · {p.engajamento} engaj.</span>
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums">{p.valor}</span>
                      <ExternalLink className="h-3 w-3 flex-none" style={{ color: 'var(--ins-suave)' }} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
