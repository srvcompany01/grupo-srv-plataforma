import { BadgeDollarSign, Camera, Heart, Link2, MapPin, Megaphone, MessageCircle, MousePointerClick, Radar, Search, Send, Star, Target, Users, Wallet } from 'lucide-react'
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
import { analisarBio, ROTULO_ORIGEM } from '@/dominio/bio'
import { analisarSaude } from '@/dominio/gmn'
import { avisosGoogle, totaisCampanhas } from '@/dominio/google'
import { dataDeHoje } from '@/dominio/filtros'
import { analisarOrganico, analisarPago, engajamentoOrganico, tomCtrMeta } from '@/dominio/insights'
import { consultaPeriodo, diasDoPeriodo, lerPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { campanhasGoogle, pagoPorDiaGoogle, situacaoGoogle } from '@/servicos/google-agencia'
import { instagramDoCliente } from '@/servicos/insights-instagram'
import { metaPorDiaPorTipo, resumoMetaPorTipo, seguidoresPagosNoPeriodo } from '@/servicos/meta-anuncios'
import * as places from '@/servicos/places'
import { resumoDaBio, resumoDaBioDeVarios } from '@/servicos/bio'
import { cliquesLinkBioNoPeriodo, linkBioDoCliente } from '@/servicos/performance'
import { dadosDoCliente } from '@/servicos/relatorio-cliente'

export const maxDuration = 120

const ABAS = [
  ['meta', 'Meta Ads', Megaphone],
  ['google', 'Google Ads', Search],
  ['organico', 'Orgânico', Camera],
  ['gmn', 'Google Meu Negócio', MapPin],
  ['bio', 'Link da bio', Link2],
] as const
type Aba = (typeof ABAS)[number][0]

const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const reaisCurto = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const n = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const compacto = (v: number) => v.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (v: number) => `${n(v)}%`
const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/** Relatórios: Meta Ads, Google Ads, orgânico, Google Meu Negócio e link da bio, de todos os clientes ou de um só, no período. */
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
          : aba === 'gmn' ? (escolhido ? <GmnCliente c={escolhido} periodo={periodo} /> : <GmnTodos clientes={clientes} />)
          : escolhido ? <BioCliente c={escolhido} periodo={periodo} /> : <BioTodos clientes={clientes} periodo={periodo} />}
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
  const linhas = (await Promise.all(comConta.map(async (c) => ({ c, t: await resumoMetaPorTipo(c.metaContaId!, periodo) })))).sort((a, b) => ('erro' in b.t ? -1 : b.t.total.gasto) - ('erro' in a.t ? -1 : a.t.total.gasto))
  const ok = linhas.flatMap((l) => ('erro' in l.t ? [] : [l.t]))
  const gasto = ok.reduce((s, t) => s + t.total.gasto, 0)
  const captacao = ok.reduce((s, t) => ({ gasto: s.gasto + t.captacao.gasto, leads: s.leads + t.captacao.leads }), { gasto: 0, leads: 0 })
  const reconhecimento = ok.reduce((s, t) => ({ gasto: s.gasto + t.reconhecimento.gasto, cliques: s.cliques + t.reconhecimento.cliquesLink }), { gasto: 0, cliques: 0 })
  return (
    <Modulo icone={Megaphone} titulo="Meta Ads · todos os clientes" descricao={rotuloPeriodo(periodo)}>
      <div className="space-y-4">
        <Numeros itens={[
          { rotulo: 'Investido', valor: reais(gasto), icone: Wallet, cor: '#0866ff' },
          { rotulo: 'Captação', valor: reais(captacao.gasto), extra: `${n(captacao.leads)} leads`, icone: Users, cor: '#1baf7a' },
          { rotulo: 'CPL de captação', valor: captacao.leads ? reais(captacao.gasto / captacao.leads) : '—', icone: Target, cor: '#eb6834' },
          { rotulo: 'Reconhecimento', valor: reais(reconhecimento.gasto), extra: `${compacto(reconhecimento.cliques)} cliques no link`, icone: MousePointerClick, cor: '#6250d6' },
          { rotulo: 'Clientes com Meta', valor: String(comConta.length), icone: Megaphone, cor: '#6250d6' },
        ]} />
        {linhas.length === 0 ? <Aviso>Nenhum cliente com conta de anúncios da Meta no cadastro.</Aviso> : (
          <Tabela cabecalho={['Captação', 'Leads', 'CPL', 'Reconhecimento', 'Cliques', 'CPC']} linhas={linhas.map(({ c, t }) => ({
            c, href: hrefCliente('meta', c, periodo),
            celulas: 'erro' in t ? [<span key="e" className="text-perigo" title={t.erro}>erro</span>, '', '', '', '', ''] : [
              reais(t.captacao.gasto), n(t.captacao.leads), t.captacao.custoPorLead === null ? '—' : reais(t.captacao.custoPorLead), reais(t.reconhecimento.gasto), compacto(t.reconhecimento.cliquesLink), t.reconhecimento.custoPorClique === null ? '—' : reais(t.reconhecimento.custoPorClique),
            ],
          }))} />
        )}
      </div>
    </Modulo>
  )
}

async function MetaCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  if (!c.metaContaId) return <Aviso>A <strong>{c.nome}</strong> não tem conta de anúncios da Meta no cadastro.</Aviso>
  const [d, t, porDia] = await Promise.all([dadosDoCliente(c, periodo, false, { organico: false }), resumoMetaPorTipo(c.metaContaId, periodo), metaPorDiaPorTipo(c.metaContaId, periodo)])
  const dias = diasDoPeriodo(periodo)
  const m = d.pago.meta
  const tot = 'erro' in t ? null : t
  const diaMap = 'erro' in porDia ? new Map() : porDia
  const seletor = <SeletorPeriodo base={`/relatorios?aba=meta&cliente=${c.id}`} periodo={periodo} hoje={dataDeHoje(new Date())} />
  return (
    <>
      <Modulo icone={Megaphone} titulo="Meta Ads" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · Facebook e Instagram · {rotuloPeriodo(periodo)}</>}>
        <div className="space-y-4">
          {'erro' in t && <Erro texto={t.erro} />}
          <Numeros itens={[
            { rotulo: 'Investido', valor: reais(tot?.total.gasto ?? m?.gasto ?? 0), icone: Wallet, cor: '#0866ff' },
            { rotulo: 'Captação', valor: reais(tot?.captacao.gasto ?? 0), extra: tot ? [tot.captacao.conversas ? `${n(tot.captacao.conversas)} conversas` : '', tot.captacao.formularios ? `${n(tot.captacao.formularios)} formulários` : '', tot.captacao.site ? `${n(tot.captacao.site)} do site` : ''].filter(Boolean).join(' · ') || `${n(tot.captacao.leads)} leads` : undefined, icone: Users, cor: '#1baf7a' },
            { rotulo: 'CPL de captação', valor: tot?.captacao.custoPorLead === null || !tot ? '—' : reais(tot.captacao.custoPorLead), icone: Target, cor: '#eb6834' },
            { rotulo: 'Reconhecimento', valor: reais(tot?.reconhecimento.gasto ?? 0), extra: tot ? `${compacto(tot.reconhecimento.visitasPerfil || tot.reconhecimento.cliquesLink)} ${tot.reconhecimento.visitasPerfil ? 'visitas ao perfil' : 'cliques no link'}` : undefined, icone: MousePointerClick, cor: '#6250d6' },
            tot?.reconhecimento.visitasPerfil
              ? { rotulo: 'Custo por visita ao perfil', valor: tot.reconhecimento.custoPorVisitaPerfil === null ? '—' : reais(tot.reconhecimento.custoPorVisitaPerfil), extra: `${compacto(tot.reconhecimento.visitasPerfil)} visitas`, icone: MousePointerClick, cor: '#e87ba4' }
              : { rotulo: 'CPC de reconhecimento', valor: tot?.reconhecimento.custoPorClique === null || !tot ? '—' : reais(tot.reconhecimento.custoPorClique), icone: MousePointerClick, cor: '#e87ba4' },
            ...(tot?.total.seguidoresAnuncio ? [{ rotulo: 'Seguidores pelos anúncios', valor: n(tot.total.seguidoresAnuncio), extra: [tot.reconhecimento.custoPorSeguidor === null ? '' : `${reais(tot.reconhecimento.custoPorSeguidor)} por seguidor (campanhas de perfil)`, tot.reconhecimento.seguidoresAnuncio ? `${n(tot.reconhecimento.seguidoresAnuncio)} em campanhas de perfil` : '', tot.captacao.seguidoresAnuncio ? `${n(tot.captacao.seguidoresAnuncio)} em campanhas de captação` : '', tot.reconhecimento.taxaSeguidor === null ? '' : `${pct(tot.reconhecimento.taxaSeguidor)} das visitas ao perfil`].filter(Boolean).join(' · ') || undefined, icone: Users, cor: '#6250d6' }] : []),
            { rotulo: 'CTR', valor: m ? pct(m.ctr) : '—', tom: m ? tomCtrMeta(m.ctr) : undefined, icone: Target, cor: '#eda100' },
          ]} />
          <GraficoDiario titulo="Investimento diário por tipo de campanha" dias={dias} series={[{ nome: 'Captação', valores: dias.map((x) => diaMap.get(x)?.captacao.gasto ?? 0) }, { nome: 'Reconhecimento', valores: dias.map((x) => diaMap.get(x)?.reconhecimento.gasto ?? 0) }]} formato={reaisCurto} />
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
  const sb = await criarClienteServidor()
  const linhas = (await Promise.all(comPagina.map(async (c) => ({ c, ig: await instagramDoCliente(c.metaPaginaId!, periodo, false), bio: await cliquesLinkBioNoPeriodo(sb, c.id, periodo.de, periodo.ate) })))).sort((a, b) => ('erro' in b.ig ? -1 : b.ig.posts.length) - ('erro' in a.ig ? -1 : a.ig.posts.length))
  return (
    <>
      <Modulo icone={Camera} titulo="Instagram · todos os clientes" descricao={`${rotuloPeriodo(periodo)} · somente publicações orgânicas`}>
        {linhas.length === 0 ? <Aviso>Nenhum cliente com a Página do Facebook (Instagram) no cadastro.</Aviso> : (
          <Tabela cabecalho={['Seguidores', 'Novos', 'Posts orgânicos', 'Cliques no link da bio']} linhas={linhas.map(({ c, ig, bio }) => ({
            c, href: hrefCliente('organico', c, periodo),
            celulas: 'erro' in ig ? [<span key="e" className="text-perigo" title={ig.erro}>erro</span>, '', '', ''] : [
              compacto(ig.seguidores), <span key="n" className={ig.novosSeguidores > 0 ? 'font-semibold text-sucesso-forte' : ig.novosSeguidores < 0 ? 'font-semibold text-perigo-forte' : ''}>{ig.novosSeguidores > 0 ? '+' : ''}{n(ig.novosSeguidores)}</span>, String(ig.posts.length), bio === null ? '—' : n(bio),
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
  const [ig, cliquesLinkBio, seguidoresPagos] = await Promise.all([instagramDoCliente(c.metaPaginaId, periodo, true), criarClienteServidor().then((sb) => cliquesLinkBioNoPeriodo(sb, c.id, periodo.de, periodo.ate)), seguidoresPagosNoPeriodo(c.metaContaId, periodo)])
  const dias = diasDoPeriodo(periodo)
  return (
    <>
      <Modulo icone={Camera} titulo={'erro' in ig ? 'Instagram' : `Instagram @${ig.usuario}`} descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)}</>}>
        {'erro' in ig ? <Erro texto={ig.erro} /> : (
          <div className="space-y-4">
            <InstagramInsights ig={ig} dias={dias} cliquesLinkBio={cliquesLinkBio} seguidoresPagos={seguidoresPagos} />
            <p className="text-legenda text-texto-3">Engajamento orgânico nos posts: {engajamentoOrganico(ig) === null ? '—' : pct(engajamentoOrganico(ig)!)}. Os totais da conta que incluem anúncios não entram nesta aba.</p>
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

// ───────────────────────────── Link da bio ─────────────────────────────

async function BioTodos({ clientes, periodo }: { clientes: Cliente[]; periodo: PeriodoAnuncios }) {
  const resumos = await resumoDaBioDeVarios(await criarClienteServidor(), clientes.map((c) => ({ id: c.id, temWhatsapp: !!c.whatsappAtendimento })), periodo.de, periodo.ate)
  const linhas = clientes.map((c) => ({ c, r: resumos.get(c.id)! })).filter(({ r }) => r.visitas > 0 || r.toques > 0).sort((a, b) => b.r.visitas - a.r.visitas)
  return (
    <Modulo icone={Link2} titulo="Link da bio · todos os clientes" descricao={`${rotuloPeriodo(periodo)} · visitas à página e toques em cada botão`}>
      {linhas.length === 0 ? <Aviso>Nenhuma visita nas páginas da bio neste período. Crie a página de cada cliente em Performance → Link da bio.</Aviso> : (
        <Tabela cabecalho={['Visitas', 'Toques nos botões', 'Toques por visita', 'Botão mais tocado']} linhas={linhas.map(({ c, r }) => ({
          c, href: hrefCliente('bio', c, periodo),
          celulas: [n(r.visitas), n(r.toques), r.visitas ? n(r.toques / r.visitas) : '—', r.toques ? `${r.botoes[0].rotulo} (${n(r.botoes[0].toques)})` : '—'],
        }))} />
      )}
    </Modulo>
  )
}

async function BioCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  const sb = await criarClienteServidor()
  const [bio, r] = await Promise.all([linkBioDoCliente(sb, c.id), resumoDaBio(sb, c.id, periodo.de, periodo.ate, !!c.whatsappAtendimento)])
  if (!bio?.slug) return <Aviso>A <strong>{c.nome}</strong> ainda não tem a página da bio. Crie em Performance → Link da bio.</Aviso>
  const dias = diasDoPeriodo(periodo)
  const porDia = new Map(r.porDia.map((d) => [d.dia, d]))
  const maior = Math.max(1, ...r.botoes.map((b) => b.toques))
  return (
    <>
      <Modulo icone={Link2} titulo="Link da bio" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)}</>}>
        <div className="space-y-4">
          <Numeros itens={[
            { rotulo: 'Visitas à página', valor: n(r.visitas), extra: 'pessoas que abriram o link da bio', icone: Link2, cor: '#1baf7a' },
            { rotulo: 'Toques nos botões', valor: n(r.toques), icone: MousePointerClick, cor: '#6250d6' },
            { rotulo: 'Toques por visita', valor: r.visitas ? n(r.toques / r.visitas) : '—', icone: Target, cor: '#eb6834' },
            { rotulo: 'Botão mais tocado', valor: r.toques ? r.botoes[0].rotulo : '—', extra: r.toques ? `${n(r.botoes[0].toques)} toques` : undefined, icone: Star, cor: '#eda100' },
          ]} />
          <GraficoDiario titulo="Visitas e toques por dia" dias={dias} series={[{ nome: 'Visitas', valores: dias.map((d) => porDia.get(d)?.visitas ?? 0) }, { nome: 'Toques', valores: dias.map((d) => porDia.get(d)?.toques ?? 0) }]} formato={(v) => n(Math.round(v))} />
        </div>
      </Modulo>
      <Modulo icone={MousePointerClick} titulo="Toques por botão" descricao="Quantas vezes cada botão da página foi tocado no período">
        {r.botoes.length === 0 ? <Aviso>A página não tem botões ainda.</Aviso> : (
          <ul className="space-y-2">
            {r.botoes.map((b) => (
              <li key={b.id} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-rotulo">
                  <span className="font-semibold text-texto">{b.rotulo}{!b.ativo && <span className="ml-1.5 text-legenda font-normal text-texto-3">(removido)</span>}</span>
                  <span className="tabular-nums text-texto-2"><strong className="text-texto">{n(b.toques)}</strong>{r.toques ? ` · ${pct((b.toques / r.toques) * 100)} dos toques` : ''}{r.visitas ? ` · ${pct((b.toques / r.visitas) * 100)} das visitas` : ''}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-fundo"><div className="h-full rounded-full bg-[#6250d6]" style={{ width: `${(b.toques / maior) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </Modulo>
      {r.porOrigem.length > 0 && (
        <Modulo icone={Link2} titulo="De onde vêm as visitas" descricao="Cada endereço tem uma origem: bio, stories ou anúncios">
          <ul className="space-y-1 text-rotulo">{r.porOrigem.map((o) => <li key={o.origem} className="flex justify-between gap-3"><span className="text-texto-2">{ROTULO_ORIGEM[o.origem] ?? o.origem}</span><span className="tabular-nums"><strong>{n(o.visitas)}</strong> · {pct((o.visitas / r.visitas) * 100)}</span></li>)}</ul>
        </Modulo>
      )}
      <Modulo icone={Star} titulo="Insights e recomendações do link da bio" descricao="O que os números mostram e o que fazer">
        <BlocoAnalise analise={analisarBio(r)} />
      </Modulo>
    </>
  )
}
