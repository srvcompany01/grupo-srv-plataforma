import { BadgeDollarSign, Calculator, Lightbulb, Target, TrendingUp, Users, Wallet } from 'lucide-react'
import { BlocoAnalise, Numeros } from '@/componentes/insights/BlocoAnalise'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { rotuloMesCurto, rotuloMesLongo } from '@/dominio/performance'
import { analisarProjecao, baseDaProjecao, ELASTICIDADE_INVESTIMENTO, lerAjustes, projetar } from '@/dominio/projecao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { botaoSecundario, campo, rotulo } from '@/lib/ui'
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
        <p className="rounded-xl border border-dashed border-borda py-8 text-center text-rotulo text-texto-3">
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
        <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="aba" value="projecao" />
          <input type="hidden" name="cliente" value={cliente.id} />
          <label className="space-y-1"><span className={rotulo}>Investir a mais (%)</span><input name="inv" inputMode="numeric" defaultValue={ajustes.investimento} className={`${campo} w-28`} /></label>
          <label className="space-y-1"><span className={rotulo}>Leads orgânicos a mais (%)</span><input name="org" inputMode="numeric" defaultValue={ajustes.organico} className={`${campo} w-28`} /></label>
          <label className="space-y-1"><span className={rotulo}>Conversão melhor (%)</span><input name="conv" inputMode="numeric" defaultValue={ajustes.conversao} className={`${campo} w-28`} /></label>
          <button type="submit" className={botaoSecundario}>Recalcular</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-rotulo">
            <thead>
              <tr className="border-b border-borda text-left text-legenda text-texto-3">
                <th className="py-2 pr-3 font-medium">Cenário</th>
                {['Investimento', 'Leads', 'Vendas', 'Faturamento', 'ROAS', 'CPA', 'Diferença'].map((h2) => <th key={h2} className="py-2 pr-3 text-right font-medium last:pr-0">{h2}</th>)}
              </tr>
            </thead>
            <tbody>
              {cenarios.map((c) => {
                const dif = c.total.faturamento - manter.total.faturamento
                return (
                  <tr key={c.id} className={`border-b border-borda/60 last:border-0 ${c.id === 'combinado' ? 'font-semibold' : ''}`}>
                    <td className="py-2 pr-3">{c.nome}</td>
                    {[reais(c.total.investimento), n(c.total.leads), n(c.total.vendas), reais(c.total.faturamento), c.total.roas !== null ? `${n(c.total.roas)}x` : '—', c.total.cpa !== null ? reais(c.total.cpa) : '—'].map((x, i) => <td key={i} className="py-2 pr-3 text-right tabular-nums">{x}</td>)}
                    <td className={`py-2 text-right tabular-nums ${dif > 0 ? 'text-sucesso-forte' : 'text-texto-3'}`}>{c.id === 'manter' ? '—' : `${dif >= 0 ? '+' : ''}${reais(dif)}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-legenda text-texto-3">
          Totais dos 3 meses. As melhorias entram aos poucos (um terço no primeiro mês, dois terços no segundo e tudo no terceiro). Mais verba rende menos que proporcional: dobrar o investimento não dobra os leads (rendimento decrescente de {ELASTICIDADE_INVESTIMENTO}). Mantém o ticket médio. É uma estimativa para decidir, não uma garantia.
        </p>
      </Modulo>

      <Modulo icone={BadgeDollarSign} titulo="Mês a mês" descricao="Manter o ritmo e fazer tudo junto, lado a lado">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-rotulo">
            <thead>
              <tr className="border-b border-borda text-left text-legenda text-texto-3">
                <th className="py-2 pr-3 font-medium">Mês</th>
                {['Manter · vendas', 'Manter · faturamento', 'Tudo junto · vendas', 'Tudo junto · faturamento'].map((h2) => <th key={h2} className="py-2 pr-3 text-right font-medium last:pr-0">{h2}</th>)}
              </tr>
            </thead>
            <tbody>
              {futuros.map((mes, i) => (
                <tr key={mes} className="border-b border-borda/60 last:border-0">
                  <td className="py-2 pr-3">{rotuloMesLongo(mes)}</td>
                  {[n(manter.meses[i].vendas), reais(manter.meses[i].faturamento), n(cenarios[4].meses[i].vendas), reais(cenarios[4].meses[i].faturamento)].map((x, j) => <td key={j} className="py-2 pr-3 text-right tabular-nums last:pr-0">{x}</td>)}
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
