import { LayoutDashboard, Link2, Radar, Target, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { Modulo } from '@/componentes/Modulo'
import { lerAbaBiolytics, modulosAtivos, type AbaBiolytics } from '@/dominio/biolytics'
import { dataDeHoje } from '@/dominio/filtros'
import { consultaPeriodo, lerPeriodo } from '@/dominio/periodo-anuncios'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { resumoDaBio, resumoDaBioDeVarios } from '@/servicos/bio'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { linkBioDoCliente } from '@/servicos/performance'
import { ConfigurarBio, ConfigurarQuiz } from './Configuracao'
import { GeralCliente, hrefBiolytics, RelatorioBio, RelatorioQuiz, Vazio, VisaoTodos } from './relatorios'

const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

const ABAS: [AbaBiolytics, string, LucideIcon][] = [
  ['geral', 'Visão geral', LayoutDashboard],
  ['bio', 'Link da bio', Link2],
  ['quiz', 'Quiz do WhatsApp', Target],
]

/**
 * Biolytics: captação e medição de cada cliente num lugar só. Sem cliente, compara todos; com um cliente, mostra os módulos
 * dele (link da bio e quiz hoje) com métricas, insights e a configuração de cada um.
 */
export default async function Biolytics({ searchParams }: PageProps<'/biolytics'>) {
  await exigirEquipe()
  const sp = await searchParams
  const hoje = dataDeHoje(new Date())
  const periodo = lerPeriodo(sp, hoje)
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
  const escolhido = clientes.find((c) => c.id === texto(sp.cliente)) ?? null
  const q = consultaPeriodo(periodo)

  if (!escolhido) {
    const { data: paginas } = await sb.from('clients').select('id, bio_slug').in('id', clientes.map((c) => c.id)).not('bio_slug', 'is', null)
    const comPagina = new Set((paginas ?? []).map((p) => p.id))
    const resumos = await resumoDaBioDeVarios(sb, clientes.filter((c) => comPagina.has(c.id)).map((c) => ({ id: c.id, temWhatsapp: !!c.whatsappAtendimento })), periodo.de, periodo.ate)
    return (
      <Casca periodo={periodo} hoje={hoje} q={q} clientes={clientes} escolhido={null} aba="geral" base="/biolytics?aba=geral">
        <VisaoTodos linhas={clientes.map((c) => ({ c, r: comPagina.has(c.id) ? (resumos.get(c.id) ?? null) : null }))} periodo={periodo} />
      </Casca>
    )
  }

  const bio = await linkBioDoCliente(sb, escolhido.id)
  const ativos = modulosAtivos(!!bio?.slug)
  const aba = lerAbaBiolytics(texto(sp.aba), ativos)
  const r = bio?.slug ? await resumoDaBio(sb, escolhido.id, periodo.de, periodo.ate, !!escolhido.whatsappAtendimento) : null
  const abas = ABAS.filter(([a]) => a !== 'quiz' || ativos.includes('quiz'))
  return (
    <Casca periodo={periodo} hoje={hoje} q={q} clientes={clientes} escolhido={escolhido} aba={aba} base={`/biolytics?aba=${aba}&cliente=${escolhido.id}`} abas={abas.map(([a, rotulo, Icone]) => ({ a, rotulo, Icone, href: hrefBiolytics(a, escolhido, periodo) }))}>
      {aba === 'geral' ? <GeralCliente c={escolhido} periodo={periodo} r={r} ativos={ativos} />
        : aba === 'bio' ? (
          <>
            {r ? <RelatorioBio c={escolhido} periodo={periodo} r={r} /> : <Vazio>A <strong>{escolhido.nome}</strong> ainda não tem a página da bio. Crie abaixo.</Vazio>}
            <ConfigurarBio c={escolhido} r={r} />
          </>
        ) : r ? (
          <>
            <RelatorioQuiz c={escolhido} periodo={periodo} r={r} />
            <ConfigurarQuiz c={escolhido} />
          </>
        ) : null}
    </Casca>
  )
}

type Aba = { a: AbaBiolytics; rotulo: string; Icone: LucideIcon; href: string }

function Casca({ children, periodo, hoje, q, clientes, escolhido, aba, base, abas }: {
  children: React.ReactNode
  periodo: ReturnType<typeof lerPeriodo>
  hoje: string
  q: string
  clientes: { id: string; nome: string }[]
  escolhido: { id: string } | null
  aba: AbaBiolytics
  base: string
  abas?: Aba[]
}) {
  return (
    <div className="page-shell relatorio">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Captação e medição por cliente</p>
          <h1 className="page-title mt-1">Biolytics</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorCliente base={`/biolytics?aba=${escolhido ? aba : 'geral'}`} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={q} />
          <SeletorPeriodo base={base} periodo={periodo} hoje={hoje} />
        </div>
      </div>
      {abas && (
        <nav className="flex flex-wrap gap-1 border-b border-borda" aria-label="Módulos do Biolytics">
          {abas.map(({ a, rotulo, Icone, href }) => (
            <Link key={a} href={href} className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-rotulo font-semibold ${aba === a ? 'border-petroleo text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}>
              <Icone className="h-4 w-4" /> {rotulo}
            </Link>
          ))}
        </nav>
      )}
      <Suspense fallback={<Modulo icone={Radar} titulo="Biolytics" descricao="Buscando os números…"><p className="py-8 text-center text-rotulo text-texto-3">Carregando…</p></Modulo>}>{children}</Suspense>
    </div>
  )
}
