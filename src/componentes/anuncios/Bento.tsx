import type { ReactNode } from 'react'

/**
 * Peças visuais da aba Anúncios (estilo "bento": cartões brancos sobre fundo cinza, números grandes, barras
 * hachuradas que ganham cor no destaque). Só HTML/CSS/SVG, sem estado: funciona em componente de servidor.
 * Cores em globals.css (.anu): --anu-verde, --anu-amarelo, --anu-laranja.
 */

export const COR = { verde: 'var(--anu-verde)', amarelo: 'var(--anu-amarelo)', laranja: 'var(--anu-laranja)', azul: 'var(--anu-azul)', roxo: 'var(--anu-roxo)' } as const
const PALETA = [COR.verde, COR.amarelo, COR.laranja, COR.azul, COR.roxo]
export const corDaVez = (i: number) => PALETA[i % PALETA.length]

export function Cartao({ titulo, sub, acoes, id, className = '', children }: { titulo?: ReactNode; sub?: ReactNode; acoes?: ReactNode; id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`anu-card ${className}`}>
      {(titulo || acoes) && (
        <header className="anu-card-topo">
          <div className="min-w-0">
            {titulo && <h2 className="anu-titulo">{titulo}</h2>}
            {sub && <p className="anu-sub">{sub}</p>}
          </div>
          {acoes}
        </header>
      )}
      {children}
    </section>
  )
}

/** Variação contra o período anterior: seta e % (verde quando melhora, laranja quando piora). */
export function Variacao({ atual, anterior, menorMelhor = false }: { atual: number; anterior: number | null; menorMelhor?: boolean }) {
  if (anterior === null || !Number.isFinite(anterior) || anterior === 0) return <span className="anu-sub">sem comparação</span>
  const v = ((atual - anterior) / anterior) * 100
  const bom = menorMelhor ? v <= 0 : v >= 0
  return (
    <span className="anu-sub">
      <b className={bom ? 'anu-bom' : 'anu-ruim'}>{v >= 0 ? '↗' : '↘'} {Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</b> vs período anterior
    </span>
  )
}

/** Número grande com rótulo em cima e variação embaixo (coluna de totais da referência). */
export function Kpi({ rotulo, valor, extra }: { rotulo: string; valor: string; extra?: ReactNode }) {
  return (
    <div className="anu-kpi">
      <p className="anu-sub">{rotulo}</p>
      <p className="anu-num">{valor}</p>
      {extra}
    </div>
  )
}

const DIA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const rotuloDia = (d: string, poucos: boolean) => (poucos ? DIA_SEMANA[new Date(`${d}T12:00:00Z`).getUTCDay()] : `${d.slice(8, 10)}/${d.slice(5, 7)}`)

/**
 * Barras por dia, empilhadas por série. Em repouso só o dia de pico tem cor (as outras ficam hachuradas em
 * cinza); passar o mouse num dia colore aquele dia e mostra o balão com os valores.
 */
export function BarrasDiarias({ dias, series, formato }: { dias: string[]; series: { nome: string; cor: string; valores: number[] }[]; formato: (n: number) => string }) {
  if (!dias.length) return <p className="anu-vazio">Sem dados por dia no período.</p>
  const totais = dias.map((_, i) => series.reduce((s, x) => s + (x.valores[i] ?? 0), 0))
  const maior = Math.max(1, ...totais)
  const pico = totais.indexOf(Math.max(...totais))
  const poucos = dias.length <= 7
  const passo = Math.max(1, Math.ceil(dias.length / 7))
  return (
    <div className="anu-barras" role="img" aria-label={`Por dia: ${dias.map((d, i) => `${rotuloDia(d, false)} ${formato(totais[i])}`).join(', ')}`}>
      <div className="anu-barras-grade" aria-hidden>
        {[1, 0.5, 0].map((f) => <span key={f}><i>{formato(maior * f)}</i></span>)}
      </div>
      <div className="anu-barras-cols">
        {dias.map((d, i) => (
          <div key={d} className="anu-col" data-pico={i === pico && totais[i] > 0 ? '' : undefined} data-lado={i >= dias.length / 2 ? 'esq' : undefined} tabIndex={0}>
            <div className="anu-col-trilho">
              <div className="anu-col-pilha" style={{ height: `${Math.max(totais[i] > 0 ? 3 : 0, (totais[i] / maior) * 100)}%` }}>
                {series.map((s) => (s.valores[i] ?? 0) > 0 && <span key={s.nome} className="anu-seg" style={{ flexGrow: s.valores[i], ['--c' as string]: s.cor }} />)}
              </div>
              <div className="anu-dica" role="tooltip">
                <b>{rotuloDia(d, false)}{poucos ? ` · ${rotuloDia(d, true)}` : ''}</b>
                {series.map((s) => <span key={s.nome}><i style={{ background: s.cor }} />{s.nome}<em>{formato(s.valores[i] ?? 0)}</em></span>)}
                {series.length > 1 && <span><i />Total<em>{formato(totais[i])}</em></span>}
              </div>
            </div>
            <small>{i % passo === 0 ? rotuloDia(d, poucos) : ''}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Legenda({ itens }: { itens: { nome: string; cor: string }[] }) {
  return (
    <span className="anu-legenda">
      {itens.map((i) => <span key={i.nome}><i style={{ background: i.cor }} />{i.nome}</span>)}
    </span>
  )
}

/** Barra única dividida em fatias hachuradas coloridas, com a legenda e o % de cada uma (a "análise de custos"). */
export function BarraSegmentada({ itens, formato }: { itens: { rotulo: string; valor: number; cor: string }[]; formato: (n: number) => string }) {
  const total = itens.reduce((s, i) => s + i.valor, 0)
  if (!total) return <p className="anu-vazio">Nada investido no período.</p>
  return (
    <div className="space-y-3">
      <div className="anu-segmentos">
        {itens.filter((i) => i.valor > 0).map((i) => <span key={i.rotulo} title={`${i.rotulo}: ${formato(i.valor)}`} style={{ flexGrow: i.valor, ['--c' as string]: i.cor }} />)}
      </div>
      <ul className="anu-lista-pct">
        {itens.map((i) => (
          <li key={i.rotulo}>
            <i style={{ background: i.cor }} />
            <span className="truncate">{i.rotulo}</span>
            <em>{formato(i.valor)}</em>
            <b>{Math.round((i.valor / total) * 100)}%</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Trilho largo com a parte cheia hachurada (o "limite de gastos"): valor e referência nas pontas. */
export function Trilho({ valor, max, cor = COR.verde, esquerda, direita }: { valor: number; max: number; cor?: string; esquerda: ReactNode; direita: ReactNode }) {
  const pct = max > 0 ? Math.min(100, (valor / max) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="anu-trilho"><span style={{ width: `${pct}%`, ['--c' as string]: cor }} /></div>
      <div className="flex justify-between gap-2 text-[12px]"><span className="font-semibold text-texto">{esquerda}</span><span className="anu-sub">{direita}</span></div>
    </div>
  )
}

/** Meia-lua em 10 gomos: os primeiros, até o %, coloridos do amarelo ao verde (a "saúde financeira"). */
export function Medidor({ pct, centro, legenda }: { pct: number | null; centro: string; legenda: ReactNode }) {
  const n = 10
  const cheios = pct === null ? 0 : Math.round((Math.max(0, Math.min(100, pct)) / 100) * n)
  const R = 80
  const r = 52
  const gomo = (k: number) => {
    const folga = 0.035
    const a0 = Math.PI - (k / n) * Math.PI - folga
    const a1 = Math.PI - ((k + 1) / n) * Math.PI + folga
    const p = (ang: number, raio: number) => `${100 + raio * Math.cos(ang)},${96 - raio * Math.sin(ang)}`
    return `M${p(a0, R)} A${R},${R} 0 0 1 ${p(a1, R)} L${p(a1, r)} A${r},${r} 0 0 0 ${p(a0, r)} Z`
  }
  return (
    <div className="anu-medidor">
      <svg viewBox="0 0 200 104" role="img" aria-label={`${centro}: ${pct === null ? 'sem dados' : `${Math.round(pct)}%`}`}>
        {Array.from({ length: n }, (_, k) => (
          <path key={k} d={gomo(k)} fill={k < cheios ? `color-mix(in oklab, ${COR.amarelo}, ${COR.verde} ${Math.round((k / (n - 1)) * 100)}%)` : 'var(--anu-trilho)'} />
        ))}
      </svg>
      <div className="anu-medidor-centro"><b>{pct === null ? '—' : `${Math.round(pct)}%`}</b><span>{centro}</span></div>
      <p className="anu-sub text-center">{legenda}</p>
    </div>
  )
}

/** Linhas com barra de progresso (o "acompanhamento de metas"): nome, valor/referência e uma observação. */
export function Progressos({ itens, vazio }: { itens: { id: string; nome: ReactNode; valor: number; max: number; direita: string; obs?: ReactNode; cor: string; icone?: ReactNode }[]; vazio: string }) {
  if (!itens.length) return <p className="anu-vazio">{vazio}</p>
  return (
    <ul className="anu-progressos">
      {itens.map((i) => (
        <li key={i.id}>
          {i.icone && <span className="anu-prog-ic">{i.icone}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2"><span className="truncate text-[12.5px] font-semibold text-texto">{i.nome}</span><span className="shrink-0 text-[11.5px] tabular-nums text-texto-2">{i.direita}</span></div>
            <div className="anu-prog"><span style={{ width: `${i.max > 0 ? Math.max(2, Math.min(100, (i.valor / i.max) * 100)) : 0}%`, ['--c' as string]: i.cor }} /></div>
            {i.obs && <p className="anu-sub mt-0.5">{i.obs}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
