import { ArrowUpRight, ChartNoAxesCombined, CheckCheck, ChevronRight, ClipboardCheck, History, ImagePlus, MessagesSquare, MousePointer2, PlugZap, Radio, ShieldCheck, SlidersHorizontal, Wallet } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { ConexaoGoogle } from '@/componentes/anuncios/ConexaoGoogle'
import { Criativos, Propostas } from '@/componentes/anuncios/ControleAnuncios'
import { GaleriaAnuncios } from '@/componentes/anuncios/GaleriaAnuncios'
import { GoogleAds } from '@/componentes/anuncios/GoogleAds'
import { BlocoAnalise } from '@/componentes/insights/BlocoAnalise'
import { FunilConversao } from '@/componentes/FunilConversao'
import { analisarPago } from '@/dominio/insights'
import { lerAbaAnuncios, lerCanalAnuncios, resumirContasAnuncios, serieContasAnuncios, somarDisponiveis, urlAnuncios, type AbaAnuncios, type CanalAnuncios } from '@/dominio/central-anuncios'
import { podeGerirAnuncios } from '@/dominio/controle-anuncios'
import { dataDeHoje } from '@/dominio/filtros'
import { lerPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { urlLeitura } from '@/infra/r2'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { campanhasGoogleCentral, contaCentralAnuncios } from '@/servicos/central-anuncios'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { estruturaMeta, historico, listarCriativos, propostasPendentes, type Proposta } from '@/servicos/controle-anuncios'
import { situacaoGoogle } from '@/servicos/google-agencia'
import { dadosDoCliente } from '@/servicos/relatorio-cliente'
import { CampanhasAnuncios, type ContaCampanhas } from './CampanhasAnuncios'
import { FiltrosAnuncios } from './FiltrosAnuncios'
import { GraficoInvestimento } from './GraficoInvestimento'
import { NovaCampanha } from './NovaCampanha'
import './anuncios.css'

export const maxDuration = 60
const reais = (n: number | null) => n === null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const numero = (n: number | null) => n === null ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const data = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
const ABAS = [['visao', 'Visão geral'], ['campanhas', 'Campanhas'], ['criativos', 'Criativos'], ['aprovacoes', 'Aprovações']] as const
const AVISO_GOOGLE: Record<string, string> = { ok: 'Google da agência conectado.', cancelado: 'Conexão com o Google cancelada.', erro: 'Não foi possível conectar o Google. Tente de novo.', 'sem-config': 'A conexão do Google ainda não foi configurada. Fale com o administrador.' }

type Contexto = { clientes: Cliente[]; escolhido: Cliente | null; periodo: PeriodoAnuncios; canal: CanalAnuncios; aba: AbaAnuncios; googleConectado: boolean; podeGerir: boolean; propostas: Proposta[] }
const link = (ctx: Pick<Contexto, 'escolhido' | 'periodo' | 'canal'>, aba: AbaAnuncios, cliente = ctx.escolhido?.id) => urlAnuncios({ cliente, periodo: ctx.periodo, canal: ctx.canal, aba })

export default async function Anuncios({ searchParams }: PageProps<'/anuncios'>) {
  const eu = await exigirEquipe()
  const sp = await searchParams
  const hoje = dataDeHoje(new Date()), periodo = lerPeriodo(sp, hoje)
  const canal = lerCanalAnuncios(sp.canal), aba = lerAbaAnuncios(sp.aba)
  const sb = await criarClienteServidor()
  const [todos, google] = await Promise.all([listarClientes(sb), situacaoGoogle()])
  const clientes = todos.filter(c => !c.interno && c.status !== 'encerrado' && (c.metaContaId || c.googleAdsId))
  const escolhido = clientes.find(c => c.id === sp.cliente) ?? null
  const propostas = (await propostasPendentes(sb, escolhido?.id)).filter(p => canal === 'todos' || p.plataforma === canal)
  const ctx: Contexto = { clientes: escolhido ? [escolhido] : clientes, escolhido, periodo, canal, aba, googleConectado: google.conectado, podeGerir: podeGerirAnuncios(eu.papel), propostas }
  const aviso = typeof sp.google === 'string' ? AVISO_GOOGLE[sp.google] : undefined
  return <div className="an"><div className="an-corpo">
    <header className="an-cab"><div><span className="an-eyebrow"><i />Tráfego pago</span><h1>Anúncios{escolhido && <span> · {escolhido.nome}</span>}</h1><p>Resultados claros. Campanhas sob controle.</p></div><NovaCampanha key={escolhido?.id ?? 'todos'} clientes={clientes.map(c => ({ id: c.id, nome: c.nome }))} clienteInicial={escolhido?.id ?? null} /></header>
    <FiltrosAnuncios clientes={clientes.map(c => ({ id: c.id, nome: c.nome }))} cliente={escolhido?.id ?? null} periodo={periodo} hoje={hoje} canal={canal} aba={aba} />
    {aviso && <p className="an-aviso" role="status">{aviso}</p>}
    <nav className="an-tabs" aria-label="Seções de anúncios">{ABAS.map(([a, rotulo]) => <Link key={a} href={link(ctx, a)} scroll={false} prefetch={false} aria-current={aba === a ? 'page' : undefined}>{rotulo}{a === 'aprovacoes' && <span>{propostas.length}</span>}</Link>)}</nav>
    <Suspense key={`${escolhido?.id}:${periodo.de}:${periodo.ate}:${canal}:${aba}`} fallback={<Carregando />}><Resultados ctx={ctx} /></Suspense>
    <details className="an-connection"><summary><span><PlugZap /><i data-conectado={google.conectado} />{google.conectado ? 'Google da agência conectado' : 'Conectar Google da agência'}</span><span>Gerenciar conexão<ChevronRight /></span></summary><div><p>{google.conectado ? <>Conectado como <strong>{google.email || 'conta Google'}</strong>.</> : 'Conecte a conta da agência para acessar o Google Ads e os perfis do Meu Negócio.'}</p>{google.conectado && !google.adsPronto && <p>O Google Ads ainda precisa da configuração da MCC. Fale com o administrador.</p>}{eu.papel === 'admin' ? <ConexaoGoogle email={google.conectado ? google.email || 'conta Google' : null} /> : <p>A conexão é gerenciada pelo administrador.</p>}</div></details>
    <footer className="an-footer"><span><ShieldCheck />Alterações e aprovações ficam registradas na plataforma.</span><span>Período: {data(periodo.de)} a {data(periodo.ate)} · horário de Belém</span></footer>
  </div></div>
}

function Carregando() {
  return <div className="an-loading" role="status"><div className="an-metrics">{[0, 1, 2, 3].map(i => <div className="an-metric" key={i}><span /><strong /><small /></div>)}</div><p>Consultando resultados nas contas de anúncios…</p></div>
}

function carregarContas(ctx: Contexto) {
  return Promise.all(ctx.clientes.map(c => contaCentralAnuncios(c.id, c.nome, c.metaContaId, c.googleAdsId, ctx.periodo.de, ctx.periodo.ate, ctx.googleConectado, ctx.canal)))
}

function Resultados({ ctx }: { ctx: Contexto }) {
  return <div className="an-content"><Suspense fallback={<Carregando />}><Metricas ctx={ctx} /></Suspense><Suspense fallback={<p className="an-empty" role="status">Carregando {ctx.aba === 'visao' ? 'resultados' : ctx.aba === 'campanhas' ? 'campanhas' : ctx.aba === 'criativos' ? 'criativos' : 'aprovações'}…</p>}>
    {ctx.aba === 'visao' ? <VisaoGeral ctx={ctx} /> : ctx.aba === 'campanhas' ? <ControleCampanhas ctx={ctx} /> : ctx.aba === 'criativos' ? <Bibliotecas ctx={ctx} /> : <section className="an-panel"><div className="an-panel-head"><div><h2>Aprovações</h2><p>Revise antes de ativar campanhas ou alterar orçamentos pela IA.</p></div><ClipboardCheck aria-hidden /></div>{ctx.propostas.length ? <div className="an-proposals"><Propostas propostas={ctx.propostas} podeGerir={ctx.podeGerir} mostrarCliente={!ctx.escolhido} /></div> : <div className="an-empty"><CheckCheck /><h3>Tudo revisado por aqui</h3><p>Nenhuma solicitação pendente para este filtro.</p></div>}</section>}
  </Suspense></div>
}

async function Metricas({ ctx }: { ctx: Contexto }) {
  const { canal } = ctx
  const contas = await carregarContas(ctx)
  const t = resumirContasAnuncios(contas)
  const kpis = [
    { rotulo: 'Investimento total', valor: reais(t.gasto), sub: 'No período selecionado', Icone: Wallet },
    { rotulo: 'Leads · Meta', valor: numero(t.leads), sub: t.cpl !== null ? `CPL de ${reais(t.cpl)} · somente captação` : canal === 'google' ? 'Selecione Meta para consultar' : 'Conversas e formulários de captação', Icone: MessagesSquare },
    { rotulo: 'Conversões · Google', valor: numero(t.conversoes), sub: canal === 'meta' ? 'Selecione Google para consultar' : 'Ações registradas no Google Ads', Icone: MousePointer2 },
    { rotulo: 'Campanhas ativas', valor: numero(t.ativas), sub: t.pausadas !== null ? `${numero(t.pausadas)} pausadas · status atual` : 'Status indisponível', Icone: Radio },
  ]
  return <>
    <div className="an-metrics" aria-label="Indicadores dos anúncios">{kpis.map(({ rotulo, valor, sub, Icone }) => <div className="an-metric" key={rotulo}><div><span>{rotulo}</span><Icone aria-hidden /></div><strong>{valor}</strong><small>{sub}</small></div>)}</div>
    {t.erros.length > 0 && <details className="an-data-warning"><summary>Alguns dados não puderam ser carregados. Os totais disponíveis podem estar parciais.</summary><ul>{t.erros.map((erro, i) => <li key={i}>{erro}</li>)}</ul></details>}
  </>
}

async function VisaoGeral({ ctx }: { ctx: Contexto }) {
  const contas = await carregarContas(ctx)
  const t = resumirContasAnuncios(contas), serie = serieContasAnuncios(contas, ctx.periodo)
  const ordenadas = [...contas].sort((a, b) => (somarDisponiveis([b.meta?.gasto, b.google?.gasto]) ?? 0) - (somarDisponiveis([a.meta?.gasto, a.google?.gasto]) ?? 0))
  return <>
    <div className="an-columns">
      <section className="an-panel"><div className="an-panel-head"><div><h2>Investimento por dia</h2><p>{data(ctx.periodo.de)} a {data(ctx.periodo.ate)}</p></div><ChartNoAxesCombined aria-hidden /></div>
        <div className="an-legend">{ctx.canal !== 'google' && <span><i />Meta</span>}{ctx.canal !== 'meta' && <span><i data-google />Google Ads</span>}</div>
        {t.gasto !== null ? <GraficoInvestimento dias={serie} meta={ctx.canal !== 'google'} google={ctx.canal !== 'meta'} /> : <div className="an-empty"><p>Sem dados de investimento para este filtro.</p></div>}
        <div className="an-chart-foot">{ctx.canal !== 'google' && <span>Meta <strong>{reais(t.meta)}</strong></span>}{ctx.canal !== 'meta' && <span>Google Ads <strong>{reais(t.google)}</strong></span>}</div>
      </section>
      <section className="an-panel an-review"><div className="an-panel-head"><div><h2>Aguardando sua decisão</h2><p>{ctx.propostas.length} solicitaç{ctx.propostas.length === 1 ? 'ão pendente' : 'ões pendentes'}</p></div><ClipboardCheck aria-hidden /></div><div className="an-review-items">
        {ctx.propostas.length ? ctx.propostas.slice(0, 2).map(p => <div className="an-review-row" key={p.id}><span><SlidersHorizontal /></span><div><strong>{p.acao === 'ativar' ? 'Ativar campanha ou anúncio' : 'Ajustar orçamento'}</strong><p>{p.cliente} · {p.nome}</p>{p.acao === 'orcamento' && <small>{reais(p.valorAtual)} → {reais(p.valorNovo)}</small>}</div></div>) : <div className="an-review-row"><span data-ok><CheckCheck /></span><div><strong>Tudo revisado por aqui</strong><p>Sem solicitações pendentes para este filtro.</p></div></div>}
      </div><Link className="an-btn" href={link(ctx, 'aprovacoes')} scroll={false} prefetch={false}>{ctx.propostas.length ? 'Revisar solicitações' : 'Ver aprovações'}<ArrowUpRight /></Link></section>
    </div>
    <section className="an-panel"><div className="an-panel-head"><div><h2>{ctx.escolhido ? 'Resultados do cliente' : 'Resultados por cliente'}</h2><p>Leads de captação do Meta e conversões do Google Ads.</p></div><Link className="an-text-btn" href={link(ctx, 'campanhas')} scroll={false} prefetch={false}>Ver campanhas<ArrowUpRight /></Link></div>
      {ordenadas.length ? <div className="an-table-wrap"><table><thead><tr><th>Cliente</th><th className="an-number">Investido</th><th className="an-number">Leads Meta</th><th className="an-number">Conv. Google</th><th className="an-number">Campanhas</th><th><span className="sr-only">Detalhes</span></th></tr></thead><tbody>{ordenadas.map(c => <tr key={c.id}><td><Link className="an-client" href={link(ctx, 'visao', c.id)} prefetch={false}><span>{c.nome.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()}</span><div><strong>{c.nome}</strong><small>{c.erros.length ? 'Dados parciais · confira os avisos' : [c.meta && 'Meta Ads', c.google && 'Google Ads'].filter(Boolean).join(' · ') || 'Sem conta neste canal'}</small></div></Link></td><td className="an-number">{reais(somarDisponiveis([c.meta?.gasto, c.google?.gasto]))}</td><td className="an-number">{numero(c.meta?.resultados ?? null)}</td><td className="an-number">{numero(c.google?.resultados ?? null)}</td><td className="an-number">{numero(somarDisponiveis([c.meta?.ativas, c.google?.ativas]))} ativas</td><td><Link className="an-icon-btn" href={link(ctx, 'campanhas', c.id)} prefetch={false} aria-label={`Ver campanhas de ${c.nome}`}><ArrowUpRight /></Link></td></tr>)}</tbody></table></div> : <div className="an-empty"><h3>Nenhuma conta de anúncios cadastrada</h3><p>Vincule a conta Meta ou Google Ads na página do cliente para acompanhar os resultados.</p><Link className="an-btn" href="/clientes">Ver clientes</Link></div>}
      <div className="an-table-bottom"><span>{contas.length} cliente{contas.length === 1 ? '' : 's'} no filtro</span><span>{numero(t.cliques)} cliques no período</span></div>
    </section>
    {ctx.escolhido && <details className="an-details"><summary><ChartNoAxesCombined />Funil, insights e recomendações<ChevronRight /></summary><Suspense fallback={<p className="an-empty">Analisando os resultados…</p>}><AnaliseCliente ctx={ctx} cliente={ctx.escolhido} /></Suspense></details>}
  </>
}

async function ControleCampanhas({ ctx }: { ctx: Contexto }) {
  const erros: string[] = []
  const contas: ContaCampanhas[] = await Promise.all(ctx.clientes.map(async c => {
    const [meta, google] = await Promise.all([
      c.metaContaId && ctx.canal !== 'google' ? estruturaMeta(c.metaContaId, ctx.periodo).catch((e: Error) => ({ erro: e.message })) : null,
      c.googleAdsId && ctx.googleConectado && ctx.canal !== 'meta' ? campanhasGoogleCentral(c.googleAdsId, ctx.periodo.de, ctx.periodo.ate) : null,
    ])
    if (meta && 'erro' in meta) erros.push(`${c.nome} · Meta: ${meta.erro}`)
    if (google && 'erro' in google) erros.push(`${c.nome} · Google: ${google.erro}`)
    return { id: c.id, nome: c.nome, meta: meta && !('erro' in meta) ? meta : [], google: google && !('erro' in google) ? google : [] }
  }))
  return <>{erros.length > 0 && <div className="an-aviso" role="status">{erros.map(e => <p key={e}>{e}</p>)}</div>}<CampanhasAnuncios contas={contas} podeGerir={ctx.podeGerir} />{ctx.escolhido && <details className="an-details"><summary><History />Histórico de alterações<ChevronRight /></summary><HistoricoCliente clienteId={ctx.escolhido.id} /></details>}</>
}

async function Bibliotecas({ ctx }: { ctx: Contexto }) {
  const clientes = ctx.canal === 'google' ? [] : ctx.clientes.filter(c => c.metaContaId)
  return <div className="an-libraries">{clientes.length ? clientes.map(c => <section className="an-panel" key={c.id}><div className="an-panel-head"><div><h2>{c.nome}</h2><p>Biblioteca de criativos · Meta Ads</p></div><ImagePlus aria-hidden /></div><Suspense fallback={<p className="an-empty">Carregando arquivos…</p>}><BibliotecaCliente clienteId={c.id} /></Suspense>{ctx.escolhido && <details className="an-details an-live-ads"><summary>Anúncios ativos e desempenho<ChevronRight /></summary><Suspense fallback={<p className="an-empty">Buscando anúncios…</p>}><GaleriaAnuncios contaId={c.metaContaId!} periodo={ctx.periodo} mostrarGasto seletor={null} incorporado /></Suspense></details>}</section>) : <section className="an-panel an-empty"><ImagePlus /><h3>{ctx.canal === 'google' ? 'A biblioteca reúne os criativos da Meta' : 'Nenhuma conta Meta neste filtro'}</h3><p>{ctx.canal === 'google' ? 'Selecione Meta ou Todos para consultar e enviar arquivos.' : 'Vincule uma conta de anúncios da Meta ao cliente para começar.'}</p></section>}</div>
}
async function BibliotecaCliente({ clienteId }: { clienteId: string }) {
  const lista = await listarCriativos(await criarClienteServidor(), clienteId)
  const criativos = await Promise.all(lista.map(async c => ({ id: c.id, nome: c.nome, tipo: c.tipo, url: await urlLeitura(c.chave) })))
  return <div className="an-library"><Criativos clienteId={clienteId} criativos={criativos} /></div>
}
async function HistoricoCliente({ clienteId }: { clienteId: string }) {
  const itens = await historico(await criarClienteServidor(), clienteId)
  return itens.length ? <ul className="an-history">{itens.map(a => <li key={a.id}><div><strong>{a.nome}</strong><p>{a.plataforma === 'meta' ? 'Meta' : 'Google'} · {a.acao} · {a.por || 'Equipe'}{a.origem === 'ia' ? ' · IA' : ''}</p></div><div><span>{a.antes}{a.antes && a.depois ? ' → ' : ''}{a.depois}</span><small>{new Date(a.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Belem' })}</small></div></li>)}</ul> : <p className="an-empty">Nenhuma alteração registrada ainda.</p>
}
async function AnaliseCliente({ ctx, cliente }: { ctx: Contexto; cliente: Cliente }) {
  const d = await dadosDoCliente(cliente, ctx.periodo, ctx.googleConectado && ctx.canal !== 'meta', { organico: false })
  const anuncios = d.anuncios ?? []
  const pago = { meta: ctx.canal === 'google' ? null : d.pago.meta, google: ctx.canal === 'meta' ? null : d.pago.google }
  return <div className="an-analysis"><BlocoAnalise analise={analisarPago(pago)} />{ctx.canal !== 'google' && anuncios.length > 0 && <section><h3>Funil Meta · anúncios ativos</h3><FunilConversao principal="lead ou mensagem" etapas={[{ rotulo: 'Impressões', valor: anuncios.reduce((s, a) => s + a.impressoes, 0) }, { rotulo: 'Cliques no link', valor: anuncios.reduce((s, a) => s + a.cliquesLink, 0) }, { rotulo: 'Leads e mensagens', valor: anuncios.reduce((s, a) => s + a.resultados, 0) }]} /></section>}{cliente.googleAdsId && ctx.googleConectado && ctx.canal !== 'meta' && <GoogleAds contaId={cliente.googleAdsId} periodo={ctx.periodo} seletor={null} />}<p>Período analisado: {rotuloPeriodo(ctx.periodo)}. <Link href={`/clientes/${cliente.id}`}>Ver relatório do cliente</Link></p></div>
}
