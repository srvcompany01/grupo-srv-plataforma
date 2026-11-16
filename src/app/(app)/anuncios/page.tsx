import { BarChart3, Bot, ChevronRight, ImagePlus, Megaphone, PlugZap, Search, SlidersHorizontal, Target } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { ConexaoGoogle } from '@/componentes/anuncios/ConexaoGoogle'
import { GaleriaAnuncios } from '@/componentes/anuncios/GaleriaAnuncios'
import { GoogleAds } from '@/componentes/anuncios/GoogleAds'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { BlocoAnalise } from '@/componentes/insights/BlocoAnalise'
import { FunilConversao } from '@/componentes/FunilConversao'
import { BarraSegmentada, BarrasDiarias, COR, Cartao, Kpi, Legenda, Medidor, Progressos, Trilho, Variacao, corDaVez } from '@/componentes/anuncios/Bento'
import { ORDEM_TOM } from '@/componentes/insights/tom'
import { somarDias } from '@/dominio/agenda'
import type { PagoPorDia } from '@/dominio/insights'
import { EmBreve } from '@/componentes/insights/EmBreve'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { Modulo } from '@/componentes/Modulo'
import { dataDeHoje } from '@/dominio/filtros'
import { totaisCampanhas } from '@/dominio/google'
import { analisarPago, tomCtrMeta } from '@/dominio/insights'
import { SeloTom } from '@/componentes/insights/tom'
import { consultaPeriodo, diasDoPeriodo, lerPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { campanhasGoogle, pagoPorDiaGoogle, situacaoGoogle } from '@/servicos/google-agencia'
import { pagoPorDiaMeta } from '@/servicos/meta-anuncios'
import { dadosDoCliente } from '@/servicos/relatorio-cliente'
import { NomeCliente } from '@/componentes/NomeCliente'
import { ArvoreMeta, Criativos, Propostas, TabelaGoogle } from '@/componentes/anuncios/ControleAnuncios'
import { podeGerirAnuncios } from '@/dominio/controle-anuncios'
import { urlLeitura } from '@/infra/r2'
import { estruturaGoogle } from '@/servicos/google-agencia'
import { estruturaMeta, historico, listarCriativos, propostasPendentes } from '@/servicos/controle-anuncios'

export const maxDuration = 60

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const reaisCurto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 })
const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`

const AVISO_GOOGLE: Record<string, string> = {
  ok: 'Google da agência conectado.',
  cancelado: 'Conexão com o Google cancelada.',
  erro: 'Não foi possível conectar o Google. Tente de novo.',
  'sem-config': 'Falta o app do Google (GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET) na Vercel.',
}

type Erro = { erro: string }
type Linha = {
  id: string
  nome: string
  meta: { gasto: number; impressoes: number; cliques: number; ctr: number; porDia: Map<string, number> } | Erro | null
  google: { custo: number; cliques: number; conversoes: number; porDia: Map<string, number> } | Erro | null
}
const valor = <T,>(x: T | Erro | null): T | null => (x && !('erro' in (x as object)) ? (x as T) : null)

/**
 * Anúncios: panorama de todos os clientes (Meta da conta inteira, inclusive anúncios já pausados no período, e
 * Google Ads) ou, com ?cliente=, tudo o que um cliente roda, com insights e recomendações. Visual em "bento"
 * (cartões brancos sobre fundo cinza, .anu em globals.css); as ações continuam nos mesmos componentes.
 */
export default async function Anuncios({ searchParams }: PageProps<'/anuncios'>) {
  const eu = await exigirEquipe()
  const sp = await searchParams
  const hoje = dataDeHoje(new Date())
  const periodo = lerPeriodo(sp, hoje)
  const aviso = typeof sp.google === 'string' ? AVISO_GOOGLE[sp.google] : undefined
  const sb = await criarClienteServidor()
  const [clientes, google] = await Promise.all([listarClientes(sb), situacaoGoogle()])
  const comAnuncios = clientes.filter((c) => !c.interno && c.status !== 'encerrado' && (c.metaContaId || c.googleAdsId))
  const escolhido = comAnuncios.find((c) => c.id === sp.cliente) ?? null
  const base = escolhido ? `/anuncios?cliente=${escolhido.id}` : '/anuncios'
  const seletorPeriodo = <SeletorPeriodo base={base} periodo={periodo} hoje={hoje} />
  const podeGerir = podeGerirAnuncios(eu.papel)
  const propostas = await propostasPendentes(sb, escolhido?.id)
  const carregando = (titulo: string, texto: string) => <Cartao titulo={titulo}><p className="anu-vazio">{texto}</p></Cartao>

  return (
    <div className="page-shell">
      <div className="anu space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="anu-sub">Tráfego pago · {rotuloPeriodo(periodo)}</p>
            <h1 className="mt-0.5 text-[26px] font-semibold tracking-tight text-texto">{escolhido ? <>Anúncios · <NomeCliente nome={escolhido.nome} href={`/clientes/${escolhido.id}`} /></> : 'Anúncios'}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SeletorCliente base="/anuncios" clientes={comAnuncios.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={consultaPeriodo(periodo)} />
            {seletorPeriodo}
          </div>
        </header>
        {aviso && <p className="rounded-xl bg-white px-3 py-2 text-rotulo text-texto-2">{aviso}</p>}

        <div className="anu-grade">
          {propostas.length > 0 && (
            <Modulo icone={Bot} titulo={`Pedidos da IA aguardando aprovação (${propostas.length})`} descricao="Ativar e mudar orçamento pela IA só acontece depois que admin ou gestor aprova">
              <Propostas propostas={propostas} podeGerir={podeGerir} mostrarCliente={!escolhido} />
            </Modulo>
          )}

          {escolhido ? (
            <>
              <Suspense fallback={carregando('Visão geral', 'Buscando no Meta e no Google…')}>
                <VisaoCliente cliente={escolhido} periodo={periodo} googleConectado={google.conectado} />
              </Suspense>
              <div id="controle" className="scroll-mt-4">
                <Suspense fallback={<Modulo icone={SlidersHorizontal} titulo="Controle das campanhas" descricao="Buscando no Meta e no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando as campanhas…</p></Modulo>}>
                  <Controle cliente={escolhido} periodo={periodo} googleConectado={google.conectado} podeGerir={podeGerir} seletor={null} />
                </Suspense>
              </div>
              {escolhido.metaContaId && (
                <div id="criativos" className="scroll-mt-4">
                  <Suspense fallback={null}>
                    <BibliotecaCriativos clienteId={escolhido.id} />
                  </Suspense>
                </div>
              )}
              <div id="analise" className="scroll-mt-4">
                <Modulo icone={Target} titulo="Insights, recomendações e anúncios ativos" descricao={<><NomeCliente nome={escolhido.nome} href={`/clientes/${escolhido.id}`} /> · {rotuloPeriodo(periodo)}</>}>
                  <div className="space-y-6">
                    <Suspense fallback={<p className="py-6 text-center text-rotulo text-texto-3">Analisando as contas…</p>}>
                      <AnalisePago cliente={escolhido} periodo={periodo} googleConectado={google.conectado} />
                    </Suspense>
                    {escolhido.metaContaId && (
                      <div id="anuncios" className="scroll-mt-4">
                        <Suspense fallback={<p className="py-6 text-center text-rotulo text-texto-3">Carregando os anúncios…</p>}>
                          <GaleriaAnuncios contaId={escolhido.metaContaId} periodo={periodo} mostrarGasto seletor={null} incorporado />
                        </Suspense>
                      </div>
                    )}
                  </div>
                </Modulo>
              </div>
              {escolhido.googleAdsId && google.conectado && (
                <div id="google" className="scroll-mt-4">
                  <Suspense fallback={<Modulo icone={Megaphone} titulo="Google Ads" descricao="Buscando no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando as campanhas…</p></Modulo>}>
                    <GoogleAds contaId={escolhido.googleAdsId} periodo={periodo} seletor={null} />
                  </Suspense>
                </div>
              )}
              <EmBreve itens={['TikTok Ads', 'LinkedIn Ads']} />
            </>
          ) : (
            <Suspense fallback={carregando('Panorama de todos os clientes', 'Somando as contas do Meta e do Google…')}>
              <Panorama clientes={comAnuncios} periodo={periodo} googleConectado={google.conectado} />
            </Suspense>
          )}

          <Modulo icone={PlugZap} titulo="Conexão com o Google" descricao="Uma conta Google da agência acessa a MCC do Google Ads e os perfis do Meu Negócio dos clientes">
            <div className="space-y-2 text-rotulo">
              <p>{google.conectado ? <>Conectado como <strong>{google.email || 'conta Google'}</strong>.</> : 'Ainda não conectado.'}</p>
              {google.conectado && !google.adsPronto && <p className="text-aviso-forte">Google Ads: falta o número da MCC (GOOGLE_ADS_LOGIN_CUSTOMER_ID) na Vercel.</p>}
              {eu.papel === 'admin' ? <ConexaoGoogle email={google.conectado ? google.email || 'conta Google' : null} /> : !google.conectado && <p className="text-texto-3">Peça ao admin para conectar.</p>}
            </div>
          </Modulo>
        </div>
      </div>
    </div>
  )
}

/** Período imediatamente anterior, do mesmo tamanho (para as variações). */
const periodoAnterior = (p: PeriodoAnuncios) => {
  const n = diasDoPeriodo(p).length
  const ate = somarDias(p.de, -1)
  return { de: somarDias(ate, -(n - 1)), ate }
}
const lista = <T,>(x: T[] | { erro: string } | null): T[] => (x && !('erro' in x) ? x : [])
const soma = (xs: PagoPorDia[], k: 'gasto' | 'cliques' | 'impressoes') => xs.reduce((s, d) => s + d[k], 0)

/** Bento do cliente: investimento por dia, totais com variação, atalhos e histórico, divisão do gasto, saúde e campanhas. */
async function VisaoCliente({ cliente, periodo, googleConectado }: { cliente: Cliente; periodo: PeriodoAnuncios; googleConectado: boolean }) {
  const comGoogle = !!cliente.googleAdsId && googleConectado
  const ant = periodoAnterior(periodo)
  const sb = await criarClienteServidor()
  const [d, mDia, gDia, mAnt, gAnt, alteracoes] = await Promise.all([
    dadosDoCliente(cliente, periodo, googleConectado, { organico: false }),
    cliente.metaContaId ? pagoPorDiaMeta(cliente.metaContaId, periodo) : null,
    comGoogle ? pagoPorDiaGoogle(cliente.googleAdsId!, periodo) : null,
    cliente.metaContaId ? pagoPorDiaMeta(cliente.metaContaId, ant) : null,
    comGoogle ? pagoPorDiaGoogle(cliente.googleAdsId!, ant) : null,
    historico(sb, cliente.id),
  ])
  const dias = diasDoPeriodo(periodo)
  const meta = new Map(lista(mDia).map((x) => [x.dia, x]))
  const goog = new Map(lista(gDia).map((x) => [x.dia, x]))
  const temAnterior = (mAnt && !('erro' in mAnt)) || (gAnt && !('erro' in gAnt))
  const anterior = temAnterior ? [...lista(mAnt), ...lista(gAnt)] : null
  const total = (d.pago.meta?.gasto ?? 0) + (d.pago.google?.custo ?? 0)
  const cliques = (d.pago.meta?.cliques ?? 0) + (d.pago.google?.cliques ?? 0)
  const impressoes = d.pago.meta?.impressoes ?? 0
  const anuncios = d.anuncios ?? []
  const leadsMeta = anuncios.reduce((s, a) => s + a.resultados, 0)
  const leads = leadsMeta + (d.pago.google?.conversoes ?? 0)
  const gastoLead = anuncios.filter((a) => a.papel === 'lead').reduce((s, a) => s + a.gasto, 0) + (d.pago.google?.custo ?? 0)
  const gastoMarca = anuncios.filter((a) => a.papel === 'marca').reduce((s, a) => s + a.gasto, 0)
  const bons = anuncios.filter((a) => a.desempenho === 'bom').length
  const fracos = anuncios.filter((a) => a.desempenho === 'fraco').length

  // Campanhas: Meta (somando os anúncios ativos de cada campanha) e Google (campanhas do período).
  const porCampanha = new Map<string, { nome: string; gasto: number; leads: number; canal: 'Meta' | 'Google' }>()
  for (const a of anuncios) {
    const c = porCampanha.get(`m:${a.campanha}`) ?? { nome: a.campanha, gasto: 0, leads: 0, canal: 'Meta' as const }
    porCampanha.set(`m:${a.campanha}`, { ...c, gasto: c.gasto + a.gasto, leads: c.leads + a.resultados })
  }
  for (const c of d.campanhas?.campanhas ?? []) porCampanha.set(`g:${c.id}`, { nome: c.nome, gasto: c.custo, leads: c.conversoes, canal: 'Google' })
  const campanhas = [...porCampanha.entries()].map(([id, c]) => ({ id, ...c })).filter((c) => c.gasto > 0).sort((a, b) => b.gasto - a.gasto)
  const fatias = [...campanhas.slice(0, 5).map((c, i) => ({ rotulo: c.nome, valor: c.gasto, cor: corDaVez(i) })), ...(campanhas.length > 5 ? [{ rotulo: 'Outras', valor: campanhas.slice(5).reduce((s, c) => s + c.gasto, 0), cor: 'var(--anu-hach)' }] : [])]

  const analise = analisarPago(d.pago)
  const dica = [...analise.recomendacoes].sort((a, b) => ORDEM_TOM[a.tom] - ORDEM_TOM[b.tom])[0]
  const q = consultaPeriodo(periodo)
  const atalhos = [
    { href: '#controle', rotulo: 'Controle', Icone: SlidersHorizontal },
    ...(cliente.metaContaId ? [{ href: '#criativos', rotulo: 'Criativos', Icone: ImagePlus }, { href: '#anuncios', rotulo: 'Anúncios', Icone: Megaphone }] : []),
    ...(comGoogle ? [{ href: '#google', rotulo: 'Google', Icone: Search }] : []),
    { href: `/performance?aba=meta&cliente=${cliente.id}${q ? `&${q}` : ''}`, rotulo: 'Performance', Icone: BarChart3 },
  ]

  return (
    <>
      <Cartao className="anu-x6" titulo={<span className="anu-hero">{reais.format(total)}</span>} sub={<>Investido no período · <Variacao atual={total} anterior={anterior ? soma(anterior, 'gasto') : null} /></>} acoes={<Legenda itens={[{ nome: 'Meta', cor: COR.verde }, { nome: 'Google Ads', cor: COR.amarelo }]} />}>
        {d.erros.length > 0 && <p className="mb-3 rounded-xl bg-aviso-fundo/50 px-3 py-2 text-legenda text-aviso-forte">{d.erros.join(' · ')}</p>}
        <BarrasDiarias dias={dias} formato={(n) => reaisCurto.format(n)} series={[{ nome: 'Meta', cor: COR.verde, valores: dias.map((x) => meta.get(x)?.gasto ?? 0) }, { nome: 'Google Ads', cor: COR.amarelo, valores: dias.map((x) => goog.get(x)?.gasto ?? 0) }]} />
      </Cartao>

      <Cartao className="anu-x3">
        <Kpi rotulo="Cliques" valor={numero.format(cliques)} extra={<Variacao atual={cliques} anterior={anterior ? soma(anterior, 'cliques') : null} />} />
        <Kpi rotulo="Leads e conversões" valor={numero.format(leads)} extra={<span className="anu-sub">{leads ? `${reais.format(gastoLead / leads)} por lead` : 'nenhum no período'}</span>} />
        <Kpi rotulo="Impressões (Meta)" valor={numero.format(impressoes)} extra={<span className="anu-sub">CTR {d.pago.meta ? pct(d.pago.meta.ctr) : '—'}{d.pago.meta && tomCtrMeta(d.pago.meta.ctr) !== 'neutro' && <> · <SeloTom tom={tomCtrMeta(d.pago.meta.ctr)} /></>}</span>} />
      </Cartao>

      <Cartao className="anu-x3 anu-alto" titulo="Ações rápidas" sub="Vá direto para cada parte">
        <nav className="grid grid-cols-4 gap-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Ir para">
          {atalhos.map(({ href, rotulo, Icone }) => <Link key={href} href={href} className="anu-atalho"><span><Icone className="h-5 w-5" /></span>{rotulo}</Link>)}
        </nav>
        <div className="mt-6">
          <h3 className="anu-titulo mb-1">Histórico de alterações</h3>
          <p className="anu-sub mb-2">O que foi mudado nos anúncios pela plataforma e pela IA</p>
          {alteracoes.length ? <ListaHistorico itens={alteracoes} /> : <p className="anu-vazio">Nenhuma alteração ainda.</p>}
        </div>
      </Cartao>

      <Cartao className="anu-x5" titulo="Para onde vai o investimento" sub="Captação (gera lead) e marca (tráfego e conteúdo)">
        <div className="space-y-4">
          <Trilho valor={gastoLead} max={gastoLead + gastoMarca} cor={COR.verde} esquerda={`Captação ${reais.format(gastoLead)}`} direita={`Marca ${reais.format(gastoMarca)}`} />
          <Trilho valor={d.pago.meta?.gasto ?? 0} max={total} cor={COR.amarelo} esquerda={`Meta ${reais.format(d.pago.meta?.gasto ?? 0)}`} direita={`Google ${reais.format(d.pago.google?.custo ?? 0)}`} />
        </div>
      </Cartao>

      <Cartao className="anu-x4 anu-dica-card" titulo="O que fazer agora" sub="A recomendação mais importante do período">
        <div className="max-w-[78%] space-y-2 pb-1">
          <p className="text-[13px] leading-relaxed text-texto">{dica ? dica.texto : 'Sem recomendações: as contas estão dentro do esperado no período.'}</p>
          <Link href="#analise" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-texto hover:underline">Ver todas <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
      </Cartao>

      <Cartao className="anu-x3" titulo="Divisão por campanha" sub="Quanto cada campanha levou do investimento">
        <BarraSegmentada itens={fatias} formato={(n) => reaisCurto.format(n)} />
      </Cartao>

      <Cartao className="anu-x3" titulo="Saúde dos anúncios" sub="Anúncios ativos do Meta sem desempenho fraco">
        <Medidor pct={anuncios.length ? ((anuncios.length - fracos) / anuncios.length) * 100 : null} centro="saudáveis" legenda={anuncios.length ? `${bons} bons · ${fracos} fracos · ${d.pago.meta?.frequenciaAlta ?? 0} com frequência alta` : 'Sem anúncios ativos no Meta.'} />
      </Cartao>

      <Cartao className="anu-x3" titulo="Campanhas" sub="Maiores investimentos do período">
        <Progressos
          vazio="Nenhuma campanha gastou neste período."
          itens={campanhas.slice(0, 5).map((c, i) => ({ id: c.id, nome: c.nome, valor: c.gasto, max: campanhas[0].gasto, direita: reais.format(c.gasto), cor: corDaVez(i), obs: `${c.canal} · ${c.leads ? `${numero.format(c.leads)} ${c.canal === 'Google' ? 'conversões' : 'leads'} · ${reais.format(c.gasto / c.leads)} cada` : 'sem leads'}` }))}
        />
      </Cartao>

      <Cartao titulo="Funil dos anúncios" sub="Do anúncio visto até a conversa ou o lead, com a conversão de cada etapa (Meta: soma dos anúncios do período)">
        <div className={`grid gap-6 ${d.pago.google ? 'xl:grid-cols-[3fr_2fr]' : ''}`}>
          <div>
            <h3 className="anu-titulo mb-2">Meta</h3>
            {anuncios.length ? (
              <FunilConversao principal="lead ou mensagem" etapas={[
                { rotulo: 'Impressões', valor: anuncios.reduce((s, a) => s + a.impressoes, 0), extra: 'vezes que os anúncios apareceram' },
                { rotulo: 'Alcance', valor: anuncios.reduce((s, a) => s + a.alcance, 0), extra: 'pessoas que viram' },
                { rotulo: 'Cliques no link', valor: anuncios.reduce((s, a) => s + a.cliquesLink, 0), extra: 'foram para o WhatsApp, site ou formulário' },
                { rotulo: 'Leads e mensagens', valor: leadsMeta, extra: 'conversas iniciadas e formulários' },
              ]} />
            ) : <p className="anu-vazio">Sem anúncios da Meta no período.</p>}
          </div>
          {d.pago.google && (
            <div>
              <h3 className="anu-titulo mb-2">Google Ads</h3>
              <FunilConversao principal="conversão" etapas={[
                { rotulo: 'Cliques', valor: d.pago.google.cliques, extra: 'entraram no site' },
                { rotulo: 'Conversões', valor: d.pago.google.conversoes, extra: 'ligações, formulários, WhatsApp' },
              ]} />
            </div>
          )}
        </div>
      </Cartao>
    </>
  )
}

const ROTULO_ACAO: Record<string, string> = { pausar: 'Pausou', ativar: 'Ativou', orcamento: 'Orçamento', criar: 'Criou' }
const COR_ACAO: Record<string, string> = { pausar: '#9a9aa2', ativar: '#6fae2c', orcamento: '#e0a23c', criar: '#5b8def' }

function ListaHistorico({ itens }: { itens: Awaited<ReturnType<typeof historico>> }) {
  const linha = (a: (typeof itens)[number]) => (
    <li key={a.id}>
      <span className="anu-hist-ic" style={{ background: COR_ACAO[a.acao] ?? '#9a9aa2' }} aria-hidden>{a.plataforma === 'meta' ? 'M' : 'G'}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-texto" title={a.nome}>{a.nome}</p>
        <p className="anu-sub truncate">{new Date(a.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Belem' })} · {a.origem === 'ia' ? 'IA · ' : ''}{a.por}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[12px] font-semibold text-texto">{ROTULO_ACAO[a.acao] ?? a.acao}</p>
        {(a.antes || a.depois) && <p className="anu-sub max-w-[7rem] truncate" title={`${a.antes ? `${a.antes} → ` : ''}${a.depois}`}>{a.antes ? `${a.antes} → ` : ''}{a.depois}</p>}
      </div>
    </li>
  )
  return (
    <>
      <ul className="anu-hist">{itens.slice(0, 6).map(linha)}</ul>
      {itens.length > 6 && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[12px] font-semibold text-texto-2 hover:text-texto">Ver mais {itens.length - 6}</summary>
          <ul className="anu-hist">{itens.slice(6).map(linha)}</ul>
        </details>
      )}
    </>
  )
}

/** Liga/desliga e orçamento das campanhas, conjuntos e anúncios (Meta) e das campanhas (Google Ads). */
async function Controle({ cliente, periodo, googleConectado, podeGerir, seletor }: { cliente: Cliente; periodo: PeriodoAnuncios; googleConectado: boolean; podeGerir: boolean; seletor: React.ReactNode }) {
  const [meta, goog] = await Promise.all([
    cliente.metaContaId ? estruturaMeta(cliente.metaContaId, periodo).catch((e: Error) => ({ erro: e.message })) : null,
    cliente.googleAdsId && googleConectado ? estruturaGoogle(cliente.googleAdsId, periodo) : null,
  ])
  const erro = (e: { erro: string }) => <p className="rounded-lg border border-perigo-borda bg-perigo-fundo/40 px-3 py-2 text-rotulo text-perigo-forte">{e.erro}</p>
  return (
    <Modulo icone={SlidersHorizontal} titulo="Controle das campanhas" descricao={<><NomeCliente nome={cliente.nome} /> · ligue, pause e ajuste o orçamento aqui mesmo · gasto de {rotuloPeriodo(periodo)}{!podeGerir && ' · só admin e gestor alteram'}</>} acoes={seletor}>
      <div className="space-y-5">
        {meta && (
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-rotulo font-semibold text-texto"><span className="h-2.5 w-2.5 rounded-full bg-[#0866ff]" aria-hidden /> Meta</h3>
            {'erro' in meta ? erro(meta) : <ArvoreMeta clienteId={cliente.id} campanhas={meta} podeGerir={podeGerir} />}
          </section>
        )}
        {goog && (
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-rotulo font-semibold text-texto"><span className="h-2.5 w-2.5 rounded-full bg-[#eb6834]" aria-hidden /> Google Ads</h3>
            {'erro' in goog ? erro(goog) : <TabelaGoogle clienteId={cliente.id} campanhas={goog} podeGerir={podeGerir} />}
          </section>
        )}
        {!meta && !goog && <p className="text-rotulo text-texto-3">O cliente não tem conta de anúncios ligada (ou o Google da agência não está conectado).</p>}
        <p className="text-legenda text-texto-3">Criar campanhas, públicos e subir criativos é pela IA (Claude ou Codex, pelo MCP da plataforma): ela monta tudo pausado e os pedidos de ativar ou de orçamento aparecem aqui para aprovar.</p>
      </div>
    </Modulo>
  )
}

async function BibliotecaCriativos({ clienteId }: { clienteId: string }) {
  const lista = await listarCriativos(await criarClienteServidor(), clienteId)
  const criativos = await Promise.all(lista.map(async (c) => ({ id: c.id, nome: c.nome, tipo: c.tipo, url: await urlLeitura(c.chave) })))
  return (
    <Modulo icone={ImagePlus} titulo="Criativos" descricao="Biblioteca do cliente para as campanhas da Meta: suba aqui e peça à IA para montar a campanha">
      <Criativos clienteId={clienteId} criativos={criativos} />
    </Modulo>
  )
}

/** Insights e recomendações do pago (os números ficam nos cartões do topo). */
async function AnalisePago({ cliente, periodo, googleConectado }: { cliente: Cliente; periodo: PeriodoAnuncios; googleConectado: boolean }) {
  const d = await dadosDoCliente(cliente, periodo, googleConectado, { organico: false })
  return (
    <div className="space-y-3">
      <h3 className="text-corpo font-semibold text-texto">Insights e recomendações <span className="text-legenda font-normal text-texto-3">Meta e Google Ads</span></h3>
      <BlocoAnalise analise={analisarPago(d.pago)} />
      <p className="text-legenda text-texto-3">Para cruzar com o orgânico (Instagram), veja o relatório na <Link href={`/clientes/${cliente.id}`} className="font-semibold text-petroleo hover:underline">página do cliente</Link>.</p>
    </div>
  )
}

/** Todos os clientes: investimento por dia (Meta e Google), totais, quem investe, divisão por canal e a tabela completa. */
async function Panorama({ clientes, periodo, googleConectado }: { clientes: Cliente[]; periodo: PeriodoAnuncios; googleConectado: boolean }) {
  const linhas: Linha[] = await Promise.all(
    clientes.map(async (c) => {
      const comGoogle = !!c.googleAdsId && googleConectado
      const [meta, ads, adsDia] = await Promise.all([
        c.metaContaId ? pagoPorDiaMeta(c.metaContaId, periodo) : null,
        comGoogle ? campanhasGoogle(c.googleAdsId!, periodo) : null,
        comGoogle ? pagoPorDiaGoogle(c.googleAdsId!, periodo) : null,
      ])
      const somar = (xs: { gasto: number; impressoes: number; cliques: number }[]) => xs.reduce((s, d) => ({ gasto: s.gasto + d.gasto, impressoes: s.impressoes + d.impressoes, cliques: s.cliques + d.cliques }), { gasto: 0, impressoes: 0, cliques: 0 })
      const m = meta && !('erro' in meta) ? somar(meta) : null
      return {
        id: c.id,
        nome: c.nome,
        meta: !meta ? null : 'erro' in meta ? meta : { ...m!, ctr: m!.impressoes ? (m!.cliques / m!.impressoes) * 100 : 0, porDia: new Map(meta.map((d) => [d.dia, d.gasto])) },
        google: !ads ? null : 'erro' in ads ? ads : { ...totaisCampanhas(ads.campanhas), porDia: new Map((adsDia && !('erro' in adsDia) ? adsDia : []).map((d) => [d.dia, d.gasto])) },
      }
    }),
  )
  const totalMeta = linhas.reduce((s, l) => s + (valor(l.meta)?.gasto ?? 0), 0)
  const totalGoogle = linhas.reduce((s, l) => s + (valor(l.google)?.custo ?? 0), 0)
  const cliques = linhas.reduce((s, l) => s + (valor(l.meta)?.cliques ?? 0) + (valor(l.google)?.cliques ?? 0), 0)
  const impressoes = linhas.reduce((s, l) => s + (valor(l.meta)?.impressoes ?? 0), 0)
  const conversoes = linhas.reduce((s, l) => s + (valor(l.google)?.conversoes ?? 0), 0)
  const totalDe = (l: Linha) => (valor(l.meta)?.gasto ?? 0) + (valor(l.google)?.custo ?? 0)
  const investindo = linhas.filter((l) => totalDe(l) > 0)
  const parados = linhas.filter((l) => totalDe(l) === 0)
  const dias = diasDoPeriodo(periodo)
  const ordenadas = [...linhas].sort((a, b) => totalDe(b) - totalDe(a))
  const q = consultaPeriodo(periodo)
  const linkCliente = (id: string) => `/anuncios?cliente=${id}${q ? `&${q}` : ''}`
  const erro = (e: Erro) => <span className="text-perigo" title={e.erro}>erro</span>
  const vazio = <span className="text-texto-3">—</span>

  return (
    <>
      <Cartao className="anu-x6" titulo={<span className="anu-hero">{reais.format(totalMeta + totalGoogle)}</span>} sub="Investido no período, todos os clientes" acoes={<Legenda itens={[{ nome: 'Meta', cor: COR.verde }, { nome: 'Google Ads', cor: COR.amarelo }]} />}>
        <BarrasDiarias
          dias={dias}
          formato={(n) => reaisCurto.format(n)}
          series={[
            { nome: 'Meta', cor: COR.verde, valores: dias.map((d) => linhas.reduce((s, l) => s + (valor(l.meta)?.porDia.get(d) ?? 0), 0)) },
            { nome: 'Google Ads', cor: COR.amarelo, valores: dias.map((d) => linhas.reduce((s, l) => s + (valor(l.google)?.porDia.get(d) ?? 0), 0)) },
          ]}
        />
      </Cartao>

      <Cartao className="anu-x3">
        <Kpi rotulo="Meta" valor={reais.format(totalMeta)} extra={<span className="anu-sub">{numero.format(impressoes)} impressões · CTR {impressoes ? pct((linhas.reduce((s, l) => s + (valor(l.meta)?.cliques ?? 0), 0) / impressoes) * 100) : '—'}</span>} />
        <Kpi rotulo="Google Ads" valor={reais.format(totalGoogle)} extra={<span className="anu-sub">{conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} conversões</span>} />
        <Kpi rotulo="Cliques" valor={numero.format(cliques)} extra={<span className="anu-sub">média de {investindo.length ? reais.format((totalMeta + totalGoogle) / investindo.length) : '—'} por cliente</span>} />
      </Cartao>

      <Cartao className="anu-x3 anu-alto" titulo="Clientes investindo" sub={`${investindo.length} de ${linhas.length} com gasto no período`}>
        <Medidor pct={linhas.length ? (investindo.length / linhas.length) * 100 : null} centro="investindo" legenda={parados.length ? `${parados.length} sem investimento` : 'Todos os clientes estão investindo.'} />
        {parados.length > 0 && (
          <div className="mt-5">
            <h3 className="anu-titulo mb-2 text-[13px]">Sem investimento</h3>
            <ul className="anu-hist">
              {parados.map((l) => (
                <li key={l.id}>
                  <span className="anu-hist-ic" style={{ background: 'var(--anu-laranja)' }} aria-hidden>{l.nome.slice(0, 1).toUpperCase()}</span>
                  <NomeCliente nome={l.nome} href={linkCliente(l.id)} className="min-w-0 flex-1 truncate text-[12.5px]" />
                  {(l.meta && 'erro' in l.meta) || (l.google && 'erro' in l.google) ? erro((l.meta && 'erro' in l.meta ? l.meta : l.google) as Erro) : <span className="anu-sub">R$ 0</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Cartao>

      <Cartao className="anu-x5" titulo="Divisão por canal" sub="Quanto de todo o investimento foi para cada rede">
        <BarraSegmentada formato={(n) => reaisCurto.format(n)} itens={[{ rotulo: 'Meta (Facebook e Instagram)', valor: totalMeta, cor: COR.verde }, { rotulo: 'Google Ads', valor: totalGoogle, cor: COR.amarelo }]} />
      </Cartao>

      <Cartao className="anu-x4" titulo="Quem mais investe" sub="Os 5 maiores do período">
        <Progressos
          vazio="Nenhum cliente investiu neste período."
          itens={ordenadas.filter((l) => totalDe(l) > 0).slice(0, 5).map((l, i, xs) => ({ id: l.id, nome: <NomeCliente nome={l.nome} href={linkCliente(l.id)} />, valor: totalDe(l), max: totalDe(xs[0]), direita: reais.format(totalDe(l)), cor: corDaVez(i), obs: `Meta ${reais.format(valor(l.meta)?.gasto ?? 0)} · Google ${reais.format(valor(l.google)?.custo ?? 0)}` }))}
        />
      </Cartao>

      <Cartao className="anu-x9" titulo="Todos os clientes" sub={`Meta (conta inteira) e Google Ads · ${rotuloPeriodo(periodo)} · clique no cliente para ver tudo o que ele roda`}>
        {linhas.length === 0 ? (
          <p className="anu-vazio">Nenhum cliente com conta de anúncios no cadastro. Preencha a conta do Meta e/ou do Google Ads na página do cliente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-rotulo">
              <thead>
                <tr className="text-left text-legenda text-texto-3">
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 text-right font-medium">Meta investido</th>
                  <th className="py-2 pr-3 text-right font-medium">Meta cliques</th>
                  <th className="py-2 pr-3 text-right font-medium">Meta CTR</th>
                  <th className="py-2 pr-3 text-right font-medium">Google investido</th>
                  <th className="py-2 pr-3 text-right font-medium">Google cliques</th>
                  <th className="py-2 pr-3 text-right font-medium">Google conversões</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((l) => {
                  const m = valor(l.meta)
                  const g = valor(l.google)
                  return (
                    <tr key={l.id} className="hover:bg-[var(--bg-subtle)]">
                      <td className="rounded-l-xl py-2 pl-2 pr-3"><NomeCliente nome={l.nome} href={linkCliente(l.id)} /></td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m ? reais.format(m.gasto) : l.meta ? erro(l.meta as Erro) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m ? numero.format(m.cliques) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m ? <span className="inline-flex items-center justify-end gap-1.5">{pct(m.ctr)} {tomCtrMeta(m.ctr) !== 'neutro' && <SeloTom tom={tomCtrMeta(m.ctr)} />}</span> : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{g ? reais.format(g.custo) : l.google ? erro(l.google as Erro) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{g ? numero.format(g.cliques) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{g ? <span className={g.conversoes > 0 ? 'font-semibold text-sucesso-forte' : g.custo > 0 ? 'font-semibold text-perigo-forte' : ''}>{g.conversoes > 0 ? '▲ ' : g.custo > 0 ? '▼ ' : ''}{g.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</span> : vazio}</td>
                      <td className="rounded-r-xl py-2 pr-2 text-right font-semibold tabular-nums">{reais.format(totalDe(l))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-legenda text-texto-3">Passe o mouse em &quot;erro&quot; para ver o motivo.</p>
      </Cartao>
    </>
  )
}
