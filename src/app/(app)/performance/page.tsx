import { BadgeDollarSign, CalendarRange, Camera, Download, LayoutDashboard, Link2, MapPin, Megaphone, Search, Send, Target, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { EnviarRelatorio } from '@/componentes/relatorios/EnviarRelatorio'
import { dataDeHoje } from '@/dominio/filtros'
import { consultaPeriodo, lerPeriodo } from '@/dominio/periodo-anuncios'
import { lerMes } from '@/dominio/performance'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { botaoSecundario } from '@/lib/ui'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { Aviso, BioCliente, BioTodos, GmnCliente, GmnTodos, GoogleCliente, GoogleTodos, MetaCliente, MetaTodos, OrganicoCliente, OrganicoTodos, PanoramaCliente, type Aba } from './canais'
import { EvolucaoCliente, LancamentosCliente, PanoramaMensal, ResultadoDoMes, SeletorMes } from './mensal'

export const maxDuration = 120

const ABAS: [Aba, string, LucideIcon, boolean][] = [
  ['resumo', 'Resumo', LayoutDashboard, false],
  ['evolucao', 'Evolução', CalendarRange, true],
  ['meta', 'Meta Ads', Megaphone, false],
  ['google', 'Google Ads', Search, false],
  ['organico', 'Orgânico', Camera, false],
  ['gmn', 'Google Meu Negócio', MapPin, false],
  ['bio', 'Link da bio', Link2, false],
  ['lancamentos', 'Lançamentos', BadgeDollarSign, true],
]

const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/**
 * Performance: resultados e análise por canal num lugar só. Sem cliente, compara os clientes (mês a mês ou por canal);
 * com um cliente, tem o panorama, a evolução mensal, cada canal, os lançamentos da equipe e o envio/exportação.
 */
export default async function Performance({ searchParams }: PageProps<'/performance'>) {
  await exigirEquipe()
  const sp = await searchParams
  const hoje = dataDeHoje(new Date())
  const periodo = lerPeriodo(sp, hoje)
  const mes = lerMes(texto(sp.mes) || undefined, hoje)
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
  const escolhido = clientes.find((c) => c.id === texto(sp.cliente)) ?? null
  const pedida = texto(sp.aba)
  const abasVisiveis = ABAS.filter(([, , , soCliente]) => escolhido || !soCliente)
  const aba: Aba = abasVisiveis.some(([a]) => a === pedida) ? (pedida as Aba) : 'resumo'

  // Meta Ads, Google Ads, Orgânico, GMN e Link da bio usam o período livre; Evolução e Lançamentos, o mês; o Resumo usa os dois.
  const doPeriodo = aba === 'meta' || aba === 'google' || aba === 'organico' || aba === 'gmn' || aba === 'bio' || (aba === 'resumo' && !!escolhido)
  const q = consultaPeriodo(periodo)
  const base = `/performance?aba=${aba}${escolhido ? `&cliente=${escolhido.id}` : ''}${aba === 'resumo' || aba === 'evolucao' || aba === 'lancamentos' ? `&mes=${mes}` : ''}`
  const link = (a: Aba) => `/performance?aba=${a}${escolhido ? `&cliente=${escolhido.id}` : ''}${q ? `&${q}` : ''}&mes=${mes}`
  const ocultos = { aba, ...(escolhido ? { cliente: escolhido.id } : {}), ...(sp.de ? { de: texto(sp.de) } : {}), ...(sp.ate ? { ate: texto(sp.ate) } : {}), ...(sp.dias ? { dias: texto(sp.dias) } : {}) }
  const seletorMes = <SeletorMes mes={mes} hoje={hoje} ocultos={ocultos} />
  const periodoXlsx = `de=${periodo.de}&ate=${periodo.ate}`

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Resultados e análise por canal</p>
          <h1 className="page-title mt-1">Performance</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorCliente base={`/performance?aba=${aba}`} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={q} />
          {doPeriodo && <SeletorPeriodo base={base} periodo={periodo} hoje={hoje} />}
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-borda" aria-label="Seções da Performance">
        {abasVisiveis.map(([a, rotulo, Icone]) => (
          <Link key={a} href={link(a)} className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-rotulo font-semibold ${aba === a ? 'border-petroleo text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}>
            <Icone className="h-3.5 w-3.5" /> {rotulo}
          </Link>
        ))}
      </nav>

      {escolhido ? (
        <Modulo icone={Send} titulo="Enviar e exportar" descricao={<><NomeCliente nome={escolhido.nome} /> · link e texto do WhatsApp para o cliente, PDF e planilha</>}>
          <div className="space-y-3">
            <EnviarRelatorio clienteId={escolhido.id} hoje={hoje} temWhatsapp={!!escolhido.whatsapp} />
            <div className="flex flex-wrap items-center gap-2 border-t border-borda pt-3">
              <a href={`/api/performance/exportar?cliente=${escolhido.id}&${periodoXlsx}`} className={botaoSecundario}><Download className="h-4 w-4" /> Baixar planilha (.xlsx) do período</a>
              <span className="text-legenda text-texto-3">A planilha segue o período escolhido no topo (padrão do Resumo e dos canais). Para PDF, gere o relatório acima e use o botão de PDF.</span>
            </div>
          </div>
        </Modulo>
      ) : aba === 'resumo' && (
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/api/performance/exportar?mes=${mes}`} className={botaoSecundario}><Download className="h-4 w-4" /> Baixar planilha (.xlsx) de todos os clientes no mês</a>
        </div>
      )}

      <Suspense key={`${aba}-${escolhido?.id}-${q}-${mes}`} fallback={<Modulo icone={Target} titulo="Performance" descricao="Buscando os números…"><p className="py-8 text-center text-rotulo text-texto-3">Carregando…</p></Modulo>}>
        {aba === 'resumo' ? (
          escolhido ? (
            <div className="space-y-4">
              <PanoramaCliente c={escolhido} periodo={periodo} />
              <ResultadoDoMes cliente={escolhido} mes={mes} hoje={hoje} acoes={seletorMes} />
            </div>
          ) : <PanoramaMensal clientes={clientes} mes={mes} hoje={hoje} acoes={seletorMes} />
        )
          : aba === 'evolucao' ? (escolhido ? <EvolucaoCliente cliente={escolhido} mes={mes} hoje={hoje} acoes={seletorMes} /> : <Aviso>Escolha um cliente para ver a evolução mês a mês.</Aviso>)
          : aba === 'lancamentos' ? (escolhido ? <LancamentosCliente cliente={escolhido} mes={mes} hoje={hoje} acoes={seletorMes} /> : <Aviso>Escolha um cliente para lançar o faturamento e configurar a página da bio.</Aviso>)
          : aba === 'meta' ? (escolhido ? <MetaCliente c={escolhido} periodo={periodo} /> : <MetaTodos clientes={clientes} periodo={periodo} />)
          : aba === 'google' ? (escolhido ? <GoogleCliente c={escolhido} periodo={periodo} /> : <GoogleTodos clientes={clientes} periodo={periodo} />)
          : aba === 'organico' ? (escolhido ? <OrganicoCliente c={escolhido} periodo={periodo} /> : <OrganicoTodos clientes={clientes} periodo={periodo} />)
          : aba === 'gmn' ? (escolhido ? <GmnCliente c={escolhido} periodo={periodo} /> : <GmnTodos clientes={clientes} />)
          : escolhido ? <BioCliente c={escolhido} periodo={periodo} /> : <BioTodos clientes={clientes} periodo={periodo} />}
      </Suspense>
    </div>
  )
}
