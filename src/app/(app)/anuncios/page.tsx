import { Megaphone, MousePointerClick, PlugZap, Search, Target, Users, Wallet, Eye, Calculator, Bot, History, ImagePlus, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { ConexaoGoogle } from '@/componentes/anuncios/ConexaoGoogle'
import { GaleriaAnuncios } from '@/componentes/anuncios/GaleriaAnuncios'
import { GoogleAds } from '@/componentes/anuncios/GoogleAds'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { BlocoAnalise, Numeros } from '@/componentes/insights/BlocoAnalise'
import { EmBreve } from '@/componentes/insights/EmBreve'
import { CORES_SERIE, GraficoDiario } from '@/componentes/insights/GraficoDiario'
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
const reaisCurto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
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
 * Google Ads) ou, com ?cliente=, tudo o que um cliente roda, com insights e recomendações.
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

  return (
    <div className="page-shell relatorio">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Tráfego pago</p>
          <h1 className="page-title mt-1">Anúncios</h1>
        </div>
        <SeletorCliente base="/anuncios" clientes={comAnuncios.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={consultaPeriodo(periodo)} />
      </div>
      {aviso && <p className="rounded-lg border border-borda bg-fundo px-3 py-2 text-rotulo text-texto-2">{aviso}</p>}

      {propostas.length > 0 && (
        <Modulo icone={Bot} titulo={`Pedidos da IA aguardando aprovação (${propostas.length})`} descricao="Ativar e mudar orçamento pela IA só acontece depois que admin ou gestor aprova">
          <Propostas propostas={propostas} podeGerir={podeGerir} mostrarCliente={!escolhido} />
        </Modulo>
      )}

      {escolhido ? (
        <>
          <Suspense fallback={<Modulo icone={SlidersHorizontal} titulo="Controle das campanhas" descricao="Buscando no Meta e no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando as campanhas…</p></Modulo>}>
            <Controle cliente={escolhido} periodo={periodo} googleConectado={google.conectado} podeGerir={podeGerir} seletor={seletorPeriodo} />
          </Suspense>
          {escolhido.metaContaId && (
            <Suspense fallback={null}>
              <BibliotecaCriativos clienteId={escolhido.id} />
            </Suspense>
          )}
          <Suspense fallback={<Modulo icone={Target} titulo="Insights e recomendações" descricao="Analisando…"><p className="py-6 text-center text-rotulo text-texto-3">Analisando as contas…</p></Modulo>}>
            <AnalisePago cliente={escolhido} periodo={periodo} googleConectado={google.conectado} seletor={seletorPeriodo} />
          </Suspense>
          {escolhido.metaContaId && (
            <Suspense fallback={<Modulo icone={Megaphone} titulo="Anúncios ativos" descricao="Buscando no Meta…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando os anúncios…</p></Modulo>}>
              <GaleriaAnuncios contaId={escolhido.metaContaId} periodo={periodo} mostrarGasto seletor={seletorPeriodo} />
            </Suspense>
          )}
          {escolhido.googleAdsId && google.conectado && (
            <Suspense fallback={<Modulo icone={Megaphone} titulo="Google Ads" descricao="Buscando no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando as campanhas…</p></Modulo>}>
              <GoogleAds contaId={escolhido.googleAdsId} periodo={periodo} seletor={seletorPeriodo} />
            </Suspense>
          )}
          <Suspense fallback={null}>
            <Historico clienteId={escolhido.id} />
          </Suspense>
          <EmBreve itens={['TikTok Ads', 'LinkedIn Ads']} />
        </>
      ) : (
        <Suspense fallback={<Modulo icone={Megaphone} titulo="Panorama de todos os clientes" descricao="Buscando no Meta e no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Somando as contas…</p></Modulo>}>
          <Panorama clientes={comAnuncios} periodo={periodo} googleConectado={google.conectado} seletor={seletorPeriodo} />
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

const ROTULO_ACAO: Record<string, string> = { pausar: 'Pausou', ativar: 'Ativou', orcamento: 'Orçamento', criar: 'Criou' }

async function Historico({ clienteId }: { clienteId: string }) {
  const itens = await historico(await criarClienteServidor(), clienteId)
  if (!itens.length) return null
  return (
    <Modulo icone={History} titulo="Histórico de alterações" descricao="O que foi mudado nos anúncios pela plataforma e pela IA">
      <ul className="divide-y divide-borda/60 text-rotulo">
        {itens.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-1.5">
            <span className="w-28 shrink-0 tabular-nums text-legenda text-texto-3">{new Date(a.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Belem' })}</span>
            <span className={`rounded-md px-1.5 py-0.5 text-micro font-semibold ${a.acao === 'pausar' ? 'bg-fundo text-texto-2' : a.acao === 'ativar' ? 'bg-sucesso-fundo text-sucesso-forte' : a.acao === 'criar' ? 'bg-[#e6f0fb] text-[#2a78d6]' : 'bg-aviso-fundo text-aviso-forte'}`}>{ROTULO_ACAO[a.acao] ?? a.acao}</span>
            <span className="min-w-0 flex-1 truncate">{a.plataforma === 'meta' ? 'Meta' : 'Google'} · {a.nome}{a.antes || a.depois ? <span className="text-texto-3"> · {a.antes ? `${a.antes} → ` : ''}{a.depois}</span> : null}</span>
            <span className="text-legenda text-texto-3">{a.origem === 'ia' ? 'IA · ' : ''}{a.por}</span>
          </li>
        ))}
      </ul>
    </Modulo>
  )
}

async function AnalisePago({ cliente, periodo, googleConectado, seletor }: { cliente: Cliente; periodo: PeriodoAnuncios; googleConectado: boolean; seletor: React.ReactNode }) {
  const d = await dadosDoCliente(cliente, periodo, googleConectado, { organico: false })
  const dias = diasDoPeriodo(periodo)
  const porDia = new Map(d.pagoPorDia.map((x) => [x.dia, x.gasto]))
  const total = (d.pago.meta?.gasto ?? 0) + (d.pago.google?.custo ?? 0)
  return (
    <Modulo icone={Target} titulo="Insights e recomendações" descricao={<><NomeCliente nome={cliente.nome} href={`/clientes/${cliente.id}`} /> · Meta e Google Ads · {rotuloPeriodo(periodo)}</>} acoes={seletor}>
      <div className="space-y-4">
        {d.erros.length > 0 && <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-legenda text-aviso-forte">{d.erros.join(' · ')}</p>}
        <Numeros
          itens={[
            { rotulo: 'Investido', valor: reais.format(total), icone: Wallet, cor: '#2a78d6' },
            { rotulo: 'Meta', valor: d.pago.meta ? reais.format(d.pago.meta.gasto) : '—', extra: d.pago.meta ? `${d.pago.meta.anuncios} anúncios ativos` : undefined, tom: d.pago.meta ? (d.pago.meta.fracos ? 'atencao' : 'bom') : undefined, icone: Megaphone, cor: '#0866ff' },
            { rotulo: 'Google Ads', valor: d.pago.google ? reais.format(d.pago.google.custo) : '—', extra: d.pago.google ? `${d.pago.google.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} conversões` : undefined, tom: !d.pago.google ? undefined : d.pago.google.conversoes > 0 ? 'bom' : d.pago.google.custo > 0 ? 'ruim' : undefined, icone: Search, cor: '#eb6834' },
            { rotulo: 'Impressões (Meta)', valor: numero.format(d.pago.meta?.impressoes ?? 0), icone: Eye, cor: '#1baf7a' },
            { rotulo: 'Cliques', valor: numero.format((d.pago.meta?.cliques ?? 0) + (d.pago.google?.cliques ?? 0)), icone: MousePointerClick, cor: '#e87ba4' },
            { rotulo: 'CTR (Meta)', valor: d.pago.meta ? pct(d.pago.meta.ctr) : '—', tom: d.pago.meta ? tomCtrMeta(d.pago.meta.ctr) : undefined, icone: Target, cor: '#6250d6' },
          ]}
        />
        <GraficoDiario titulo="Investimento por dia" dias={dias} series={[{ nome: 'Investido', valores: dias.map((x) => porDia.get(x) ?? 0) }]} formato={(n) => reaisCurto.format(n)} tipo="barras" />
        <BlocoAnalise analise={analisarPago(d.pago)} />
        <p className="text-legenda text-texto-3">Para cruzar com o orgânico (Instagram), veja o relatório na <Link href={`/clientes/${cliente.id}`} className="font-semibold text-petroleo hover:underline">página do cliente</Link>.</p>
      </div>
    </Modulo>
  )
}

async function Panorama({ clientes, periodo, googleConectado, seletor }: { clientes: Cliente[]; periodo: PeriodoAnuncios; googleConectado: boolean; seletor: React.ReactNode }) {
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
  const investindo = linhas.filter((l) => (valor(l.meta)?.gasto ?? 0) + (valor(l.google)?.custo ?? 0) > 0)
  const dias = diasDoPeriodo(periodo)
  const ordenadas = [...linhas].sort((a, b) => (valor(b.meta)?.gasto ?? 0) + (valor(b.google)?.custo ?? 0) - (valor(a.meta)?.gasto ?? 0) - (valor(a.google)?.custo ?? 0))
  const erro = (e: Erro) => <span className="text-perigo" title={e.erro}>erro</span>
  const vazio = <span className="text-texto-3">—</span>

  return (
    <Modulo icone={Megaphone} titulo="Panorama de todos os clientes" descricao={`Meta (conta inteira) e Google Ads · ${rotuloPeriodo(periodo)}`} acoes={seletor}>
      <div className="space-y-4">
        <Numeros
          itens={[
            { rotulo: 'Total investido', valor: reais.format(totalMeta + totalGoogle), icone: Wallet, cor: '#2a78d6' },
            { rotulo: 'Meta', valor: reais.format(totalMeta), icone: Megaphone, cor: '#0866ff' },
            { rotulo: 'Google Ads', valor: reais.format(totalGoogle), icone: Search, cor: '#eb6834' },
            { rotulo: 'Clientes investindo', valor: `${investindo.length} de ${linhas.length}`, tom: linhas.length && investindo.length < linhas.length ? 'atencao' : undefined, extra: linhas.length && investindo.length < linhas.length ? `${linhas.length - investindo.length} sem investimento` : undefined, icone: Users, cor: '#6250d6' },
            { rotulo: 'Cliques', valor: numero.format(cliques), icone: MousePointerClick, cor: '#e87ba4' },
            { rotulo: 'Média por cliente', valor: investindo.length ? reais.format((totalMeta + totalGoogle) / investindo.length) : '—', icone: Calculator, cor: '#1baf7a' },
          ]}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <GraficoDiario
            titulo="Investimento por dia, todos os clientes"
            dias={dias}
            series={[
              { nome: 'Meta', valores: dias.map((d) => linhas.reduce((s, l) => s + (valor(l.meta)?.porDia.get(d) ?? 0), 0)) },
              { nome: 'Google Ads', valores: dias.map((d) => linhas.reduce((s, l) => s + (valor(l.google)?.porDia.get(d) ?? 0), 0)) },
            ]}
            formato={(n) => reaisCurto.format(n)}
          />
          <div>
            <p className="mb-1 text-legenda font-semibold text-texto">Quem mais investe</p>
            <ul className="space-y-1.5">
              {ordenadas.slice(0, 8).map((l) => {
                const m = valor(l.meta)?.gasto ?? 0
                const g = valor(l.google)?.custo ?? 0
                const maior = Math.max(1, ...ordenadas.map((x) => (valor(x.meta)?.gasto ?? 0) + (valor(x.google)?.custo ?? 0)))
                return (
                  <li key={l.id} className="text-rotulo">
                    <div className="flex justify-between gap-2"><NomeCliente nome={l.nome} className="truncate" /><span className="tabular-nums text-texto-2">{reais.format(m + g)}</span></div>
                    <div className="mt-0.5 flex h-2 gap-0.5" title={`Meta ${reais.format(m)} · Google ${reais.format(g)}`}>
                      {m > 0 && <span className="rounded-sm" style={{ width: `${(m / maior) * 100}%`, background: CORES_SERIE[0] }} />}
                      {g > 0 && <span className="rounded-sm" style={{ width: `${(g / maior) * 100}%`, background: CORES_SERIE[1] }} />}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        {linhas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-borda py-10 text-center text-corpo text-texto-3">Nenhum cliente com conta de anúncios no cadastro. Preencha a conta do Meta e/ou do Google Ads na página do cliente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-rotulo">
              <thead>
                <tr className="border-b border-borda text-left text-legenda text-texto-3">
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
                    <tr key={l.id} className="border-b border-borda/60 last:border-0">
                      <td className="py-2 pr-3"><NomeCliente nome={l.nome} href={`/anuncios?cliente=${l.id}${consultaPeriodo(periodo) ? `&${consultaPeriodo(periodo)}` : ''}`} /></td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m ? reais.format(m.gasto) : l.meta ? erro(l.meta as Erro) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m ? numero.format(m.cliques) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m ? <span className="inline-flex items-center justify-end gap-1.5">{pct(m.ctr)} {tomCtrMeta(m.ctr) !== 'neutro' && <SeloTom tom={tomCtrMeta(m.ctr)} />}</span> : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{g ? reais.format(g.custo) : l.google ? erro(l.google as Erro) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{g ? numero.format(g.cliques) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{g ? <span className={g.conversoes > 0 ? 'font-semibold text-sucesso-forte' : g.custo > 0 ? 'font-semibold text-perigo-forte' : ''}>{g.conversoes > 0 ? '▲ ' : g.custo > 0 ? '▼ ' : ''}{g.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</span> : vazio}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{reais.format((m?.gasto ?? 0) + (g?.custo ?? 0))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-legenda text-texto-3">Clique no cliente (ou escolha no seletor acima) para ver tudo o que ele roda, com insights e recomendações. Passe o mouse em &quot;erro&quot; para ver o motivo.</p>
      </div>
    </Modulo>
  )
}
