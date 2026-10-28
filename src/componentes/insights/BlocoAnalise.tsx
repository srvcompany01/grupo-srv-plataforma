import { Lightbulb, Target, type LucideIcon } from 'lucide-react'
import type { Analise, Item, Tom } from '@/dominio/insights'
import { ESTILO_TOM, ORDEM_TOM, SeloTom } from './tom'

function Lista({ titulo, icone: Icone, cor, itens, comAcao }: { titulo: string; icone: LucideIcon; cor: string; itens: Item[]; comAcao: boolean }) {
  const ordenados = comAcao ? [...itens].sort((a, b) => ORDEM_TOM[a.tom] - ORDEM_TOM[b.tom]) : itens
  return (
    <div className="rounded-lg border border-borda bg-white p-3">
      <h4 className="mb-2 flex items-center gap-2 text-rotulo font-semibold text-texto">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${cor}`}><Icone className="h-3.5 w-3.5" /></span> {titulo}
      </h4>
      <ul className="space-y-1.5">
        {ordenados.map((i) => {
          const e = ESTILO_TOM[i.tom]
          const IconeTom = e.icone
          return (
            <li key={i.texto} className={`flex gap-2 rounded-lg border px-2.5 py-2 text-rotulo text-texto ${e.fundo} ${e.borda}`}>
              <IconeTom className={`mt-0.5 h-4 w-4 shrink-0 ${e.texto}`} aria-label={e.rotulo} />
              <span className="min-w-0 flex-1">
                {comAcao && <span className={`mr-1.5 font-semibold ${e.texto}`}>{e.acao}:</span>}
                {i.texto}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Insights (o que os números mostram) e recomendações (o que fazer), coloridos pelo tom, com um placar no topo. */
export function BlocoAnalise({ analise }: { analise: Analise }) {
  const todos = [...analise.destaques, ...analise.recomendacoes]
  const conta = (t: Tom) => todos.filter((i) => i.tom === t).length
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {conta('ruim') > 0 && <SeloTom tom="ruim" rotulo={`${conta('ruim')} crítico${conta('ruim') > 1 ? 's' : ''}`} />}
        {conta('atencao') > 0 && <SeloTom tom="atencao" rotulo={`${conta('atencao')} de atenção`} />}
        {conta('bom') > 0 && <SeloTom tom="bom" rotulo={`${conta('bom')} positivo${conta('bom') > 1 ? 's' : ''}`} />}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Lista titulo="Insights" icone={Lightbulb} cor="bg-aviso-fundo text-aviso-forte" itens={analise.destaques} comAcao={false} />
        <Lista titulo="Recomendações" icone={Target} cor="bg-[#e6f0fb] text-[#2a78d6]" itens={analise.recomendacoes} comAcao />
      </div>
    </div>
  )
}

export type Numero = { rotulo: string; valor: string; extra?: string; tom?: Tom; rotuloTom?: string; icone?: LucideIcon; cor?: string }

/**
 * Cartões de números do topo. `cor` = cor da métrica (o ícone ganha um fundo colorido, identidade de cada número);
 * `tom` = situação (selo verde/amarelo/vermelho e faixa colorida no topo do cartão).
 */
export function Numeros({ itens }: { itens: Numero[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {itens.map((n, k) => {
        const Icone = n.icone
        return (
          <div key={n.rotulo} data-destaque={k === 0 ? '' : undefined} className="numero relative overflow-hidden rounded-lg border border-borda bg-white p-2.5">
            {n.tom && n.tom !== 'neutro' && <span className={`absolute inset-x-0 top-0 h-1 ${ESTILO_TOM[n.tom].forte}`} aria-hidden />}
            <div className="flex items-center gap-1.5">
              {Icone && (
                <span className="numero-icone flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: `${n.cor ?? '#52514e'}1f`, color: n.cor ?? '#52514e' }}>
                  <Icone className="h-3 w-3" />
                </span>
              )}
              <p className="truncate text-micro text-texto-3">{n.rotulo}</p>
            </div>
            <p className="mt-0.5 text-destaque font-bold tabular-nums text-texto">{n.valor}</p>
            <div className="flex flex-wrap items-center gap-1">
              {n.tom && n.tom !== 'neutro' && <SeloTom tom={n.tom} rotulo={n.rotuloTom} />}
              {n.extra && <span className="text-micro text-texto-3">{n.extra}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
