import { Lightbulb, Target, type LucideIcon } from 'lucide-react'
import type { Analise, Item, Tom } from '@/dominio/insights'
import { ESTILO_TOM, ORDEM_TOM, SeloTom } from './tom'

function Lista({ titulo, icone: Icone, cor, itens, comAcao }: { titulo: string; icone: LucideIcon; cor: string; itens: Item[]; comAcao: boolean }) {
  const ordenados = comAcao ? [...itens].sort((a, b) => ORDEM_TOM[a.tom] - ORDEM_TOM[b.tom]) : itens
  return (
    <div>
      <h4>
        <span><Icone /></span> {titulo}
      </h4>
      <ul>
        {ordenados.map((i) => {
          const e = ESTILO_TOM[i.tom]
          const IconeTom = e.icone
          return (
            <li key={i.texto}>
              <IconeTom aria-label={e.rotulo} />
              <span>
                {comAcao && <span>{e.acao}:</span>}
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
    <div>
      <div>
        {conta('ruim') > 0 && <SeloTom tom="ruim" rotulo={`${conta('ruim')} crítico${conta('ruim') > 1 ? 's' : ''}`} />}
        {conta('atencao') > 0 && <SeloTom tom="atencao" rotulo={`${conta('atencao')} de atenção`} />}
        {conta('bom') > 0 && <SeloTom tom="bom" rotulo={`${conta('bom')} positivo${conta('bom') > 1 ? 's' : ''}`} />}
      </div>
      <div>
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
    <div>
      {itens.map((n, k) => {
        const Icone = n.icone
        return (
          <div key={n.rotulo} data-destaque={k === 0 ? '' : undefined}>
            {n.tom && n.tom !== 'neutro' && <span aria-hidden />}
            <div>
              {Icone && (
                <span style={{ background: `${n.cor ?? '#52514e'}1f`, color: n.cor ?? '#52514e' }}>
                  <Icone />
                </span>
              )}
              <p>{n.rotulo}</p>
            </div>
            <p>{n.valor}</p>
            <div>
              {n.tom && n.tom !== 'neutro' && <SeloTom tom={n.tom} rotulo={n.rotuloTom} />}
              {n.extra && <span>{n.extra}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
