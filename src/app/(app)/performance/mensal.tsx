import { BadgeDollarSign, CalendarRange, Camera, ClipboardList, MessageCircle, MousePointerClick, ShoppingBag, Target, TrendingUp, UserCheck, Wallet } from 'lucide-react'
import { Numeros, type Numero } from '@/componentes/insights/BlocoAnalise'
import { GraficoDiario } from '@/componentes/insights/GraficoDiario'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { tomVariacao } from '@/dominio/insights'
import { indicadores, mesAnterior, mesesAte, rotuloMesCurto, rotuloMesLongo } from '@/dominio/performance'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { botaoSecundario, campo } from '@/lib/ui'
import type { Cliente } from '@/servicos/clientes-plataforma'
import { situacaoGoogle } from '@/servicos/google-agencia'
import { historicoDoCliente, investido, leadsPagos, linkBioDoCliente, type MesPerformance } from '@/servicos/performance'
import { LancarMes } from './Formularios'

const reais = (n: number | null) => (n === null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: n >= 1000 ? 0 : 2 }))
const inteiro = (n: number | null) => (n === null ? '—' : Math.round(n).toLocaleString('pt-BR'))
const vezes = (n: number | null) => (n === null ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x`)
const pct = (n: number | null) => (n === null ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`)

export const numerosDe = (m: MesPerformance) => indicadores({ investido: investido(m), leadsPagos: leadsPagos(m), leadsOrganicos: m.leadsOrganicos, faturamento: m.faturamento, vendas: m.vendas })

export function kpis(m: MesPerformance, ant: MesPerformance | null): Numero[] {
  const i = numerosDe(m)
  const variacao = (a: number, b: number | undefined) => (b === undefined || !b ? undefined : ((a - b) / b) * 100)
  const vInv = variacao(investido(m), ant ? investido(ant) : undefined)
  const vMeta = variacao(m.investidoMeta, ant?.investidoMeta)
  const vGoogle = variacao(m.investidoGoogle, ant?.investidoGoogle)
  const vLeads = variacao(i.leads, ant ? numerosDe(ant).leads : undefined)
  const vFat = m.faturamento === null ? undefined : variacao(m.faturamento, ant?.faturamento ?? undefined)
  const seta = (v: number | undefined) => (v === undefined ? undefined : `${v >= 0 ? '▲ +' : '▼ '}${pct(v)} vs mês anterior`)
  return [
    { rotulo: 'Investido total (Meta + Google)', valor: reais(investido(m)), extra: [seta(vInv), `Meta ${reais(m.investidoMeta)} · Google ${reais(m.investidoGoogle)}`].filter(Boolean).join(' · '), icone: Wallet, cor: '#2a78d6' },
    { rotulo: 'Investido na Meta', valor: reais(m.investidoMeta), extra: seta(vMeta), icone: Wallet, cor: '#0866ff' },
    { rotulo: 'Investido no Google Ads', valor: reais(m.investidoGoogle), extra: seta(vGoogle), icone: Wallet, cor: '#eb6834' },
    { rotulo: 'Leads (pagos + orgânicos)', valor: inteiro(i.leads), extra: seta(vLeads), tom: vLeads === undefined ? undefined : tomVariacao(vLeads), rotuloTom: vLeads !== undefined && vLeads >= 0 ? 'Subindo' : 'Caindo', icone: Target, cor: '#6250d6' },
    { rotulo: 'Custo por lead', valor: reais(i.cpl), extra: 'só leads pagos', icone: ClipboardList, cor: '#eb6834' },
    { rotulo: 'Faturamento', valor: reais(m.faturamento), extra: m.faturamento === null ? 'não lançado' : seta(vFat), tom: vFat === undefined ? undefined : tomVariacao(vFat), rotuloTom: vFat !== undefined && vFat >= 0 ? 'Subindo' : 'Caindo', icone: BadgeDollarSign, cor: '#1baf7a' },
    { rotulo: 'ROAS', valor: vezes(i.roas), extra: 'faturamento ÷ investido', tom: i.roas === null ? undefined : i.roas >= 3 ? 'bom' : i.roas >= 1 ? 'atencao' : 'ruim', rotuloTom: i.roas === null ? undefined : i.roas >= 3 ? 'Saudável' : i.roas >= 1 ? 'Apertado' : 'Prejuízo', icone: TrendingUp, cor: '#eda100' },
    { rotulo: 'Vendas (opcional)', valor: inteiro(m.vendas), extra: i.conversao === null ? (m.vendas === null ? 'não informado' : undefined) : `${pct(i.conversao)} dos leads · ticket ${reais(i.ticketMedio)}`, icone: ShoppingBag, cor: '#e87ba4' },
  ]
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
export function TabelaMeses({ linhas, total }: { linhas: { chave: string; rotulo: React.ReactNode; m: MesPerformance }[]; total?: MesPerformance }) {
  const linha = (rotulo: React.ReactNode, m: MesPerformance, chave: string, forte = false) => {
    const i = numerosDe(m)
    return (
      <tr key={chave} className={`border-b border-borda/60 last:border-0 ${forte ? 'bg-fundo font-bold' : ''}`}>
        <td className="py-2 pr-3">{rotulo}</td>
        <td className="py-2 pr-3 text-right font-semibold tabular-nums">{reais(investido(m))}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{reais(m.investidoMeta)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{reais(m.investidoGoogle)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{inteiro(leadsPagos(m))}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{m.cliquesPerfilInstagram === null ? '—' : inteiro(m.cliquesPerfilInstagram)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{inteiro(m.cliquesLinkBio)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{inteiro(m.leadsOrganicos)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{reais(i.cpl)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{reais(m.faturamento)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{inteiro(m.vendas)}</td>
        <td className={`py-2 text-right font-semibold tabular-nums ${i.roas === null ? 'text-texto-3' : i.roas >= 3 ? 'text-sucesso' : i.roas >= 1 ? 'text-aviso-forte' : 'text-perigo'}`}>{vezes(i.roas)}</td>
      </tr>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[64rem] text-rotulo">
        <thead>
          <tr className="border-b border-borda text-left text-legenda text-texto-3">
            <th className="py-2 pr-3 font-medium" />
            <th className="py-2 pr-3 text-right font-medium">Investido total</th>
            <th className="py-2 pr-3 text-right font-medium">Meta</th>
            <th className="py-2 pr-3 text-right font-medium">Google</th>
            <th className="py-2 pr-3 text-right font-medium">Leads pagos</th>
            <th className="py-2 pr-3 text-right font-medium">Cliques perfil IG</th>
            <th className="py-2 pr-3 text-right font-medium">Cliques na bio</th>
            <th className="py-2 pr-3 text-right font-medium">Leads orgânicos</th>
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

export async function PanoramaMensal({ clientes, mes, hoje, acoes }: { clientes: Cliente[]; mes: string; hoje: string; acoes?: React.ReactNode }) {
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
    leadsOrganicos: somaN((m) => m.leadsOrganicos) ?? 0,
    faturamento: somaN((m) => m.faturamento),
    vendas: somaN((m) => m.vendas),
    notas: '',
  }
  const ativos = linhas
    .filter(({ h: { meses: [m] } }) => investido(m) || leadsPagos(m) || m.faturamento !== null || m.cliquesLinkBio || m.leadsOrganicos || m.cliquesPerfilInstagram)
    .sort((a, b) => investido(b.h.meses[0]) - investido(a.h.meses[0]))
  const semLancar = linhas.filter((l) => investido(l.h.meses[0]) > 0 && l.h.meses[0].faturamento === null)
  const erros = linhas.flatMap((l) => l.h.erros.map((e) => ({ c: l.c, e })))
  const q = `mes=${mes}`
  return (
    <Modulo icone={TrendingUp} titulo={`Panorama de ${rotuloMesLongo(mes)}`} descricao="Todos os clientes · leads, investimento e faturamento do mês" acoes={acoes}>
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

/** Escolhe o mês (resultados e lançamentos são mensais); mantém cliente, aba e período. */
export function SeletorMes({ mes, hoje, ocultos }: { mes: string; hoje: string; ocultos: Record<string, string> }) {
  return (
    <form action="/performance" className="flex items-center gap-2">
      {Object.entries(ocultos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input type="month" name="mes" defaultValue={mes} max={hoje.slice(0, 7)} className={`${campo} h-9 w-40`} aria-label="Mês" />
      <button type="submit" className={`${botaoSecundario} h-9`}>Ver</button>
    </form>
  )
}

/** Resultado de um mês de um cliente: investimento (Meta, Google e total), leads, faturamento, ROAS e de onde vêm os leads. */
export async function ResultadoDoMes({ cliente, mes, hoje, acoes }: { cliente: Cliente; mes: string; hoje: string; acoes?: React.ReactNode }) {
  const sb = await criarClienteServidor()
  const [google, bio] = await Promise.all([situacaoGoogle(), linkBioDoCliente(sb, cliente.id)])
  const h = await historicoDoCliente(sb, cliente, mesesAte(mes, 2), hoje, google.conectado)
  const atual = h.meses[h.meses.length - 1]
  const ant = h.meses.find((m) => m.mes === mesAnterior(mes)) ?? null
  return (
    <>
      {h.erros.length > 0 && <div className="space-y-1 rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">{h.erros.map((e) => <p key={e}>{e}</p>)}</div>}
      <Modulo icone={TrendingUp} titulo={`Resultado de ${rotuloMesLongo(mes)}`} descricao={<><NomeCliente nome={cliente.nome} href={`/clientes/${cliente.id}`} /> · anúncios da Meta e do Google, orgânico e o faturamento lançado</>} acoes={acoes}>
        <div className="space-y-4">
          <Numeros itens={kpis(atual, ant)} />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Fonte icone={ClipboardList} cor="#2a78d6" rotulo="Formulários instantâneos (Meta)" valor={inteiro(atual.formularios)} extra={atual.leadsSite ? `+ ${inteiro(atual.leadsSite)} leads do site` : undefined} />
            <Fonte icone={MessageCircle} cor="#1baf7a" rotulo="Conversas WhatsApp/Direct (Meta)" valor={inteiro(atual.conversas)} />
            <Fonte icone={Target} cor="#eb6834" rotulo="Conversões (Google Ads)" valor={cliente.googleAdsId ? inteiro(atual.conversoesGoogle) : 'sem conta'} />
            <Fonte icone={Camera} cor="#e1306c" rotulo="Toques nos botões de contato do perfil (Instagram)" valor={atual.cliquesPerfilInstagram === null ? (cliente.metaPaginaId ? 'Meta não entregou' : 'sem Página') : inteiro(atual.cliquesPerfilInstagram)} />
            <Fonte icone={MousePointerClick} cor="#6250d6" rotulo="Cliques no link da bio" valor={bio?.slug ? inteiro(atual.cliquesLinkBio) : 'sem página da bio'} />
            <Fonte icone={UserCheck} cor="#eb6834" rotulo="Leads orgânicos (quiz da bio)" valor={bio?.slug ? inteiro(atual.leadsOrganicos) : 'sem página da bio'} extra={bio?.slug && atual.cliquesLinkBio ? `${pct((atual.leadsOrganicos / atual.cliquesLinkBio) * 100)} dos cliques` : undefined} />
            <Fonte icone={Wallet} cor="#0866ff" rotulo="Investido na Meta" valor={reais(atual.investidoMeta)} />
            <Fonte icone={Wallet} cor="#eb6834" rotulo="Investido no Google Ads" valor={reais(atual.investidoGoogle)} />
            <Fonte icone={Wallet} cor="#2a78d6" rotulo="Investido total" valor={reais(investido(atual))} />
            <Fonte icone={BadgeDollarSign} cor="#eda100" rotulo="Custo por venda" valor={reais(numerosDe(atual).custoPorVenda)} />
          </div>
        </div>
      </Modulo>
    </>
  )
}

/** Últimos 12 meses de um cliente: gráficos e a tabela mês a mês. */
export async function EvolucaoCliente({ cliente, mes, hoje, acoes }: { cliente: Cliente; mes: string; hoje: string; acoes?: React.ReactNode }) {
  const sb = await criarClienteServidor()
  const google = await situacaoGoogle()
  const meses = mesesAte(mes, 12)
  const h = await historicoDoCliente(sb, cliente, meses, hoje, google.conectado)
  const comDados = h.meses.filter((m) => investido(m) || leadsPagos(m) || m.faturamento !== null || m.cliquesLinkBio)
  return (
    <Modulo icone={CalendarRange} titulo="Mês a mês" descricao={<><NomeCliente nome={cliente.nome} href={`/clientes/${cliente.id}`} /> · últimos 12 meses até {rotuloMesLongo(mes)}</>} acoes={acoes}>
      {h.erros.length > 0 && <div className="mb-3 space-y-1 rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">{h.erros.map((e) => <p key={e}>{e}</p>)}</div>}
      {comDados.length === 0 ? (
        <p className="py-6 text-center text-rotulo text-texto-3">Ainda sem dados nos últimos 12 meses.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <GraficoDiario titulo="Investido x faturamento" dias={meses} rotulo={rotuloMesCurto} formato={(n) => reais(n)} series={[{ nome: 'Investido total', valores: h.meses.map(investido) }, { nome: 'Faturamento', valores: h.meses.map((m) => m.faturamento ?? 0) }]} />
            <GraficoDiario titulo="Investido por plataforma" dias={meses} rotulo={rotuloMesCurto} formato={(n) => reais(n)} series={[{ nome: 'Meta', valores: h.meses.map((m) => m.investidoMeta) }, { nome: 'Google Ads', valores: h.meses.map((m) => m.investidoGoogle) }]} />
            <GraficoDiario titulo="Leads por mês" dias={meses} rotulo={rotuloMesCurto} tipo="barras" formato={(n) => inteiro(n)} series={[{ nome: 'Leads', valores: h.meses.map((m) => numerosDe(m).leads) }]} />
          </div>
          <TabelaMeses linhas={[...h.meses].reverse().map((m) => ({ chave: m.mes, rotulo: <span className="capitalize">{rotuloMesLongo(m.mes)}</span>, m }))} />
        </div>
      )}
    </Modulo>
  )
}

/** O que a equipe lança: faturamento e vendas do mês. A página da bio, o quiz e o resto da captação ficam no Biolytics. */
export async function LancamentosCliente({ cliente, mes, hoje, acoes }: { cliente: Cliente; mes: string; hoje: string; acoes?: React.ReactNode }) {
  const sb = await criarClienteServidor()
  const google = await situacaoGoogle()
  const h = await historicoDoCliente(sb, cliente, [mes], hoje, google.conectado)
  const atual = h.meses[0]
  return (
    <Modulo icone={BadgeDollarSign} titulo="Lançar o mês" descricao={`Faturamento (obrigatório) e vendas (opcional) de ${rotuloMesLongo(mes)} · só a equipe vê`} acoes={acoes}>
      <LancarMes key={mes} clienteId={cliente.id} mes={mes} faturamento={atual.faturamento} vendas={atual.vendas} notas={atual.notas} />
    </Modulo>
  )
}
