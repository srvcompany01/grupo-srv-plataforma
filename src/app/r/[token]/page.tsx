import { BadgeDollarSign, Camera, CheckCircle2, ExternalLink, Eye, Heart, Link2, MapPin, Megaphone, MessageCircle, MousePointerClick, ShoppingBag, Star, Target, TrendingUp, TriangleAlert, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { MapaGrade, Medidor } from '@/componentes/gmn/MapaGrade'
import { Marca } from '@/componentes/Marca'
import { fraseGeogrid } from '@/dominio/gmn'
import { separarSeguidores } from '@/dominio/insights'
import { SeguidoresDoPeriodo } from '@/componentes/insights/SeguidoresDoPeriodo'
import { GraficoDiario } from '@/componentes/insights/GraficoDiario'
import { leadsDoRelatorio, type AnunciosPlataforma, type RelatorioCompartilhado } from '@/dominio/relatorio-compartilhado'
import { ImprimirAoAbrir } from '@/componentes/relatorios/ImprimirAoAbrir'
import { relatorioPorToken } from '@/servicos/relatorio-compartilhado'

export const metadata: Metadata = { title: 'Relatório · Grupo SRV', robots: { index: false, follow: false } }

const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const data = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })

function Cartao({ icone: Icone, cor, rotulo, valor, extra }: { icone: typeof Eye; cor: string; rotulo: string; valor: string; extra?: string }) {
  return (
    <div className="rounded-xl border border-borda bg-white p-3">
      <p className="flex items-center gap-1.5 text-legenda text-texto-3"><span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `${cor}1f`, color: cor }}><Icone className="h-3.5 w-3.5" /></span>{rotulo}</p>
      <p className="mt-1 text-destaque font-bold tabular-nums text-texto">{valor}</p>
      {extra && <p className="text-legenda text-texto-3">{extra}</p>}
    </div>
  )
}

const mesLongo = (mes: string) => new Date(`${mes}-01T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const mesCurto = (mes: string) => new Date(`${mes}-01T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).replace('.', '')

/** O que a aba Performance mostra: resultado do mês (mês inteiro) com investimento, leads, faturamento e vendas, e os últimos 12 meses. */
function Resultados({ res }: { res: NonNullable<RelatorioCompartilhado['resultados']> }) {
  const a = res.atual
  const origens = [a.formularios ? `${num(a.formularios)} formulários` : '', a.conversas ? `${num(a.conversas)} conversas` : '', a.leadsSite ? `${num(a.leadsSite)} do site` : '', a.conversoesGoogle ? `${num(a.conversoesGoogle)} do Google` : '', a.leadsOrganicos ? `${num(a.leadsOrganicos)} orgânicos` : ''].filter(Boolean).join(' · ')
  const meses = res.meses.filter((m) => (m.investido ?? 0) > 0 || m.leads > 0 || m.faturamento !== null)
  const comInvestimento = meses.some((m) => m.investido !== null)
  const reaisCurto = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: v >= 1000 ? 0 : 2 })
  const dias = meses.map((m) => m.mes)
  return (
    <Secao titulo={`Resultado de ${mesLongo(res.mes)}`} icone={TrendingUp}>
      <p className="text-legenda text-texto-3">{res.emAndamento ? 'Mês em andamento: números até hoje. ' : ''}Mês inteiro (não só o período do relatório): anúncios da Meta e do Google, orgânico da bio e o faturamento informado pela equipe.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {a.investido !== null && <Cartao icone={BadgeDollarSign} cor="#2a78d6" rotulo="Investido total" valor={reais(a.investido)} extra={`Meta ${reais(a.investidoMeta ?? 0)} · Google ${reais(a.investidoGoogle ?? 0)}`} />}
        <Cartao icone={Users} cor="#1baf7a" rotulo="Leads (pagos + orgânicos)" valor={num(a.leads)} extra={origens || undefined} />
        {a.cpl !== null && <Cartao icone={Target} cor="#eb6834" rotulo="Custo por lead (pagos)" valor={reais(a.cpl)} />}
        {a.faturamento !== null && <Cartao icone={BadgeDollarSign} cor="#1baf7a" rotulo="Faturamento" valor={reais(a.faturamento)} />}
        {a.roas !== null && <Cartao icone={TrendingUp} cor="#eda100" rotulo="ROAS" valor={`${num(a.roas)}x`} extra="faturamento ÷ investido" />}
        {a.vendas !== null && <Cartao icone={ShoppingBag} cor="#e87ba4" rotulo="Vendas" valor={num(a.vendas)} extra={a.conversao !== null ? `${num(a.conversao)}% dos leads` : undefined} />}
        {a.custoPorVenda !== null && <Cartao icone={Target} cor="#6250d6" rotulo="Custo por venda" valor={reais(a.custoPorVenda)} />}
        {a.ticketMedio !== null && <Cartao icone={BadgeDollarSign} cor="#2a78d6" rotulo="Ticket médio" valor={reais(a.ticketMedio)} />}
        {a.cliquesPerfilInstagram !== null && <Cartao icone={Camera} cor="#e1306c" rotulo="Toques nos botões de contato do perfil" valor={num(a.cliquesPerfilInstagram)} extra="ligar, rota e e-mail do Instagram" />}
        {a.cliquesLinkBio > 0 && <Cartao icone={Link2} cor="#1baf7a" rotulo="Cliques no link da bio" valor={num(a.cliquesLinkBio)} />}
      </div>
      {meses.length > 1 && (
        <div className="space-y-3">
          <p className="text-rotulo font-semibold text-texto-2">Mês a mês</p>
          <div className="grid gap-3 md:grid-cols-2">
            {comInvestimento && <GraficoDiario titulo="Investido x faturamento" dias={dias} rotulo={mesCurto} formato={reaisCurto} series={[{ nome: 'Investido', valores: meses.map((m) => m.investido ?? 0) }, { nome: 'Faturamento', valores: meses.map((m) => m.faturamento ?? 0) }]} />}
            <GraficoDiario titulo="Leads por mês" dias={dias} rotulo={mesCurto} tipo="barras" formato={(v) => num(v)} series={[{ nome: 'Leads', valores: meses.map((m) => m.leads) }]} />
          </div>
          <div className="overflow-x-auto rounded-xl border border-borda bg-white">
            <table className="w-full min-w-[40rem] text-rotulo">
              <thead>
                <tr className="border-b border-borda text-left text-legenda text-texto-3">
                  <th className="px-3 py-2 font-medium">Mês</th>
                  {comInvestimento && <><th className="px-3 py-2 text-right font-medium">Investido</th><th className="px-3 py-2 text-right font-medium">Meta</th><th className="px-3 py-2 text-right font-medium">Google</th></>}
                  <th className="px-3 py-2 text-right font-medium">Leads</th>
                  {comInvestimento && <th className="px-3 py-2 text-right font-medium">CPL</th>}
                  <th className="px-3 py-2 text-right font-medium">Faturamento</th>
                  <th className="px-3 py-2 text-right font-medium">Vendas</th>
                  {comInvestimento && <th className="px-3 py-2 text-right font-medium">ROAS</th>}
                </tr>
              </thead>
              <tbody>
                {[...meses].reverse().map((m) => (
                  <tr key={m.mes} className="border-b border-borda/60 last:border-0">
                    <td className="px-3 py-1.5 font-medium capitalize">{mesLongo(m.mes)}</td>
                    {comInvestimento && <><td className="px-3 py-1.5 text-right font-semibold tabular-nums">{m.investido === null ? '—' : reais(m.investido)}</td><td className="px-3 py-1.5 text-right tabular-nums">{m.investidoMeta === null ? '—' : reais(m.investidoMeta)}</td><td className="px-3 py-1.5 text-right tabular-nums">{m.investidoGoogle === null ? '—' : reais(m.investidoGoogle)}</td></>}
                    <td className="px-3 py-1.5 text-right tabular-nums">{num(m.leads)}</td>
                    {comInvestimento && <td className="px-3 py-1.5 text-right tabular-nums">{m.cpl === null ? '—' : reais(m.cpl)}</td>}
                    <td className="px-3 py-1.5 text-right tabular-nums">{m.faturamento === null ? '—' : reais(m.faturamento)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{m.vendas === null ? '—' : num(m.vendas)}</td>
                    {comInvestimento && <td className="px-3 py-1.5 text-right tabular-nums">{m.roas === null ? '—' : `${num(m.roas)}x`}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Secao>
  )
}

function Secao({ titulo, icone: Icone, children }: { titulo: string; icone: typeof Eye; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-borda bg-white/60 p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-corpo font-bold text-texto"><Icone className="h-5 w-5 text-texto-3" />{titulo}</h2>
      {children}
    </section>
  )
}

function Plataforma({ titulo, p, detalhe }: { titulo: string; p: AnunciosPlataforma; detalhe?: string }) {
  if (p.captacao && p.reconhecimento) {
    const resultadoMarca = p.reconhecimento.visitasPerfil || p.reconhecimento.cliquesLink
    const rotuloMarca = p.reconhecimento.visitasPerfil ? 'Visitas ao perfil' : 'Cliques no link'
    return (
      <Secao titulo={titulo} icone={Target}>
        {p.investido !== null && <p className="text-rotulo text-texto-2">Investimento total: <strong className="tabular-nums text-texto">{reais(p.investido)}</strong></p>}
        <div>
          <p className="mb-2 text-rotulo font-semibold text-sucesso-forte">Campanhas de captação</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {p.captacao.investido !== null && <Cartao icone={BadgeDollarSign} cor="#1baf7a" rotulo="Investimento" valor={reais(p.captacao.investido)} extra={`${p.captacao.campanhas} campanha${p.captacao.campanhas === 1 ? '' : 's'}`} />}
            <Cartao icone={Users} cor="#1baf7a" rotulo="Leads" valor={num(p.captacao.leads)} extra={detalhe} />
            {p.captacao.custoPorLead !== null && <Cartao icone={Target} cor="#eb6834" rotulo="Custo por lead" valor={reais(p.captacao.custoPorLead)} />}
          </div>
        </div>
        <div>
          <p className="mb-2 text-rotulo font-semibold text-[#6250d6]">Campanhas de reconhecimento e tráfego para perfil</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {p.reconhecimento.investido !== null && <Cartao icone={BadgeDollarSign} cor="#6250d6" rotulo="Investimento" valor={reais(p.reconhecimento.investido)} extra={`${p.reconhecimento.campanhas} campanha${p.reconhecimento.campanhas === 1 ? '' : 's'}`} />}
            <Cartao icone={MousePointerClick} cor="#6250d6" rotulo={rotuloMarca} valor={num(resultadoMarca)} extra={p.reconhecimento.visitasPerfil ? `${num(p.reconhecimento.cliquesLink)} cliques no link` : undefined} />
            {(p.seguidoresAnuncio ?? 0) > 0 && <Cartao icone={Users} cor="#6250d6" rotulo="Novos seguidores pelos anúncios" valor={num(p.seguidoresAnuncio!)} extra={p.reconhecimento.custoPorSeguidor != null ? `${reais(p.reconhecimento.custoPorSeguidor)} por seguidor nas campanhas de perfil` : 'todas as campanhas'} />}
            {p.reconhecimento.visitasPerfil > 0 && p.reconhecimento.custoPorVisitaPerfil != null
              ? <Cartao icone={Target} cor="#eb6834" rotulo="Custo por visita ao perfil" valor={reais(p.reconhecimento.custoPorVisitaPerfil)} />
              : p.reconhecimento.custoPorClique !== null && <Cartao icone={Target} cor="#eb6834" rotulo="Custo por clique" valor={reais(p.reconhecimento.custoPorClique)} />}
          </div>
        </div>
      </Secao>
    )
  }
  return (
    <Secao titulo={titulo} icone={Target}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {p.investido !== null && <Cartao icone={BadgeDollarSign} cor="#2a78d6" rotulo="Investimento" valor={reais(p.investido)} />}
        <Cartao icone={Users} cor="#1baf7a" rotulo="Leads" valor={num(p.leads)} extra={detalhe} />
        {p.custoPorLead !== null && <Cartao icone={Target} cor="#eb6834" rotulo={p.custoPorLeadGeral ? 'Custo por lead (campanhas de captação)' : 'Custo por lead'} valor={reais(p.custoPorLead)} extra={p.custoPorLeadGeral ? `Considerando todo o investimento: ${reais(p.custoPorLeadGeral)}` : undefined} />}
        <Cartao icone={MousePointerClick} cor="#6250d6" rotulo="Cliques" valor={num(p.cliques)} />
        <Cartao icone={Eye} cor="#e87ba4" rotulo="Impressões" valor={num(p.impressoes)} />
      </div>
    </Secao>
  )
}

/** Relatório público que a agência envia ao cliente (link com token). Mostra só a foto guardada dos números. */
export default async function Relatorio({ params, searchParams }: PageProps<'/r/[token]'>) {
  const imprimir = (await searchParams).imprimir === '1'
  const leitura = await relatorioPorToken((await params).token)
  if (!leitura) notFound()
  const r = leitura.dados
  if (leitura.substituido) return (
    <main className="min-h-dvh bg-fundo px-4 py-10">
      <div className="mx-auto max-w-xl space-y-5 rounded-2xl border border-aviso/40 bg-white p-6 text-center shadow-sm">
        <div className="flex justify-center"><Marca tamanho="h-12 w-12 text-base" /></div>
        <div>
          <p className="eyebrow">Relatório de resultados</p>
          <h1 className="mt-1 text-[26px] font-bold tracking-[-0.02em] text-[#1d6fe0]">{r.cliente}</h1>
        </div>
        <div className="rounded-xl border border-aviso/40 bg-aviso-fundo/50 p-4">
          <TriangleAlert className="mx-auto h-7 w-7 text-aviso-forte" />
          <h2 className="mt-2 text-corpo font-bold text-texto">Este relatório foi substituído</h2>
          <p className="mt-1 text-rotulo text-texto-2">Os números antigos foram bloqueados para evitar o envio de informações desatualizadas. Solicite à Grupo SRV o novo link deste período.</p>
        </div>
      </div>
    </main>
  )
  const a = r.anuncios
  return (
    <main className="min-h-dvh bg-fundo px-4 py-6 sm:py-10">
      {imprimir && <ImprimirAoAbrir />}
      {/* Impressão / PDF: fundo branco, cores mantidas e sem quebrar cartões no meio. */}
      <style>{'@media print { @page { margin: 12mm } body, main { background: #fff !important } section { break-inside: avoid } * { -webkit-print-color-adjust: exact; print-color-adjust: exact } }'}</style>
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Marca tamanho="h-10 w-10 text-base" />
            <div>
              <p className="eyebrow">Relatório de resultados</p>
              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#1d6fe0]">{r.cliente}</h1>
            </div>
          </div>
          <p className="rounded-full border border-borda bg-white px-3 py-1 text-rotulo font-semibold text-texto-2">{data(r.de)} a {data(r.ate)}</p>
        </header>

        {r.destaques.length > 0 && (
          <Secao titulo="Destaques do período" icone={CheckCircle2}>
            <ul className="space-y-1.5">{r.destaques.map((d) => <li key={d} className="flex gap-2 rounded-lg border border-sucesso/30 bg-sucesso-fundo/50 px-3 py-2 text-rotulo text-texto"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sucesso-forte" />{d}</li>)}</ul>
          </Secao>
        )}

        {a?.meta && <Plataforma titulo="Meta Ads (Instagram e Facebook)" p={a.meta} detalhe={[a.meta.conversas ? `${num(a.meta.conversas)} conversas` : '', a.meta.formularios ? `${num(a.meta.formularios)} cadastros` : '', a.meta.leadsSite ? `${num(a.meta.leadsSite)} pelo site` : ''].filter(Boolean).join(' · ') || undefined} />}
        {a?.google && <Plataforma titulo="Google Ads" p={a.google} detalhe="conversões" />}

        {a && !a.meta && !a.google && (
          <Secao titulo="Anúncios (Meta e Google)" icone={Target}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {a.investido !== null && <Cartao icone={BadgeDollarSign} cor="#2a78d6" rotulo="Investimento" valor={reais(a.investido)} />}
              <Cartao icone={Users} cor="#1baf7a" rotulo="Leads" valor={num(leadsDoRelatorio(a))} extra={[a.conversas ? `${num(a.conversas)} conversas` : '', a.formularios ? `${num(a.formularios)} cadastros` : '', a.leadsSite ? `${num(a.leadsSite)} pelo site` : '', a.conversoesGoogle ? `${num(a.conversoesGoogle)} pelo Google` : ''].filter(Boolean).join(' · ') || undefined} />
              {a.custoPorLead !== null && a.investido !== null && <Cartao icone={Target} cor="#eb6834" rotulo="Custo por lead" valor={reais(a.custoPorLead)} />}
              <Cartao icone={MousePointerClick} cor="#6250d6" rotulo="Cliques" valor={num(a.cliques)} />
              <Cartao icone={Eye} cor="#e87ba4" rotulo="Impressões" valor={num(a.impressoes)} />
            </div>
          </Secao>
        )}

        {r.resultados && <Resultados res={r.resultados} />}

        {r.campanhas && r.campanhas.length > 0 && (
          <Secao titulo="Campanhas do período" icone={Megaphone}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-rotulo">
                <thead>
                  <tr className="border-b border-borda text-left text-legenda text-texto-3">
                    <th className="py-2 pr-3 font-medium">Campanha</th>
                    {r.campanhas.some((c) => c.gasto !== null) && <th className="py-2 pr-3 text-right font-medium">Investido</th>}
                    <th className="py-2 pr-3 text-right font-medium">Resultado</th>
                    {r.campanhas.some((c) => c.custoPorResultado !== null) && <th className="py-2 text-right font-medium">Custo por resultado</th>}
                  </tr>
                </thead>
                <tbody>
                  {r.campanhas.map((c, i) => (
                    <tr key={c.plataforma + c.nome + i} className="border-b border-borda/60 last:border-0">
                      <td className="py-2 pr-3">
                        <p className="font-semibold text-texto">{c.nome}</p>
                        <p className="flex flex-wrap items-center gap-1.5 text-micro text-texto-3">
                          <span className={`rounded-full px-1.5 py-0.5 font-semibold ${c.plataforma === 'meta' ? 'bg-[#e8f0fe] text-[#0866ff]' : 'bg-[#fdeee6] text-[#c2551f]'}`}>{c.plataforma === 'meta' ? 'Meta' : 'Google'}</span>
                          <span className={`rounded-full px-1.5 py-0.5 font-semibold ${c.papel === 'lead' ? 'bg-sucesso-fundo text-sucesso-forte' : 'bg-[#efeafd] text-[#6250d6]'}`}>{c.papel === 'lead' ? 'Geração de leads' : 'Marca (alcance e seguidores)'}</span>
                          {!c.ativa && <span>pausada</span>}
                        </p>
                      </td>
                      {r.campanhas!.some((x) => x.gasto !== null) && <td className="py-2 pr-3 text-right tabular-nums">{c.gasto === null ? '—' : reais(c.gasto)}</td>}
                      <td className="py-2 pr-3 text-right tabular-nums">{num(c.resultado)} <span className="text-legenda text-texto-3">{c.rotuloResultado}</span></td>
                      {r.campanhas!.some((x) => x.custoPorResultado !== null) && <td className="py-2 text-right tabular-nums">{c.custoPorResultado === null ? '—' : reais(c.custoPorResultado)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-legenda text-texto-3">Campanhas de marca levam pessoas ao perfil e trazem seguidores, que viram clientes depois: o resultado delas é o clique, não o lead.</p>
          </Secao>
        )}

        {r.instagram && (
          <Secao titulo={`Instagram @${r.instagram.usuario}`} icone={Camera}>
            {r.instagram.seguidoresGanhos !== undefined && <SeguidoresDoPeriodo s={separarSeguidores({ ganhos: r.instagram.seguidoresGanhos, perdidos: r.instagram.seguidoresPerdidos ?? 0, pagos: r.instagram.seguidoresPagos ?? null })} />}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Cartao icone={Users} cor="#6250d6" rotulo="Seguidores" valor={num(r.instagram.seguidores)} extra={`saldo ${r.instagram.novosSeguidores >= 0 ? '+' : ''}${num(r.instagram.novosSeguidores)} no período`} />
              {r.instagram.alcancePosts !== undefined ? (
                <Cartao icone={Eye} cor="#2a78d6" rotulo="Alcance dos posts (orgânico)" valor={num(r.instagram.alcancePosts)} extra={`${num(r.instagram.visualizacoes)} visualizações dos posts`} />
              ) : (
                <Cartao icone={Eye} cor="#2a78d6" rotulo="Alcance da conta (orgânico + anúncios)" valor={num(r.instagram.alcance)} extra={`${num(r.instagram.visualizacoes)} visualizações`} />
              )}
              {r.instagram.cliquesLinkBio != null && <Cartao icone={Link2} cor="#1baf7a" rotulo="Cliques no link da bio" valor={num(r.instagram.cliquesLinkBio)} extra="pessoas que tocaram no link do perfil" />}
              <Cartao icone={Heart} cor="#e87ba4" rotulo="Interações" valor={num(r.instagram.interacoes)} extra={`${num(r.instagram.posts)} posts${r.instagram.engajamentoPosts !== null ? ` · ${num(r.instagram.engajamentoPosts)}% de engajamento` : ''}`} />
            </div>
            {r.instagram.melhorPost && (
              <a href={r.instagram.melhorPost.link} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-xl border border-borda bg-white p-3 text-rotulo hover:bg-hover">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#e1306c]" />
                <span className="min-w-0 flex-1"><strong>Post de maior destaque</strong> ({num(r.instagram.melhorPost.interacoes)} interações): <span className="text-texto-2">{r.instagram.melhorPost.legenda || 'ver no Instagram'}</span></span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-texto-3" />
              </a>
            )}
          </Secao>
        )}

        {r.gmn && (
          <Secao titulo="Google (Meu Negócio e Maps)" icone={MapPin}>
            <div className="grid items-center gap-3 sm:grid-cols-3">
              <Cartao icone={Star} cor="#eda100" rotulo="Nota no Google" valor={r.gmn.nota === null ? '—' : `★ ${num(r.gmn.nota)}`} extra={`${num(r.gmn.avaliacoes)} avaliações`} />
              <div className="rounded-xl border border-borda bg-white p-3 text-center sm:col-span-2">
                <p className="text-legenda text-texto-3">Saúde do perfil no Google</p>
                <div className="mx-auto max-w-56"><Medidor nota={r.gmn.saude} /></div>
              </div>
            </div>
            {r.gmn.geogrid && (
              <div className="space-y-2">
                <p className="text-rotulo text-texto-2">{r.gmn.geogrid.primeiro !== undefined ? fraseGeogrid(r.gmn.geogrid.palavra, r.gmn.geogrid.metricas, r.gmn.geogrid.primeiro, r.gmn.geogrid.lider ?? null) : <>Posição no Google Maps em cada ponto da região para <strong>&quot;{r.gmn.geogrid.palavra}&quot;</strong>: no top 3 em <strong>{num(r.gmn.geogrid.metricas.top3)}%</strong> dos pontos.</>}</p>
                <div className="max-w-xl"><MapaGrade centro={r.gmn.geogrid.centro} pontos={r.gmn.geogrid.pontos} rotulo={`Mapa de posições para ${r.gmn.geogrid.palavra}`} /></div>
              </div>
            )}
          </Secao>
        )}

        {r.bio && (
          <Secao titulo="Link da bio do Instagram" icone={Link2}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Cartao icone={MousePointerClick} cor="#1baf7a" rotulo="Cliques no link da bio" valor={num(r.bio.cliques ?? r.bio.visitas ?? 0)} extra="vezes que tocaram no link do perfil" />
              {r.bio.visualizacoes != null && <Cartao icone={Eye} cor="#2a78d6" rotulo="Visualizações da página" valor={num(r.bio.visualizacoes)} extra={r.bio.pessoas ? `${num(r.bio.pessoas)} pessoas distintas por dia` : 'a página chegou a abrir'} />}
              <Cartao icone={Target} cor="#6250d6" rotulo="Toques nos botões" valor={num(r.bio.toques)} extra={r.bio.visualizacoes ? `${num(r.bio.toques / r.bio.visualizacoes)} por visualização` : undefined} />
              {r.bio.leadsOrganicos != null && <Cartao icone={Users} cor="#eb6834" rotulo="Leads orgânicos" valor={num(r.bio.leadsOrganicos)} extra="concluíram o quiz do WhatsApp" />}
            </div>
            {r.bio.botoes.length > 0 && (
              <ul className="space-y-2 rounded-xl border border-borda bg-white p-3">
                {r.bio.botoes.map((b) => (
                  <li key={b.rotulo} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-rotulo"><span className="font-semibold">{b.rotulo}</span><span className="tabular-nums text-texto-2"><strong className="text-texto">{num(b.toques)}</strong> toques</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-fundo"><div className="h-full rounded-full bg-[#6250d6]" style={{ width: `${(b.toques / r.bio!.botoes[0].toques) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Secao>
        )}

        {r.meuNegocio && (
          <Secao titulo="Google Meu Negócio no período" icone={MapPin}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Cartao icone={Eye} cor="#2a78d6" rotulo="Visualizações do perfil" valor={num(r.meuNegocio.visualizacoes)} extra={`${num(r.meuNegocio.buscas)} na busca · ${num(r.meuNegocio.mapas)} no Maps`} />
              <Cartao icone={MessageCircle} cor="#1baf7a" rotulo="Ligações" valor={num(r.meuNegocio.ligacoes)} />
              <Cartao icone={MapPin} cor="#eb6834" rotulo="Pedidos de rota" valor={num(r.meuNegocio.rotas)} />
              <Cartao icone={MousePointerClick} cor="#6250d6" rotulo="Cliques no site" valor={num(r.meuNegocio.site)} />
              {(r.meuNegocio.mensagens ?? r.meuNegocio.conversas ?? 0) > 0 && <Cartao icone={MessageCircle} cor="#1baf7a" rotulo="Cliques em mensagens" valor={num(r.meuNegocio.mensagens ?? r.meuNegocio.conversas ?? 0)} />}
              {r.meuNegocio.avaliacoes && <Cartao icone={Star} cor="#eda100" rotulo="Avaliações novas" valor={num(r.meuNegocio.avaliacoes.novas)} extra={r.meuNegocio.avaliacoes.notaMedia === null ? 'Sem nota no período' : `Média ★ ${num(r.meuNegocio.avaliacoes.notaMedia)} · ${num(r.meuNegocio.avaliacoes.respondidas)} respondidas`} />}
              {(r.meuNegocio.reservas ?? 0) > 0 && <Cartao icone={Target} cor="#2a78d6" rotulo="Reservas" valor={num(r.meuNegocio.reservas!)} />}
              {(r.meuNegocio.cliquesCardapio ?? 0) > 0 && <Cartao icone={MousePointerClick} cor="#6250d6" rotulo="Cliques no cardápio" valor={num(r.meuNegocio.cliquesCardapio!)} />}
            </div>
            {r.meuNegocio.palavrasChave?.length ? (
              <div className="rounded-xl border border-borda bg-white p-3">
                <p className="text-legenda font-semibold text-texto-2">Principais termos usados para encontrar o perfil</p>
                <p className="text-micro text-texto-3">Agregado mensal de {r.meuNegocio.palavrasPeriodo?.de} a {r.meuNegocio.palavrasPeriodo?.ate}</p>
                <ol className="mt-2 grid gap-x-5 gap-y-1 text-rotulo sm:grid-cols-2">
                  {r.meuNegocio.palavrasChave.map((p) => <li key={p.termo} className="flex justify-between gap-3"><span className="truncate text-texto-2">{p.termo}</span><strong className="tabular-nums">{p.abaixoDe ? '< ' : ''}{num(p.visualizacoes)}</strong></li>)}
                </ol>
              </div>
            ) : null}
          </Secao>
        )}

        <footer className="pt-2 text-center text-legenda text-texto-3">Relatório gerado pela Grupo SRV em {new Date(r.geradoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })}.</footer>
      </div>
    </main>
  )
}
