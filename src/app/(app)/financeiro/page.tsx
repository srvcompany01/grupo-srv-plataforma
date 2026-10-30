import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import Link from 'next/link'
import { AcoesLancamento } from '@/componentes/financeiro/AcoesLancamento'
import { LancamentoDialog } from '@/componentes/financeiro/LancamentoDialog'
import { ABAS_FINANCEIRO, ROTULO_ABA_FINANCEIRO, filtrarLancamentos, formatarReais, lerAbaFinanceiro, lerMes, limitesDoMes, mesVizinho, resumir, serieMensal } from '@/dominio/financeiro'
import { dataDeHoje } from '@/dominio/filtros'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { listarLancamentos } from '@/servicos/financeiro'
import { NomeCliente } from '@/componentes/NomeCliente'

const textoParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const nomeMes = (mes: string) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${mes}-01T00:00:00Z`))
const dia = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/')

function Cartao({ rotulo, valor, tom, detalhe }: { rotulo: string; valor: number; tom?: 'bom' | 'ruim'; detalhe?: string }) {
  return (
    <div className="rounded-lg border border-borda p-3">
      <p className="text-legenda font-medium text-texto-3">{rotulo}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${tom === 'bom' ? 'text-sucesso' : tom === 'ruim' ? 'text-perigo' : 'text-texto'}`}>{formatarReais(valor)}</p>
      {detalhe && <p className="mt-0.5 text-legenda text-texto-3">{detalhe}</p>}
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
  const serie = serieMensal(historico, mes)
  const maior = Math.max(1, ...serie.flatMap((m) => [m.entradas, m.despesas]))
  const maiorCategoria = Math.max(1, ...resumo.porCategoria.map((c) => c.centavos))
  const linhas = filtrarLancamentos(lancamentos, aba)
  const opcoesClientes = clientes.map((c) => ({ id: c.id, nome: c.nome }))
  const href = (m: string, a = aba) => `/financeiro?mes=${m}${a === 'todos' ? '' : `&aba=${a}`}`

  return (
    <div className="relatorio min-h-full">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borda px-4 py-3 md:px-5">
        <h1 className="flex items-center gap-2 text-destaque font-bold text-texto"><Wallet className="h-4 w-4" /> Financeiro</h1>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1" aria-label="Mês">
            <Link href={href(mesVizinho(mes, -1))} aria-label="Mês anterior" className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronLeft className="h-4 w-4" /></Link>
            <span className="min-w-32 text-center text-rotulo font-semibold capitalize text-texto">{nomeMes(mes)}</span>
            <Link href={href(mesVizinho(mes, 1))} aria-label="Próximo mês" className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></Link>
          </nav>
          <LancamentoDialog clientes={opcoesClientes} hoje={hoje} />
        </div>
      </header>

      <main className="space-y-4 p-4 md:p-5">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5" aria-label="Resumo do mês">
          <Cartao rotulo="Entradas" valor={resumo.entradas} tom="bom" detalhe={resumo.aReceber ? `+ ${formatarReais(resumo.aReceber)} a receber` : undefined} />
          <Cartao rotulo="Despesas" valor={resumo.despesas} tom="ruim" detalhe={resumo.aPagar ? `+ ${formatarReais(resumo.aPagar)} a pagar` : undefined} />
          <Cartao rotulo="Saldo do mês" valor={resumo.saldo} tom={resumo.saldo >= 0 ? 'bom' : 'ruim'} detalhe="só o que já foi pago" />
          <Cartao rotulo="Previsto" valor={resumo.previsto} tom={resumo.previsto >= 0 ? 'bom' : 'ruim'} detalhe="tudo o que está lançado" />
          <Cartao rotulo="A receber / pagar" valor={resumo.aReceber - resumo.aPagar} detalhe={`${formatarReais(resumo.aReceber)} / ${formatarReais(resumo.aPagar)}`} />
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-borda p-3">
            <h2 className="mb-2 text-rotulo font-semibold text-texto">Últimos 6 meses</h2>
            <div className="flex h-36 items-end gap-3">
              {serie.map((m) => (
                <Link key={m.mes} href={href(m.mes)} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1" title={`${nomeMes(m.mes)}: entradas ${formatarReais(m.entradas)}, despesas ${formatarReais(m.despesas)}`}>
                  <div className="flex flex-1 items-end justify-center gap-1">
                    <span className="w-3 rounded-t bg-sucesso" style={{ height: `${(m.entradas / maior) * 100}%` }} />
                    <span className="w-3 rounded-t bg-perigo" style={{ height: `${(m.despesas / maior) * 100}%` }} />
                  </div>
                  <span className={`truncate text-center text-micro capitalize ${m.mes === mes ? 'font-bold text-texto' : 'text-texto-3'}`}>{nomeMes(m.mes).split(' ')[0].slice(0, 3)}</span>
                </Link>
              ))}
            </div>
            <p className="mt-1 text-legenda text-texto-3"><span className="text-sucesso">■</span> entradas <span className="ml-2 text-perigo">■</span> despesas (pagas e pendentes)</p>
          </div>
          <div className="rounded-lg border border-borda p-3">
            <h2 className="mb-2 text-rotulo font-semibold text-texto">Por categoria</h2>
            {resumo.porCategoria.length === 0 ? (
              <p className="py-6 text-center text-rotulo text-texto-3">Nada lançado neste mês.</p>
            ) : (
              <ul className="space-y-1.5">
                {resumo.porCategoria.map((c) => (
                  <li key={`${c.tipo}-${c.categoria}`} className="text-rotulo">
                    <div className="flex justify-between"><span className="text-texto-2">{c.categoria}</span><span className="tabular-nums text-texto">{formatarReais(c.centavos)}</span></div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-fundo"><div className={`h-1.5 rounded-full ${c.tipo === 'entrada' ? 'bg-sucesso' : 'bg-perigo'}`} style={{ width: `${(c.centavos / maiorCategoria) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <nav className="mb-2 flex gap-0.5 border-b border-borda" aria-label="Filtro de lançamentos">
            {ABAS_FINANCEIRO.map((a) => (
              <Link key={a} href={href(mes, a)} className={`-mb-px border-b-2 px-2 py-1.5 text-rotulo font-semibold ${a === aba ? 'border-petroleo text-petroleo' : 'border-transparent text-texto-2 hover:text-texto'}`}>{ROTULO_ABA_FINANCEIRO[a]}</Link>
            ))}
          </nav>
          {linhas.length === 0 ? (
            <p className="py-12 text-center text-corpo text-texto-3">Nenhum lançamento aqui. Use &quot;Novo lançamento&quot; para registrar entradas, equipe, tráfego e outras despesas.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-borda">
              <table className="w-full min-w-[720px] text-left text-rotulo">
                <thead className="bg-fundo/70 text-legenda font-medium text-texto-3">
                  <tr><th className="px-3 py-2">Data</th><th className="px-3 py-2">Descrição</th><th className="px-3 py-2">Categoria</th><th className="px-3 py-2">Cliente</th><th className="px-3 py-2">Situação</th><th className="px-3 py-2 text-right">Valor</th><th className="w-24 px-3 py-2" /></tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {linhas.map((l) => (
                    <tr key={l.id} className="hover:bg-hover/50">
                      <td className="px-3 py-2 tabular-nums text-texto-2">{dia(l.data)}</td>
                      <td className="max-w-64 truncate px-3 py-2 text-texto">{l.descricao || '—'}</td>
                      <td className="px-3 py-2 text-texto-2">{l.categoria}</td>
                      <td className="px-3 py-2 text-texto-2">{l.clienteNome ? <NomeCliente nome={l.clienteNome} /> : '—'}</td>
                      <td className="px-3 py-2"><span className={`rounded-md px-2 py-0.5 text-legenda font-medium ${l.pago ? 'bg-sucesso/10 text-sucesso' : 'bg-aviso-fundo text-aviso-forte'}`}>{l.pago ? (l.tipo === 'entrada' ? 'Recebido' : 'Pago') : l.tipo === 'entrada' ? 'A receber' : 'A pagar'}</span></td>
                      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${l.tipo === 'entrada' ? 'text-sucesso' : 'text-perigo'}`}>{l.tipo === 'entrada' ? '+' : '−'} {formatarReais(l.centavos)}</td>
                      <td className="px-3 py-2"><AcoesLancamento lancamento={l} clientes={opcoesClientes} hoje={hoje} /></td>
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
