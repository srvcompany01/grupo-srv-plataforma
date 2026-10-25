import { BadgeDollarSign, CalendarRange, Camera, ClipboardList, Link2, MessageCircle, MousePointerClick, ShoppingBag, Target, TrendingUp, UserCheck, Wallet } from 'lucide-react'
import { Suspense } from 'react'
import { Numeros, type Numero } from '@/componentes/insights/BlocoAnalise'
import { GraficoDiario } from '@/componentes/insights/GraficoDiario'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { dataDeHoje } from '@/dominio/filtros'
import { tomVariacao } from '@/dominio/insights'
import { indicadores, intervaloDoMes, lerMes, mesAnterior, mesesAte, rotuloMesCurto, rotuloMesLongo } from '@/dominio/performance'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { botaoSecundario, campo } from '@/lib/ui'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { situacaoGoogle } from '@/servicos/google-agencia'
import { urlDaBio } from '@/dominio/bio'
import { urlLeitura } from '@/infra/r2'
import { paginaBioDoCliente, resumoDaBio } from '@/servicos/bio'
import { historicoDoCliente, investido, leadsConfirmadosDoMes, leadsPagos, linkBioDoCliente, type MesPerformance } from '@/servicos/performance'
import { ConfirmarLead, LancarMes, LinkBio, RemoverLead } from './Formularios'

export const maxDuration = 120

const reais = (n: number | null) => (n === null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: n >= 1000 ? 0 : 2 }))
const inteiro = (n: number | null) => (n === null ? '—' : Math.round(n).toLocaleString('pt-BR'))
const vezes = (n: number | null) => (n === null ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x`)
const pct = (n: number | null) => (n === null ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`)

const numerosDe = (m: MesPerformance) => indicadores({ investido: investido(m), leadsPagos: leadsPagos(m), leadsOrganicos: m.leadsConfirmados, faturamento: m.faturamento, vendas: m.vendas })

/** Performance e resultados: panorama de todos os clientes no mês ou, com ?cliente=, o mês a mês de um cliente. */
export default async function Performance({ searchParams }: PageProps<'/performance'>) {
  await exigirEquipe()
  const sp = await searchParams
  const hoje = dataDeHoje(new Date())
  const mes = lerMes(sp.mes, hoje)
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
  const escolhido = clientes.find((c) => c.id === sp.cliente) ?? null

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Resultados</p>
          <h1 className="page-title mt-1">Performance</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SeletorCliente base="/performance" clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={`mes=${mes}`} />
          <form action="/performance" className="flex items-center gap-2">
            {escolhido && <input type="hidden" name="cliente" value={escolhido.id} />}
            <input type="month" name="mes" defaultValue={mes} max={hoje.slice(0, 7)} className={`${campo} h-9 w-40`} aria-label="Mês" />
            <button type="submit" className={`${botaoSecundario} h-9`}>Ver</button>
          </form>
        </div>
      </div>

      <Suspense key={`${escolhido?.id}-${mes}`} fallback={<Modulo icone={TrendingUp} titulo="Performance" descricao="Buscando na Meta e no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando…</p></Modulo>}>
        {escolhido ? <PorCliente cliente={escolhido} mes={mes} hoje={hoje} /> : <Panorama clientes={clientes} mes={mes} hoje={hoje} />}
      </Suspense>
    </div>
  )
}

function kpis(m: MesPerformance, ant: MesPerformance | null): Numero[] {
  const i = numerosDe(m)
  const variacao = (a: number, b: number | undefined) => (b === undefined || !b ? undefined : ((a - b) / b) * 100)
  const vInv = variacao(investido(m), ant ? investido(ant) : undefined)
  const vLeads = variacao(i.leads, ant ? numerosDe(ant).leads : undefined)
  const vFat = m.faturamento === null ? undefined : variacao(m.faturamento, ant?.faturamento ?? undefined)
  const seta = (v: number | undefined) => (v === undefined ? undefined : `${v >= 0 ? '▲ +' : '▼ '}${pct(v)} vs mês anterior`)
  return [
    { rotulo: 'Investido em anúncios', valor: reais(investido(m)), extra: seta(vInv), icone: Wallet, cor: '#2a78d6' },
    { rotulo: 'Leads (pagos + bio)', valor: inteiro(i.leads), extra: seta(vLeads), tom: vLeads === undefined ? undefined : tomVariacao(vLeads), rotuloTom: vLeads !== undefined && vLeads >= 0 ? 'Subindo' : 'Caindo', icone: Target, cor: '#6250d6' },
    { rotulo: 'Custo por lead', valor: reais(i.cpl), extra: 'só leads pagos', icone: ClipboardList, cor: '#eb6834' },
    { rotulo: 'Faturamento', valor: reais(m.faturamento), extra: m.faturamento === null ? 'não lançado' : seta(vFat), tom: vFat === undefined ? undefined : tomVariacao(vFat), rotuloTom: vFat !== undefined && vFat >= 0 ? 'Subindo' : 'Caindo', icone: BadgeDollarSign, cor: '#1baf7a' },
    { rotulo: 'ROAS', valor: vezes(i.roas), extra: 'faturamento ÷ investido', tom: i.roas === null ? undefined : i.roas >= 3 ? 'bom' : i.roas >= 1 ? 'atencao' : 'ruim', rotuloTom: i.roas === null ? undefined : i.roas >= 3 ? 'Saudável' : i.roas >= 1 ? 'Apertado' : 'Prejuízo', icone: TrendingUp, cor: '#eda100' },
    { rotulo: 'Vendas', valor: inteiro(m.vendas), extra: i.conversao === null ? undefined : `${pct(i.conversao)} dos leads · ticket ${reais(i.ticketMedio)}`, icone: ShoppingBag, cor: '#e87ba4' },
  ]
}

async function PorCliente({ cliente, mes, hoje }: { cliente: Cliente; mes: string; hoje: string }) {
  const sb = await criarClienteServidor()
  const meses = mesesAte(mes, 12)
  const [google, bio, leads, paginaBio] = await Promise.all([situacaoGoogle(), linkBioDoCliente(sb, cliente.id), leadsConfirmadosDoMes(sb, cliente.id, mes, hoje), paginaBioDoCliente(sb, cliente.id)])
  const intervaloMes = intervaloDoMes(mes, hoje)
  const [resumoBio, logoBio] = await Promise.all([resumoDaBio(sb, cliente.id, intervaloMes.de, intervaloMes.ate), paginaBio.logo ? urlLeitura(paginaBio.logo).catch(() => null) : null])
  const h = await historicoDoCliente(sb, cliente, meses, hoje, google.conectado)
  const atual = h.meses[h.meses.length - 1]
  const ant = h.meses.find((m) => m.mes === mesAnterior(mes)) ?? null
  const comDados = h.meses.filter((m) => investido(m) || leadsPagos(m) || m.faturamento !== null || m.cliquesLinkBio)
  return (
    <>
      {h.erros.length > 0 && <div className="space-y-1 rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">{h.erros.map((e) => <p key={e}>{e}</p>)}</div>}

      <Modulo icone={TrendingUp} titulo={`Resultado de ${rotuloMesLongo(mes)}`} descricao={<><NomeCliente nome={cliente.nome} href={`/clientes/${cliente.id}`} /> · anúncios da Meta e do Google, orgânico do Instagram e o que a equipe lançou</>}>
        <div className="space-y-4">
          <Numeros itens={kpis(atual, ant)} />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Fonte icone={ClipboardList} cor="#2a78d6" rotulo="Formulários instantâneos (Meta)" valor={inteiro(atual.formularios)} extra={atual.leadsSite ? `+ ${inteiro(atual.leadsSite)} leads do site` : undefined} />
            <Fonte icone={MessageCircle} cor="#1baf7a" rotulo="Conversas WhatsApp/Direct (Meta)" valor={inteiro(atual.conversas)} />
            <Fonte icone={Target} cor="#eb6834" rotulo="Conversões (Google Ads)" valor={cliente.googleAdsId ? inteiro(atual.conversoesGoogle) : 'sem conta'} />
            <Fonte icone={Camera} cor="#e1306c" rotulo="Toques nos botões de contato do perfil (Instagram)" valor={atual.cliquesPerfilInstagram === null ? (cliente.metaPaginaId ? 'Meta não entregou' : 'sem Página') : inteiro(atual.cliquesPerfilInstagram)} />
            <Fonte icone={MousePointerClick} cor="#6250d6" rotulo="Cliques no link da bio (plataforma)" valor={inteiro(atual.cliquesLinkBio)} />
            <Fonte icone={UserCheck} cor="#1baf7a" rotulo="Leads confirmados da bio" valor={inteiro(atual.leadsConfirmados)} extra={atual.cliquesLinkBio ? `${pct((atual.leadsConfirmados / atual.cliquesLinkBio) * 100)} dos cliques` : undefined} />
            <Fonte icone={Wallet} cor="#2a78d6" rotulo="Investido Meta / Google" valor={`${reais(atual.investidoMeta)} / ${reais(atual.investidoGoogle)}`} />
            <Fonte icone={BadgeDollarSign} cor="#eda100" rotulo="Custo por venda" valor={reais(numerosDe(atual).custoPorVenda)} />
          </div>
        </div>
      </Modulo>

      <div className="grid gap-4 lg:grid-cols-2">
        <Modulo icone={BadgeDollarSign} titulo="Lançar o mês" descricao={`Faturamento e vendas de ${rotuloMesLongo(mes)} (só a equipe vê)`}>
          <LancarMes key={mes} clienteId={cliente.id} mes={mes} faturamento={atual.faturamento} vendas={atual.vendas} notas={atual.notas} />
        </Modulo>
        <Modulo icone={Link2} titulo="Link da bio" descricao="Página simples com a logo do cliente e os botões dele (sem a marca da agência): cada visita e cada toque são contados">
          <LinkBio
            clienteId={cliente.id}
            url={bio?.slug ? urlDaBio(bio.slug) : null}
            urls={bio?.slug ? [{ rotulo: 'Link da bio', url: urlDaBio(bio.slug) }, { rotulo: 'Stories', url: urlDaBio(bio.slug, 'story') }, { rotulo: 'Anúncios', url: urlDaBio(bio.slug, 'anuncio') }] : []}
            mensagem={bio?.mensagem ?? 'Olá! Vim pelo Instagram 😊'}
            whatsapp={bio?.whatsapp ?? null}
            logo={logoBio}
            links={paginaBio.links}
            resumo={resumoBio}
          />
        </Modulo>
      </div>

      <Modulo icone={UserCheck} titulo="Leads da bio confirmados" descricao={`Quando chegar no WhatsApp uma conversa com a mensagem da bio, confirme aqui · ${rotuloMesLongo(mes)}`}>
        <div className="space-y-3">
          <ConfirmarLead clienteId={cliente.id} hoje={hoje} />
          {leads.length === 0 ? (
            <p className="py-3 text-center text-rotulo text-texto-3">Nenhum lead confirmado neste mês.</p>
          ) : (
            <ul className="divide-y divide-borda/60 rounded-lg border border-borda">
              {leads.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-3 py-2 text-rotulo">
                  <span className="w-14 shrink-0 tabular-nums text-texto-3">{l.dia.slice(8, 10)}/{l.dia.slice(5, 7)}</span>
                  <span className="min-w-0 flex-1 truncate text-texto">{l.observacao || 'Lead da bio'}</span>
                  {l.por && <span className="hidden text-legenda text-texto-3 sm:inline">por {l.por}</span>}
                  <RemoverLead id={l.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modulo>

      <Modulo icone={CalendarRange} titulo="Mês a mês" descricao="Últimos 12 meses">
        {comDados.length === 0 ? (
          <p className="py-6 text-center text-rotulo text-texto-3">Ainda sem dados nos últimos 12 meses.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <GraficoDiario titulo="Investido x faturamento" dias={meses} rotulo={rotuloMesCurto} formato={(n) => reais(n)} series={[{ nome: 'Investido', valores: h.meses.map(investido) }, { nome: 'Faturamento', valores: h.meses.map((m) => m.faturamento ?? 0) }]} />
              <GraficoDiario titulo="Leads por mês" dias={meses} rotulo={rotuloMesCurto} tipo="barras" formato={(n) => inteiro(n)} series={[{ nome: 'Leads', valores: h.meses.map((m) => numerosDe(m).leads) }]} />
            </div>
            <TabelaMeses linhas={[...h.meses].reverse().map((m) => ({ chave: m.mes, rotulo: <span className="capitalize">{rotuloMesLongo(m.mes)}</span>, m }))} />
          </div>
        )}
      </Modulo>
    </>
  )
}

function Fonte({ icone: Icone, cor, rotulo, valor, extra }: { icone: typeof Wallet; cor: string; rotulo: string; valor: string; extra?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-borda bg-white px-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${cor}1f`, color: cor }}><Icone className="h-3.5 w-3.5" /></span>
      <div className="min-w-0">
        <p className="truncate text-micro text-texto-3">{rotulo}</p>
        <p className="text-rotulo font-bold tabular-nums text-texto">{valor}{extra && <span className="ml-1.5 text-micro font-normal text-texto-3">{extra}</span>}</p>
      </div>
    </div>
  )
}

/** Tabela de meses (por cliente) ou de clientes (panorama): mesmas colunas. */
function TabelaMeses({ linhas, total }: { linhas: { chave: string; rotulo: React.ReactNode; m: MesPerformance }[]; total?: MesPerformance }) {
  const linha = (rotulo: React.ReactNode, m: MesPerformance, chave: string, forte = false) => {
    const i = numerosDe(m)
    return (
      <tr key={chave} className={`border-b border-borda/60 last:border-0 ${forte ? 'bg-fundo font-bold' : ''}`}>
        <td className="py-2 pr-3">{rotulo}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{reais(investido(m))}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{inteiro(leadsPagos(m))}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{m.cliquesPerfilInstagram === null ? '—' : inteiro(m.cliquesPerfilInstagram)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{inteiro(m.cliquesLinkBio)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{inteiro(m.leadsConfirmados)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{reais(i.cpl)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{reais(m.faturamento)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{inteiro(m.vendas)}</td>
        <td className={`py-2 text-right font-semibold tabular-nums ${i.roas === null ? 'text-texto-3' : i.roas >= 3 ? 'text-sucesso' : i.roas >= 1 ? 'text-aviso-forte' : 'text-perigo'}`}>{vezes(i.roas)}</td>
      </tr>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] text-rotulo">
        <thead>
          <tr className="border-b border-borda text-left text-legenda text-texto-3">
            <th className="py-2 pr-3 font-medium" />
            <th className="py-2 pr-3 text-right font-medium">Investido</th>
            <th className="py-2 pr-3 text-right font-medium">Leads pagos</th>
            <th className="py-2 pr-3 text-right font-medium">Cliques perfil IG</th>
            <th className="py-2 pr-3 text-right font-medium">Cliques bio</th>
            <th className="py-2 pr-3 text-right font-medium">Leads bio</th>
            <th className="py-2 pr-3 text-right font-medium">CPL</th>
            <th className="py-2 pr-3 text-right font-medium">Faturamento</th>
            <th className="py-2 pr-3 text-right font-medium">Vendas</th>
            <th className="py-2 text-right font-medium">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => linha(l.rotulo, l.m, l.chave))}
          {total && linha('Total', total, 'total', true)}
        </tbody>
      </table>
    </div>
  )
}

async function Panorama({ clientes, mes, hoje }: { clientes: Cliente[]; mes: string; hoje: string }) {
  const sb = await criarClienteServidor()
  const google = await situacaoGoogle()
  const linhas = await Promise.all(clientes.map(async (c) => ({ c, h: await historicoDoCliente(sb, c, [mes], hoje, google.conectado) })))
  const somaN = (f: (m: MesPerformance) => number | null) => {
    const v = linhas.map((l) => f(l.h.meses[0])).filter((x): x is number => x !== null)
    return v.length ? v.reduce((a, b) => a + b, 0) : null
  }
  const total: MesPerformance = {
    mes,
    investidoMeta: somaN((m) => m.investidoMeta) ?? 0,
    investidoMetaMarca: somaN((m) => m.investidoMetaMarca) ?? 0,
    investidoGoogle: somaN((m) => m.investidoGoogle) ?? 0,
    formularios: somaN((m) => m.formularios) ?? 0,
    leadsNaMeta: somaN((m) => m.leadsNaMeta) ?? 0,
    leadsSite: somaN((m) => m.leadsSite) ?? 0,
    conversas: somaN((m) => m.conversas) ?? 0,
    conversoesGoogle: somaN((m) => m.conversoesGoogle) ?? 0,
    cliquesPerfilInstagram: somaN((m) => m.cliquesPerfilInstagram),
    cliquesLinkBio: somaN((m) => m.cliquesLinkBio) ?? 0,
    leadsConfirmados: somaN((m) => m.leadsConfirmados) ?? 0,
    faturamento: somaN((m) => m.faturamento),
    vendas: somaN((m) => m.vendas),
    notas: '',
  }
  const ativos = linhas
    .filter(({ h: { meses: [m] } }) => investido(m) || leadsPagos(m) || m.faturamento !== null || m.cliquesLinkBio || m.leadsConfirmados || m.cliquesPerfilInstagram)
    .sort((a, b) => investido(b.h.meses[0]) - investido(a.h.meses[0]))
  const semLancar = linhas.filter((l) => investido(l.h.meses[0]) > 0 && l.h.meses[0].faturamento === null)
  const erros = linhas.flatMap((l) => l.h.erros.map((e) => ({ c: l.c, e })))
  const q = `mes=${mes}`
  return (
    <Modulo icone={TrendingUp} titulo={`Panorama de ${rotuloMesLongo(mes)}`} descricao="Todos os clientes · leads, investimento e faturamento do mês">
      <div className="space-y-4">
        <Numeros itens={kpis(total, null)} />
        {semLancar.length > 0 && (
          <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">
            Faturamento não lançado de {semLancar.length} cliente(s) com anúncios: {semLancar.map((l, i) => <span key={l.c.id}>{i > 0 && ', '}<NomeCliente nome={l.c.nome} href={`/performance?cliente=${l.c.id}&${q}`} /></span>)}. Sem ele, o ROAS do mês fica incompleto.
          </p>
        )}
        {ativos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borda py-10 text-center text-corpo text-texto-3">Nenhum cliente com anúncios, cliques ou faturamento neste mês.</p>
        ) : (
          <TabelaMeses linhas={ativos.map(({ c, h }) => ({ chave: c.id, rotulo: <NomeCliente nome={c.nome} href={`/performance?cliente=${c.id}&${q}`} />, m: h.meses[0] }))} total={total} />
        )}
        {erros.length > 0 && (
          <details className="text-legenda text-texto-3">
            <summary className="cursor-pointer">{erros.length} aviso(s) ao buscar os dados</summary>
            <ul className="mt-1 space-y-0.5">{erros.map(({ c, e }) => <li key={`${c.id}${e}`}><NomeCliente nome={c.nome} />: {e}</li>)}</ul>
          </details>
        )}
      </div>
    </Modulo>
  )
}
