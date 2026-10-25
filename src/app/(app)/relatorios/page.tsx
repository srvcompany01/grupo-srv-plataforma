import { BadgeDollarSign, Camera, Eye, Heart, MapPin, Megaphone, MessageCircle, MousePointerClick, Radar, Search, Send, Star, Target, Users, Wallet } from 'lucide-react'
import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { GaleriaAnuncios } from '@/componentes/anuncios/GaleriaAnuncios'
import { GoogleAds } from '@/componentes/anuncios/GoogleAds'
import { GoogleNegocio } from '@/componentes/anuncios/GoogleNegocio'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { MapaGrade } from '@/componentes/gmn/MapaGrade'
import { CartaoLugar, ItensSaude, Placar, tomNota } from '@/componentes/gmn/PerfilGmn'
import { BlocoAnalise, Numeros } from '@/componentes/insights/BlocoAnalise'
import { EmBreve } from '@/componentes/insights/EmBreve'
import { GraficoDiario } from '@/componentes/insights/GraficoDiario'
import { InstagramInsights } from '@/componentes/insights/InstagramInsights'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { SeloTom } from '@/componentes/insights/tom'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { EnviarRelatorio } from '@/componentes/relatorios/EnviarRelatorio'
import { analisarSaude } from '@/dominio/gmn'
import { avisosGoogle, totaisCampanhas } from '@/dominio/google'
import { dataDeHoje } from '@/dominio/filtros'
import { totalLeads } from '@/dominio/performance'
import { analisarOrganico, analisarPago, engajamento, engajamentoOrganico, tomCtrMeta } from '@/dominio/insights'
import { consultaPeriodo, diasDoPeriodo, lerPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { campanhasGoogle, pagoPorDiaGoogle, situacaoGoogle } from '@/servicos/google-agencia'
import { instagramDoCliente } from '@/servicos/insights-instagram'
import { pagoPorDiaMeta, totaisDoPeriodoMeta } from '@/servicos/meta-anuncios'
import * as places from '@/servicos/places'
import { dadosDoCliente } from '@/servicos/relatorio-cliente'

export const maxDuration = 120

const ABAS = [
  ['meta', 'Meta Ads', Megaphone],
  ['google', 'Google Ads', Search],
  ['organico', 'Orgânico', Camera],
  ['gmn', 'Google Meu Negócio', MapPin],
] as const
type Aba = (typeof ABAS)[number][0]

const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const reaisCurto = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const n = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const compacto = (v: number) => v.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (v: number) => `${n(v)}%`
const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/** Relatórios: Meta Ads, Google Ads, orgânico e Google Meu Negócio, de todos os clientes ou de um só, no período. */
export default async function Relatorios({ searchParams }: PageProps<'/relatorios'>) {
  await exigirEquipe()
  const sp = await searchParams
  const hoje = dataDeHoje(new Date())
  const periodo = lerPeriodo(sp, hoje)
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
  const escolhido = clientes.find((c) => c.id === texto(sp.cliente)) ?? null
  const aba: Aba = (ABAS.map((a) => a[0]) as string[]).includes(texto(sp.aba)) ? (texto(sp.aba) as Aba) : 'meta'
  const q = consultaPeriodo(periodo)
  const link = (a: Aba) => `/relatorios?aba=${a}${escolhido ? `&cliente=${escolhido.id}` : ''}${q ? `&${q}` : ''}`
  const seletor = <SeletorPeriodo base={`/relatorios?aba=${aba}${escolhido ? `&cliente=${escolhido.id}` : ''}`} periodo={periodo} hoje={hoje} />

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Análise por canal</p>
          <h1 className="page-title mt-1">Relatórios</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorCliente base={`/relatorios?aba=${aba}`} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={q} />
          {seletor}
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-borda" aria-label="Canais">
        {ABAS.map(([a, rotulo, Icone]) => (
          <Link key={a} href={link(a)} className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-rotulo font-semibold ${aba === a ? 'border-petroleo text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}>
            <Icone className="h-3.5 w-3.5" /> {rotulo}
          </Link>
        ))}
      </nav>

      {escolhido && (
        <Modulo icone={Send} titulo="Enviar ao cliente" descricao={<><NomeCliente nome={escolhido.nome} /> · gera o link com os 4 canais e o texto pronto do WhatsApp</>}>
          <EnviarRelatorio clienteId={escolhido.id} hoje={hoje} temWhatsapp={!!escolhido.whatsapp} />
        </Modulo>
      )}

      <Suspense key={`${aba}-${escolhido?.id}-${q}`} fallback={<Modulo icone={Target} titulo="Relatório" descricao="Buscando os números…"><p className="py-8 text-center text-rotulo text-texto-3">Carregando…</p></Modulo>}>
        {aba === 'meta' ? (escolhido ? <MetaCliente c={escolhido} periodo={periodo} /> : <MetaTodos clientes={clientes} periodo={periodo} />)
          : aba === 'google' ? (escolhido ? <GoogleCliente c={escolhido} periodo={periodo} /> : <GoogleTodos clientes={clientes} periodo={periodo} />)
          : aba === 'organico' ? (escolhido ? <OrganicoCliente c={escolhido} periodo={periodo} /> : <OrganicoTodos clientes={clientes} periodo={periodo} />)
          : escolhido ? <GmnCliente c={escolhido} periodo={periodo} /> : <GmnTodos clientes={clientes} />}
      </Suspense>
    </div>
  )
}

const Aviso = ({ children }: { children: ReactNode }) => <p className="rounded-xl border border-dashed border-borda py-8 text-center text-rotulo text-texto-3">{children}</p>
const Erro = ({ texto: t }: { texto: string }) => <p className="rounded-xl border border-perigo-borda bg-perigo-fundo/40 px-3 py-2 text-rotulo text-perigo-forte">{t}</p>

/** Tabela comparando os clientes no canal. */
function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: { c: Cliente; href: string; celulas: ReactNode[] }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-rotulo">
        <thead>
          <tr className="border-b border-borda text-left text-legenda text-texto-3">
            <th className="py-2 pr-3 font-medium">Cliente</th>
            {cabecalho.map((h) => <th key={h} className="py-2 pr-3 text-right font-medium last:pr-0">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.c.id} className="border-b border-borda/60 last:border-0">
              <td className="py-2 pr-3"><NomeCliente nome={l.c.nome} href={l.href} /></td>
              {l.celulas.map((x, i) => <td key={i} className="py-2 pr-3 text-right tabular-nums last:pr-0">{x}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const hrefCliente = (aba: Aba, c: Cliente, periodo: PeriodoAnuncios) => `/relatorios?aba=${aba}&cliente=${c.id}${consultaPeriodo(periodo) ? `&${consultaPeriodo(periodo)}` : ''}`

// ───────────────────────────── Meta Ads ─────────────────────────────

async function MetaTodos({ clientes, periodo }: { clientes: Cliente[]; periodo: PeriodoAnuncios }) {
  const comConta = clientes.filter((c) => c.metaContaId)
  const linhas = (await Promise.all(comConta.map(async (c) => ({ c, t: await totaisDoPeriodoMeta(c.metaContaId!, periodo) })))).sort((a, b) => ('erro' in b.t ? -1 : b.t.gasto) - ('erro' in a.t ? -1 : a.t.gasto))
  const ok = linhas.flatMap((l) => ('erro' in l.t ? [] : [l.t]))
  const gasto = ok.reduce((s, t) => s + t.gasto, 0)
  const leads = ok.reduce((s, t) => s + totalLeads(t), 0)
  return (
    <Modulo icone={Megaphone} titulo="Meta Ads · todos os clientes" descricao={rotuloPeriodo(periodo)}>
      <div className="space-y-4">
        <Numeros itens={[
          { rotulo: 'Investido', valor: reais(gasto), icone: Wallet, cor: '#0866ff' },
          { rotulo: 'Leads', valor: n(leads), extra: 'conversas + cadastros', icone: Users, cor: '#1baf7a' },
          { rotulo: 'Custo por lead', valor: leads ? reais(gasto / leads) : '—', icone: Target, cor: '#eb6834' },
          { rotulo: 'Clientes com Meta', valor: String(comConta.length), icone: Megaphone, cor: '#6250d6' },
        ]} />
        {linhas.length === 0 ? <Aviso>Nenhum cliente com conta de anúncios da Meta no cadastro.</Aviso> : (
          <Tabela cabecalho={['Investido', 'Leads', 'Custo por lead', 'Cliques', 'CTR']} linhas={linhas.map(({ c, t }) => ({
            c, href: hrefCliente('meta', c, periodo),
            celulas: 'erro' in t ? [<span key="e" className="text-perigo" title={t.erro}>erro</span>, '', '', '', ''] : [
              reais(t.gasto), n(totalLeads(t)), totalLeads(t) ? reais(t.gasto / totalLeads(t)) : '—', compacto(t.cliques),
              t.impressoes ? <span key="c" className="inline-flex items-center gap-1">{pct((t.cliques / t.impressoes) * 100)} <SeloTom tom={tomCtrMeta((t.cliques / t.impressoes) * 100)} /></span> : '—',
            ],
          }))} />
        )}
      </div>
    </Modulo>
  )
}

async function MetaCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  if (!c.metaContaId) return <Aviso>A <strong>{c.nome}</strong> não tem conta de anúncios da Meta no cadastro.</Aviso>
  const [d, t, porDia] = await Promise.all([dadosDoCliente(c, periodo, false, { organico: false }), totaisDoPeriodoMeta(c.metaContaId, periodo), pagoPorDiaMeta(c.metaContaId, periodo)])
  const dias = diasDoPeriodo(periodo)
  const m = d.pago.meta
  const tot = 'erro' in t ? null : t
  const leads = tot ? totalLeads(tot) : 0
  const diaMap = new Map(('erro' in porDia ? [] : porDia).map((x) => [x.dia, x.gasto]))
  const seletor = <SeletorPeriodo base={`/relatorios?aba=meta&cliente=${c.id}`} periodo={periodo} hoje={dataDeHoje(new Date())} />
  return (
    <>
      <Modulo icone={Megaphone} titulo="Meta Ads" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · Facebook e Instagram · {rotuloPeriodo(periodo)}</>}>
        <div className="space-y-4">
          {'erro' in t && <Erro texto={t.erro} />}
          <Numeros itens={[
            { rotulo: 'Investido', valor: reais(tot?.gasto ?? m?.gasto ?? 0), icone: Wallet, cor: '#0866ff' },
            { rotulo: 'Leads', valor: n(leads), extra: tot ? [tot.conversas ? `${n(tot.conversas)} conversas` : '', tot.formularios ? `${n(tot.formularios)} cadastros` : '', tot.site ? `${n(tot.site)} do site` : ''].filter(Boolean).join(' · ') || undefined : undefined, icone: Users, cor: '#1baf7a' },
            { rotulo: 'Custo por lead', valor: leads && tot ? reais(tot.gasto / leads) : '—', icone: Target, cor: '#eb6834' },
            { rotulo: 'Impressões', valor: compacto(m?.impressoes ?? tot?.impressoes ?? 0), extra: m?.alcance ? `${compacto(m.alcance)} pessoas` : undefined, icone: Eye, cor: '#6250d6' },
            { rotulo: 'Cliques', valor: compacto(m?.cliques ?? tot?.cliques ?? 0), icone: MousePointerClick, cor: '#e87ba4' },
            { rotulo: 'CTR', valor: m ? pct(m.ctr) : '—', tom: m ? tomCtrMeta(m.ctr) : undefined, icone: Target, cor: '#eda100' },
          ]} />
          <GraficoDiario titulo="Investimento por dia" dias={dias} series={[{ nome: 'Investido', valores: dias.map((x) => diaMap.get(x) ?? 0) }]} formato={reaisCurto} tipo="barras" />
          <BlocoAnalise analise={analisarPago({ meta: m, google: null })} />
        </div>
      </Modulo>
      <GaleriaAnuncios contaId={c.metaContaId} periodo={periodo} mostrarGasto seletor={seletor} />
    </>
  )
}

// ───────────────────────────── Google Ads ─────────────────────────────

async function GoogleTodos({ clientes, periodo }: { clientes: Cliente[]; periodo: PeriodoAnuncios }) {
  const g = await situacaoGoogle()
  if (!g.conectado) return <Aviso>A conta Google da agência não está conectada (aba Anúncios).</Aviso>
  const comConta = clientes.filter((c) => c.googleAdsId)
  const linhas = await Promise.all(comConta.map(async (c) => ({ c, r: await campanhasGoogle(c.googleAdsId!, periodo) })))
  const ok = linhas.flatMap((l) => ('erro' in l.r ? [] : [totaisCampanhas(l.r.campanhas)]))
  const custo = ok.reduce((s, t) => s + t.custo, 0)
  const conv = ok.reduce((s, t) => s + t.conversoes, 0)
  return (
    <Modulo icone={Search} titulo="Google Ads · todos os clientes" descricao={rotuloPeriodo(periodo)}>
      <div className="space-y-4">
        <Numeros itens={[
          { rotulo: 'Investido', valor: reais(custo), icone: Wallet, cor: '#eb6834' },
          { rotulo: 'Conversões', valor: n(conv), icone: Target, cor: '#1baf7a' },
          { rotulo: 'Custo por conversão', valor: conv ? reais(custo / conv) : '—', icone: BadgeDollarSign, cor: '#6250d6' },
          { rotulo: 'Clientes com Google Ads', valor: String(comConta.length), icone: Search, cor: '#2a78d6' },
        ]} />
        {linhas.length === 0 ? <Aviso>Nenhum cliente com conta do Google Ads no cadastro.</Aviso> : (
          <Tabela cabecalho={['Investido', 'Cliques', 'CTR', 'Conversões', 'Custo por conversão']} linhas={linhas.map(({ c, r }) => {
            if ('erro' in r) return { c, href: hrefCliente('google', c, periodo), celulas: [<span key="e" className="text-perigo" title={r.erro}>erro</span>, '', '', '', ''] }
            const t = totaisCampanhas(r.campanhas)
            return { c, href: hrefCliente('google', c, periodo), celulas: [reais(t.custo), compacto(t.cliques), t.impressoes ? pct((t.cliques / t.impressoes) * 100) : '—', <span key="v" className={t.conversoes > 0 ? 'font-semibold text-sucesso-forte' : t.custo > 0 ? 'font-semibold text-perigo-forte' : ''}>{n(t.conversoes)}</span>, t.conversoes ? reais(t.custo / t.conversoes) : '—'] }
          })} />
        )}
      </div>
    </Modulo>
  )
}

async function GoogleCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  if (!c.googleAdsId) return <Aviso>A <strong>{c.nome}</strong> não tem conta do Google Ads no cadastro.</Aviso>
  const g = await situacaoGoogle()
  if (!g.conectado) return <Aviso>A conta Google da agência não está conectada (aba Anúncios).</Aviso>
  const [d, porDia, r] = await Promise.all([dadosDoCliente(c, periodo, true, { organico: false }), pagoPorDiaGoogle(c.googleAdsId, periodo), campanhasGoogle(c.googleAdsId, periodo)])
  const dias = diasDoPeriodo(periodo)
  const diaMap = new Map(('erro' in porDia ? [] : porDia).map((x) => [x.dia, x.gasto]))
  const avisos = 'erro' in r ? [] : avisosGoogle(totaisCampanhas(r.campanhas))
  const seletor = <SeletorPeriodo base={`/relatorios?aba=google&cliente=${c.id}`} periodo={periodo} hoje={dataDeHoje(new Date())} />
  return (
    <>
      <Modulo icone={Search} titulo="Análise do Google Ads" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)}</>}>
        <div className="space-y-4">
          {avisos.map((a) => <p key={a} className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">{a}</p>)}
          <GraficoDiario titulo="Investimento por dia" dias={dias} series={[{ nome: 'Investido', valores: dias.map((x) => diaMap.get(x) ?? 0) }]} formato={reaisCurto} tipo="barras" />
          <BlocoAnalise analise={analisarPago({ meta: null, google: d.pago.google })} />
        </div>
      </Modulo>
      <GoogleAds contaId={c.googleAdsId} periodo={periodo} seletor={seletor} />
    </>
  )
}

// ───────────────────────────── Orgânico ─────────────────────────────

const OUTRAS_REDES = ['TikTok', 'YouTube', 'Facebook (Página)', 'LinkedIn']

async function OrganicoTodos({ clientes, periodo }: { clientes: Cliente[]; periodo: PeriodoAnuncios }) {
  const comPagina = clientes.filter((c) => c.metaPaginaId)
  const linhas = (await Promise.all(comPagina.map(async (c) => ({ c, ig: await instagramDoCliente(c.metaPaginaId!, periodo, false) })))).sort((a, b) => ('erro' in b.ig ? -1 : b.ig.alcance) - ('erro' in a.ig ? -1 : a.ig.alcance))
  return (
    <>
      <Modulo icone={Camera} titulo="Instagram · todos os clientes" descricao={`${rotuloPeriodo(periodo)} · alcance e interações da conta somam orgânico e anúncios`}>
        {linhas.length === 0 ? <Aviso>Nenhum cliente com a Página do Facebook (Instagram) no cadastro.</Aviso> : (
          <Tabela cabecalho={['Seguidores', 'Novos', 'Alcance', 'Interações', 'Posts']} linhas={linhas.map(({ c, ig }) => ({
            c, href: hrefCliente('organico', c, periodo),
            celulas: 'erro' in ig ? [<span key="e" className="text-perigo" title={ig.erro}>erro</span>, '', '', '', ''] : [
              compacto(ig.seguidores), <span key="n" className={ig.novosSeguidores > 0 ? 'font-semibold text-sucesso-forte' : ig.novosSeguidores < 0 ? 'font-semibold text-perigo-forte' : ''}>{ig.novosSeguidores > 0 ? '+' : ''}{n(ig.novosSeguidores)}</span>, compacto(ig.alcance), compacto(ig.interacoes), String(ig.posts.length),
            ],
          }))} />
        )}
      </Modulo>
      <EmBreve itens={OUTRAS_REDES} />
    </>
  )
}

async function OrganicoCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  if (!c.metaPaginaId) return <><Aviso>A <strong>{c.nome}</strong> não tem a Página do Facebook (Instagram) no cadastro.</Aviso><EmBreve itens={OUTRAS_REDES} /></>
  const ig = await instagramDoCliente(c.metaPaginaId, periodo, true)
  const dias = diasDoPeriodo(periodo)
  return (
    <>
      <Modulo icone={Camera} titulo={'erro' in ig ? 'Instagram' : `Instagram @${ig.usuario}`} descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)}</>}>
        {'erro' in ig ? <Erro texto={ig.erro} /> : (
          <div className="space-y-4">
            <InstagramInsights ig={ig} dias={dias} />
            <p className="text-legenda text-texto-3">Engajamento nos posts: {engajamentoOrganico(ig) === null ? '—' : pct(engajamentoOrganico(ig)!)} · interações sobre o alcance da conta (inclui anúncios): {pct(engajamento(ig.interacoes, ig.alcance))}.</p>
          </div>
        )}
      </Modulo>
      {!('erro' in ig) && (
        <Modulo icone={Heart} titulo="Insights e recomendações do orgânico" descricao="O que os números mostram e o que fazer">
          <BlocoAnalise analise={analisarOrganico(ig, dias.length)} />
        </Modulo>
      )}
      <EmBreve itens={OUTRAS_REDES} />
    </>
  )
}

// ───────────────────────────── Google Meu Negócio ─────────────────────────────

async function GmnTodos({ clientes }: { clientes: Cliente[] }) {
  if (!places.placesConfigurado()) return <Aviso>Falta a chave da Places API (GOOGLE_PLACES_API_KEY).</Aviso>
  const sb = await criarClienteServidor()
  const hoje = dataDeHoje(new Date())
  const ligados = clientes.filter((c) => c.googlePlaceId)
  const linhas = await Promise.all(ligados.map(async (c) => {
    try {
      const [d, ultima] = await Promise.all([places.detalhesDoLugar(sb, c.googlePlaceId!), places.varreduras(sb, c.id, 1).then((v) => v[0])])
      return { c, d, saude: analisarSaude(d.perfil, hoje).nota, ultima }
    } catch (e) {
      return { c, erro: e instanceof Error ? e.message : 'erro' }
    }
  }))
  return (
    <Modulo icone={MapPin} titulo="Google Meu Negócio · todos os clientes" descricao="Nota, avaliações, saúde do perfil e a última varredura do geogrid">
      {linhas.length === 0 ? <Aviso>Nenhum cliente com o perfil do Google ligado. Ligue na aba GMN.</Aviso> : (
        <Tabela cabecalho={['Nota', 'Avaliações', 'Saúde', 'Top 3 no Maps']} linhas={linhas.map((l) => ({
          c: l.c, href: `/relatorios?aba=gmn&cliente=${l.c.id}`,
          celulas: 'erro' in l ? [<span key="e" className="text-perigo" title={l.erro}>erro</span>, '', '', ''] : [
            l.d.nota === null ? '—' : `★ ${n(l.d.nota)}`, n(l.d.avaliacoes), <SeloTom key="s" tom={tomNota(l.saude)} rotulo={`${l.saude}/100`} />, l.ultima ? `${n(l.ultima.metricas.top3)}% ("${l.ultima.palavra}")` : '—',
          ],
        }))} />
      )}
    </Modulo>
  )
}

async function GmnCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  const seletor = <SeletorPeriodo base={`/relatorios?aba=gmn&cliente=${c.id}`} periodo={periodo} hoje={dataDeHoje(new Date())} />
  const metricas = (
    <Suspense fallback={null}>
      <GoogleNegocio clienteId={c.id} perfil={c.googlePerfil} perfilNome={c.googlePerfilNome} periodo={periodo} seletor={seletor} podeGerir={false} />
    </Suspense>
  )
  if (!c.googlePlaceId) return <><Aviso>Ligue o perfil do Google da <strong>{c.nome}</strong> na aba <Link href={`/gmn?cliente=${c.id}`} className="font-semibold text-[#1d6fe0] hover:underline">GMN</Link> para ver a saúde e o geogrid.</Aviso>{metricas}</>
  const sb = await criarClienteServidor()
  let s
  try {
    s = await places.saudeDoCliente(sb, c.googlePlaceId, dataDeHoje(new Date()), c.id)
  } catch (e) {
    return <Erro texto={e instanceof Error ? e.message : 'Não foi possível falar com o Google.'} />
  }
  const ultima = (await places.varreduras(sb, c.id, 1))[0]
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Modulo icone={Star} titulo="Saúde do perfil no Google" descricao={<><NomeCliente nome={c.nome} href={`/gmn?cliente=${c.id}`} /> · dados públicos do Google</>}>
          <div className="space-y-4">
            <Placar nota={s.nota} itens={s.itens} />
            <ItensSaude itens={s.itens} />
          </div>
        </Modulo>
        <CartaoLugar d={s.detalhes} />
      </div>
      <Modulo icone={Radar} titulo="Posição no Google Maps" descricao={ultima ? `Última varredura: "${ultima.palavra}" · top 3 em ${n(ultima.metricas.top3)}% dos pontos · posição média ${n(ultima.metricas.posicaoMediaTotal)}º` : 'Sem varredura ainda'}>
        {ultima ? <div className="max-w-xl"><MapaGrade centro={ultima.centro} pontos={ultima.pontos} rotulo={`Mapa de posições para ${ultima.palavra}`} /></div> : <p className="text-rotulo text-texto-3">Rode um geogrid na aba <Link href={`/gmn?cliente=${c.id}&aba=geogrid`} className="font-semibold text-[#1d6fe0] hover:underline">GMN</Link>.</p>}
      </Modulo>
      <Modulo icone={MessageCircle} titulo="Avaliações em destaque" descricao="As que o Google mostra primeiro">
        {s.detalhes.avaliacoesRecentes.length === 0 ? <p className="text-rotulo text-texto-3">Sem avaliações visíveis.</p> : (
          <ul className="space-y-2">
            {s.detalhes.avaliacoesRecentes.map((a, i) => (
              <li key={i} className="rounded-lg border border-borda px-3 py-2 text-rotulo">
                <p className="flex items-center gap-2"><strong>{a.autor || 'Cliente'}</strong><span className="text-[#eda100]">{'★'.repeat(a.nota ?? 0)}</span><span className="text-legenda text-texto-3">{a.quando}</span></p>
                {a.texto && <p className="mt-0.5 line-clamp-3 text-texto-2">{a.texto}</p>}
              </li>
            ))}
          </ul>
        )}
      </Modulo>
      {metricas}
    </>
  )
}
