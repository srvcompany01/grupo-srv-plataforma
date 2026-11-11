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
        <p>{r.erro}</p>
      ) : r.campanhas.length === 0 ? (
        <p>Nenhuma campanha ativa nesta conta agora.</p>
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
    <div>
      <div>
        {itens.map(([rot, v]) => (
          <div key={rot}>
            <p>{rot}</p>
            <p>{v}</p>
          </div>
        ))}
      </div>
      <div>
        <table>
          <thead>
            <tr>
              <th>Campanha</th>
              <th>Investido</th>
              <th>Cliques</th>
              <th>CTR</th>
              <th>CPC</th>
              <th>Conversões</th>
            </tr>
          </thead>
          <tbody>
            {r.campanhas.map((c) => (
              <tr key={c.id}>
                <td><p title={c.nome}>{c.nome}</p><p>{c.tipo}</p></td>
                <td>{dinheiro.format(c.custo)}</td>
                <td>{numero.format(c.cliques)}</td>
                <td>{pct(c.ctr)}</td>
                <td>{c.cliques ? dinheiro.format(c.cpc) : '—'}</td>
                <td>{c.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>{hoje ? 'Dados consultados agora no Google Ads; o próprio Google pode levar alguns minutos para consolidar o dia.' : 'Dados do Google Ads, atualizados a cada 30 minutos.'}</p>
    </div>
  )
}
