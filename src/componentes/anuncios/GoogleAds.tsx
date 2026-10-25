import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Modulo } from '@/componentes/Modulo'
import { rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { formatarContaGoogleAds, totaisCampanhas, type Campanha } from '@/dominio/google'
import { campanhasGoogle } from '@/servicos/google-agencia'

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`

/** Campanhas ativas do Google Ads do cliente com os números do período (pela MCC da agência). */
export async function GoogleAds({ contaId, periodo, seletor }: { contaId: string; periodo: PeriodoAnuncios; seletor: ReactNode }) {
  const r = await campanhasGoogle(contaId, periodo)
  return (
    <Modulo icone={Search} titulo="Google Ads" descricao={`Conta ${formatarContaGoogleAds(contaId)} · campanhas ativas, ${rotuloPeriodo(periodo)}`} acoes={seletor}>
      {'erro' in r ? (
        <p className="rounded-xl border border-perigo-borda bg-perigo-fundo/40 px-3 py-2 text-rotulo text-perigo-forte">{r.erro}</p>
      ) : r.campanhas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda py-10 text-center text-corpo text-texto-3">Nenhuma campanha ativa nesta conta agora.</p>
      ) : (
        <ResumoCampanhas r={r} hoje={periodo.atalho === 'hoje'} />
      )}
    </Modulo>
  )
}

function ResumoCampanhas({ r, hoje }: { r: { campanhas: Campanha[]; moeda: string }; hoje: boolean }) {
  const dinheiro = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: r.moeda })
  const t = totaisCampanhas(r.campanhas)
  const itens: [string, string][] = [
    ['Investido', dinheiro.format(t.custo)],
    ['Impressões', numero.format(t.impressoes)],
    ['Cliques', numero.format(t.cliques)],
    ['CTR', pct(t.ctr)],
    ['Conversões', t.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })],
    ['Custo/conversão', t.conversoes ? dinheiro.format(t.custoPorConversao) : '—'],
  ]
  return (
    <div className="@container space-y-3">
      <div className="grid grid-cols-2 gap-2 @xl:grid-cols-3 @4xl:grid-cols-6">
        {itens.map(([rot, v]) => (
          <div key={rot} className="rounded-xl border border-borda bg-white p-2.5">
            <p className="text-micro text-texto-3">{rot}</p>
            <p className="text-destaque font-bold tabular-nums text-texto">{v}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-rotulo">
          <thead>
            <tr className="border-b border-borda text-left text-legenda text-texto-3">
              <th className="py-2 pr-3 font-medium">Campanha</th>
              <th className="py-2 pr-3 text-right font-medium">Investido</th>
              <th className="py-2 pr-3 text-right font-medium">Cliques</th>
              <th className="py-2 pr-3 text-right font-medium">CTR</th>
              <th className="py-2 pr-3 text-right font-medium">CPC</th>
              <th className="py-2 text-right font-medium">Conversões</th>
            </tr>
          </thead>
          <tbody>
            {r.campanhas.map((c) => (
              <tr key={c.id} className="border-b border-borda/60 last:border-0">
                <td className="max-w-64 py-2 pr-3"><p className="truncate font-medium text-texto" title={c.nome}>{c.nome}</p><p className="text-micro text-texto-3">{c.tipo}</p></td>
                <td className="py-2 pr-3 text-right tabular-nums">{dinheiro.format(c.custo)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{numero.format(c.cliques)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{pct(c.ctr)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{c.cliques ? dinheiro.format(c.cpc) : '—'}</td>
                <td className="py-2 text-right tabular-nums">{c.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-legenda text-texto-3">{hoje ? 'Dados consultados agora no Google Ads; o próprio Google pode levar alguns minutos para consolidar o dia.' : 'Dados do Google Ads, atualizados a cada 30 minutos.'}</p>
    </div>
  )
}
