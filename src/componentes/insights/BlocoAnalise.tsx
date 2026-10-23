import { Lightbulb, Target } from 'lucide-react'
import type { Analise } from '@/dominio/insights'

/** Destaques (o que os números mostram) e recomendações (o que fazer). */
export function BlocoAnalise({ analise }: { analise: Analise }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-borda bg-fundo/50 p-3">
        <h4 className="mb-1.5 flex items-center gap-1.5 text-rotulo font-semibold text-texto"><Lightbulb className="h-4 w-4 text-aviso" /> Insights</h4>
        <ul className="space-y-1 text-rotulo text-texto-2">{analise.destaques.map((d) => <li key={d}>• {d}</li>)}</ul>
      </div>
      <div className="rounded-xl border border-borda bg-fundo/50 p-3">
        <h4 className="mb-1.5 flex items-center gap-1.5 text-rotulo font-semibold text-texto"><Target className="h-4 w-4 text-sucesso" /> Recomendações</h4>
        <ul className="space-y-1 text-rotulo text-texto-2">{analise.recomendacoes.map((d) => <li key={d}>• {d}</li>)}</ul>
      </div>
    </div>
  )
}

/** Cartões de números do topo. */
export function Numeros({ itens }: { itens: [string, string, string?][] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {itens.map(([rotulo, valor, extra]) => (
        <div key={rotulo} className="rounded-xl border border-borda bg-white p-2.5">
          <p className="text-micro text-texto-3">{rotulo}</p>
          <p className="text-destaque font-bold tabular-nums text-texto">{valor}</p>
          {extra && <p className="text-micro text-texto-3">{extra}</p>}
        </div>
      ))}
    </div>
  )
}
