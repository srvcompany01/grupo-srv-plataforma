import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import Link from 'next/link'
import { AcoesLancamento } from '@/componentes/financeiro/AcoesLancamento'
import { LancamentoDialog } from '@/componentes/financeiro/LancamentoDialog'
import { ABAS_FINANCEIRO, CATEGORIAS_DIRETAS, ROTULO_ABA_FINANCEIRO, calcularMargens, filtrarLancamentos, formatarReais, lerAbaFinanceiro, lerMes, limitesDoMes, margensPorCliente, mesVizinho, resumir, serieDeMargem, serieMensal } from '@/dominio/financeiro'
import { dataDeHoje } from '@/dominio/filtros'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { listarLancamentos } from '@/servicos/financeiro'
import { NomeCliente } from '@/componentes/NomeCliente'

const textoParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const nomeMes = (mes: string) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${mes}-01T00:00:00Z`))
const pct = (n: number | null) => (n === null ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`)
const dia = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/')

function Cartao({ rotulo, valor, tom, detalhe }: { rotulo: string; valor: number; tom?: 'bom' | 'ruim'; detalhe?: string }) {
  return (
    <div>
      <p>{rotulo}</p>
      <p>{formatarReais(valor)}</p>
      {detalhe && <p>{detalhe}</p>}
    </div>
  )
}

function CartaoMargem({ rotulo, margem, lucro, base, anterior, ajuda }: { rotulo: string; margem: number | null; lucro: number; base: string; anterior: number | null; ajuda: string }) {
  const dif = margem !== null && anterior !== null ? margem - anterior : null
  return (
    <div title={ajuda}>
      <p>{rotulo}</p>
      <p>{pct(margem)}</p>
      <p>{base}: <b>{formatarReais(lucro)}</b></p>
      {dif !== null && <p>{dif >= 0 ? '▲' : '▼'} {Math.abs(dif).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p. vs. mês anterior</p>}
    </div>
  )
}

export default async function PaginaFinanceiro({ searchParams }: PageProps<'/financeiro'>) {
  const sp = await searchParams
  await exigirAdmin()
  const hoje = dataDeHoje(new Date())
  const mes = lerMes(textoParam(sp.mes), hoje)
  const aba = lerAbaFinanceiro(textoParam(sp.aba))
  const sb = await criarClienteServidor()
  const { de, ate } = limitesDoMes(mes)
  const [lancamentos, historico, clientes] = await Promise.all([
    listarLancamentos(sb, de, ate),
    listarLancamentos(sb, limitesDoMes(mesVizinho(mes, -5)).de, ate),
    listarClientes(sb),
  ])
  const resumo = resumir(lancamentos)
  const margens = calcularMargens(lancamentos)
  const margensAnterior = calcularMargens(historico.filter((l) => l.data.startsWith(mesVizinho(mes, -1))))
  const porCliente = margensPorCliente(lancamentos)
  const serieMargem = serieDeMargem(historico, mes)
  const serie = serieMensal(historico, mes)
  const maior = Math.max(1, ...serie.flatMap((m) => [m.entradas, m.despesas]))
  const maiorCategoria = Math.max(1, ...resumo.porCategoria.map((c) => c.centavos))
  const linhas = filtrarLancamentos(lancamentos, aba)
  const opcoesClientes = clientes.map((c) => ({ id: c.id, nome: c.nome }))
  const href = (m: string, a = aba) => `/financeiro?mes=${m}${a === 'todos' ? '' : `&aba=${a}`}`

  return (
    <div>
      <header>
        <h1><Wallet /> Financeiro</h1>
        <div>
          <nav aria-label="Mês">
            <Link href={href(mesVizinho(mes, -1))} aria-label="Mês anterior"><ChevronLeft /></Link>
            <span>{nomeMes(mes)}</span>
            <Link href={href(mesVizinho(mes, 1))} aria-label="Próximo mês"><ChevronRight /></Link>
          </nav>
          <LancamentoDialog clientes={opcoesClientes} hoje={hoje} />
        </div>
      </header>

      <main>
        <section aria-label="Resumo do mês">
          <Cartao rotulo="Entradas" valor={resumo.entradas} tom="bom" detalhe={resumo.aReceber ? `+ ${formatarReais(resumo.aReceber)} a receber` : undefined} />
          <Cartao rotulo="Despesas" valor={resumo.despesas} tom="ruim" detalhe={resumo.aPagar ? `+ ${formatarReais(resumo.aPagar)} a pagar` : undefined} />
          <Cartao rotulo="Saldo do mês" valor={resumo.saldo} tom={resumo.saldo >= 0 ? 'bom' : 'ruim'} detalhe="só o que já foi pago" />
          <Cartao rotulo="Previsto" valor={resumo.previsto} tom={resumo.previsto >= 0 ? 'bom' : 'ruim'} detalhe="tudo o que está lançado" />
          <Cartao rotulo="A receber / pagar" valor={resumo.aReceber - resumo.aPagar} detalhe={`${formatarReais(resumo.aReceber)} / ${formatarReais(resumo.aPagar)}`} />
        </section>

        <section aria-label="Margem de lucro">
          <div>
            <CartaoMargem rotulo="Margem líquida" margem={margens.margemLiquida} lucro={margens.lucro} base="lucro" anterior={margensAnterior.margemLiquida} ajuda="(entradas − todas as despesas, impostos inclusos) ÷ entradas, pelo que está lançado: recebido e a receber, pago e a pagar" />
            <CartaoMargem rotulo="Margem de contribuição" margem={margens.margemContribuicao} lucro={margens.contribuicao} base="sobra antes dos custos fixos" anterior={margensAnterior.margemContribuicao} ajuda={`(entradas − ${CATEGORIAS_DIRETAS.join(', ').toLowerCase()}) ÷ entradas`} />
          </div>
          <p>Calculada pelo que está lançado no mês, já recebido/pago ou ainda por receber/pagar. Receita: {formatarReais(margens.receita)} · Despesas: {formatarReais(margens.despesas)}. A contribuição desconta só {CATEGORIAS_DIRETAS.join(', ').toLowerCase()}.</p>
        </section>

        <section>
          <div>
            <h2>Últimos 6 meses</h2>
            <div>
              {serie.map((m) => (
                <Link key={m.mes} href={href(m.mes)} title={`${nomeMes(m.mes)}: entradas ${formatarReais(m.entradas)}, despesas ${formatarReais(m.despesas)}`}>
                  <div>
                    <span style={{ height: `${(m.entradas / maior) * 100}%` }} />
                    <span style={{ height: `${(m.despesas / maior) * 100}%` }} />
                  </div>
                  <span>{nomeMes(m.mes).split(' ')[0].slice(0, 3)}</span>
                  <span>{pct(serieMargem.find((x) => x.mes === m.mes)?.margemLiquida ?? null)}</span>
                </Link>
              ))}
            </div>
            <p><span>■</span> entradas <span>■</span> despesas (pagas e pendentes)</p>
          </div>
          <div>
            <h2>Por categoria</h2>
            {resumo.porCategoria.length === 0 ? (
              <p>Nada lançado neste mês.</p>
            ) : (
              <ul>
                {resumo.porCategoria.map((c) => (
                  <li key={`${c.tipo}-${c.categoria}`}>
                    <div><span>{c.categoria}</span><span>{formatarReais(c.centavos)}</span></div>
                    <div><div style={{ width: `${(c.centavos / maiorCategoria) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {porCliente.length > 0 && (
          <section>
            <h2>Margem por cliente</h2>
            <div>
              <table>
                <thead><tr><th>Cliente</th><th>Entradas</th><th>Despesas</th><th>Lucro</th><th>Margem</th></tr></thead>
                <tbody>
                  {porCliente.map((c) => (
                    <tr key={c.clienteId ?? 'geral'}>
                      <td>{c.clienteId ? <NomeCliente nome={c.clienteNome} /> : <span>{c.clienteNome}</span>}</td>
                      <td>{formatarReais(c.margens.receita)}</td>
                      <td>{formatarReais(c.margens.despesas)}</td>
                      <td>{formatarReais(c.margens.lucro)}</td>
                      <td>{pct(c.margens.margemLiquida)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>Só o que foi lançado com o cliente; custos sem cliente (escritório, ferramentas…) ficam na linha &quot;custos gerais&quot;.</p>
          </section>
        )}

        <section>
          <nav aria-label="Filtro de lançamentos">
            {ABAS_FINANCEIRO.map((a) => (
              <Link key={a} href={href(mes, a)}>{ROTULO_ABA_FINANCEIRO[a]}</Link>
            ))}
          </nav>
          {linhas.length === 0 ? (
            <p>Nenhum lançamento aqui. Use &quot;Novo lançamento&quot; para registrar entradas, equipe, tráfego e outras despesas.</p>
          ) : (
            <div>
              <table>
                <thead>
                  <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Cliente</th><th>Situação</th><th>Valor</th><th /></tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.id}>
                      <td>{dia(l.data)}</td>
                      <td>{l.descricao || '—'}</td>
                      <td>{l.categoria}</td>
                      <td>{l.clienteNome ? <NomeCliente nome={l.clienteNome} /> : '—'}</td>
                      <td><span>{l.pago ? (l.tipo === 'entrada' ? 'Recebido' : 'Pago') : l.tipo === 'entrada' ? 'A receber' : 'A pagar'}</span></td>
                      <td>{l.tipo === 'entrada' ? '+' : '−'} {formatarReais(l.centavos)}</td>
                      <td><AcoesLancamento lancamento={l} clientes={opcoesClientes} hoje={hoje} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
