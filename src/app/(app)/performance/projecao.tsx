import { BadgeDollarSign, Calculator, Lightbulb, Target, TrendingUp, Users, Wallet } from 'lucide-react'
import { BlocoAnalise, Numeros } from '@/componentes/insights/BlocoAnalise'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { rotuloMesCurto, rotuloMesLongo } from '@/dominio/performance'
import { analisarProjecao, baseDaProjecao, ELASTICIDADE_INVESTIMENTO, lerAjustes, projetar } from '@/dominio/projecao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import type { Cliente } from '@/servicos/clientes-plataforma'
import { situacaoGoogle } from '@/servicos/google-agencia'
import { historicoDoCliente } from '@/servicos/performance'
import { mesesDaBase, paraBase } from '@/servicos/projecao'

const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const reais2 = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const n = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** Projeção de 3 meses do cliente: o que acontece se manter o ritmo e se melhorar cada alavanca, com recomendações. */
export async function ProjecaoCliente({ cliente, hoje, ajustesBrutos }: { cliente: Cliente; hoje: string; ajustesBrutos: { inv?: string; org?: string; conv?: string } }) {
  const sb = await criarClienteServidor()
  const google = await situacaoGoogle()
  const meses = mesesDaBase(hoje)
  const h = await historicoDoCliente(sb, cliente, meses, hoje, google.conectado)
  const base = baseDaProjecao(h.meses.map(paraBase))
  const ajustes = lerAjustes(ajustesBrutos)
  if (!base) {
    return (
      <Modulo icone={TrendingUp} titulo="Projeção de 3 meses" descricao={<><NomeCliente nome={cliente.nome} href={`/clientes/${cliente.id}`} /> · base: {meses.map(rotuloMesCurto).join(', ')}</>}>
        <p>
          Para projetar, lance o <strong>faturamento</strong> e o <strong>número de vendas</strong> de pelo menos um dos últimos meses fechados ({meses.map(rotuloMesLongo).join(', ')}) em Performance → Lançamentos. A taxa de conversão e o custo por cliente saem das vendas.
        </p>
      </Modulo>
    )
  }
  const cenarios = projetar(base, ajustes)
  const manter = cenarios[0]
  const [a, m0] = hoje.slice(0, 7).split('-').map(Number)
  const futuros = [0, 1, 2].map((i) => new Date(Date.UTC(a, m0 - 1 + i, 1)).toISOString().slice(0, 7))
  const analise = analisarProjecao(base, cenarios)
  const usados = h.meses.filter((m) => m.faturamento !== null && m.vendas !== null)

  return (
    <>
      <Modulo icone={Calculator} titulo="De onde a projeção parte" descricao={<><NomeCliente nome={cliente.nome} href={`/clientes/${cliente.id}`} /> · média mensal de {usados.map((m) => rotuloMesCurto(m.mes)).join(', ')} (meses fechados com faturamento e vendas lançados)</>}>
        <Numeros itens={[
          { rotulo: 'Investimento por mês', valor: reais(base.investimento), extra: `Meta ${reais(base.investidoMeta)} · Google ${reais(base.investidoGoogle)}`, icone: Wallet, cor: '#6250d6' },
          { rotulo: 'Leads por mês', valor: n(base.leadsPagos + base.leadsOrganicos), extra: `${n(base.leadsPagos)} pagos · ${n(base.leadsOrganicos)} orgânicos${base.cpl !== null ? ` · CPL ${reais2(base.cpl)}` : ''}`, icone: Users, cor: '#eb6834' },
          { rotulo: 'Conversão', valor: base.conversao !== null ? `${n(base.conversao)}%` : '—', extra: `${n(base.vendas)} vendas por mês`, icone: Target, cor: '#1baf7a' },
          { rotulo: 'Custo por cliente (CPA)', valor: base.cpa !== null ? reais(base.cpa) : '—', extra: base.ticket !== null ? `ticket médio ${reais(base.ticket)}` : undefined, icone: BadgeDollarSign, cor: '#2a78d6' },
          { rotulo: 'Faturamento e retorno', valor: reais(base.faturamento), extra: base.roas !== null ? `ROAS ${n(base.roas)}x` : undefined, icone: TrendingUp, cor: '#eda100' },
        ]} />
      </Modulo>

      <Modulo icone={TrendingUp} titulo="Os próximos 3 meses" descricao={`${futuros.map(rotuloMesCurto).join(', ')} · quanto cada caminho rende em 3 meses`}>
        <form method="get">
          <input type="hidden" name="aba" value="projecao" />
          <input type="hidden" name="cliente" value={cliente.id} />
          <label><span>Investir a mais (%)</span><input name="inv" inputMode="numeric" defaultValue={ajustes.investimento} /></label>
          <label><span>Leads orgânicos a mais (%)</span><input name="org" inputMode="numeric" defaultValue={ajustes.organico} /></label>
          <label><span>Conversão melhor (%)</span><input name="conv" inputMode="numeric" defaultValue={ajustes.conversao} /></label>
          <button type="submit">Recalcular</button>
        </form>
        <div>
          <table>
            <thead>
              <tr>
                <th>Cenário</th>
                {['Investimento', 'Leads', 'Vendas', 'Faturamento', 'ROAS', 'CPA', 'Diferença'].map((h2) => <th key={h2}>{h2}</th>)}
              </tr>
            </thead>
            <tbody>
              {cenarios.map((c) => {
                const dif = c.total.faturamento - manter.total.faturamento
                return (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    {[reais(c.total.investimento), n(c.total.leads), n(c.total.vendas), reais(c.total.faturamento), c.total.roas !== null ? `${n(c.total.roas)}x` : '—', c.total.cpa !== null ? reais(c.total.cpa) : '—'].map((x, i) => <td key={i}>{x}</td>)}
                    <td>{c.id === 'manter' ? '—' : `${dif >= 0 ? '+' : ''}${reais(dif)}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p>
          Totais dos 3 meses. As melhorias entram aos poucos (um terço no primeiro mês, dois terços no segundo e tudo no terceiro). Mais verba rende menos que proporcional: dobrar o investimento não dobra os leads (rendimento decrescente de {ELASTICIDADE_INVESTIMENTO}). Mantém o ticket médio. É uma estimativa para decidir, não uma garantia.
        </p>
      </Modulo>

      <Modulo icone={BadgeDollarSign} titulo="Mês a mês" descricao="Manter o ritmo e fazer tudo junto, lado a lado">
        <div>
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                {['Manter · vendas', 'Manter · faturamento', 'Tudo junto · vendas', 'Tudo junto · faturamento'].map((h2) => <th key={h2}>{h2}</th>)}
              </tr>
            </thead>
            <tbody>
              {futuros.map((mes, i) => (
                <tr key={mes}>
                  <td>{rotuloMesLongo(mes)}</td>
                  {[n(manter.meses[i].vendas), reais(manter.meses[i].faturamento), n(cenarios[4].meses[i].vendas), reais(cenarios[4].meses[i].faturamento)].map((x, j) => <td key={j}>{x}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modulo>

      <Modulo icone={Lightbulb} titulo="Insights e recomendações" descricao="O que a projeção mostra e o que fazer para chegar nela">
        <BlocoAnalise analise={analise} />
      </Modulo>
    </>
  )
}
