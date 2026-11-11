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
    <div>
      <p><span style={{ background: `${cor}1f`, color: cor }}><Icone /></span>{rotulo}</p>
      <p>{valor}</p>
      {extra && <p>{extra}</p>}
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
      <p>{res.emAndamento ? 'Mês em andamento: números até hoje. ' : ''}Mês inteiro (não só o período do relatório): anúncios da Meta e do Google, orgânico da bio e o faturamento informado pela equipe.</p>
      <div>
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
        <div>
          <p>Mês a mês</p>
          <div>
            {comInvestimento && <GraficoDiario titulo="Investido x faturamento" dias={dias} rotulo={mesCurto} formato={reaisCurto} series={[{ nome: 'Investido', valores: meses.map((m) => m.investido ?? 0) }, { nome: 'Faturamento', valores: meses.map((m) => m.faturamento ?? 0) }]} />}
            <GraficoDiario titulo="Leads por mês" dias={dias} rotulo={mesCurto} tipo="barras" formato={(v) => num(v)} series={[{ nome: 'Leads', valores: meses.map((m) => m.leads) }]} />
          </div>
          <div>
            <table>
              <thead>
                <tr>
                  <th>Mês</th>
                  {comInvestimento && <><th>Investido</th><th>Meta</th><th>Google</th></>}
                  <th>Leads</th>
                  {comInvestimento && <th>CPL</th>}
                  <th>Faturamento</th>
                  <th>Vendas</th>
                  {comInvestimento && <th>ROAS</th>}
                </tr>
              </thead>
              <tbody>
                {[...meses].reverse().map((m) => (
                  <tr key={m.mes}>
                    <td>{mesLongo(m.mes)}</td>
                    {comInvestimento && <><td>{m.investido === null ? '—' : reais(m.investido)}</td><td>{m.investidoMeta === null ? '—' : reais(m.investidoMeta)}</td><td>{m.investidoGoogle === null ? '—' : reais(m.investidoGoogle)}</td></>}
                    <td>{num(m.leads)}</td>
                    {comInvestimento && <td>{m.cpl === null ? '—' : reais(m.cpl)}</td>}
                    <td>{m.faturamento === null ? '—' : reais(m.faturamento)}</td>
                    <td>{m.vendas === null ? '—' : num(m.vendas)}</td>
                    {comInvestimento && <td>{m.roas === null ? '—' : `${num(m.roas)}x`}</td>}
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
    <section>
      <h2><Icone />{titulo}</h2>
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
        {p.investido !== null && <p>Investimento total: <strong>{reais(p.investido)}</strong></p>}
        <div>
          <p>Campanhas de captação</p>
          <div>
            {p.captacao.investido !== null && <Cartao icone={BadgeDollarSign} cor="#1baf7a" rotulo="Investimento" valor={reais(p.captacao.investido)} extra={`${p.captacao.campanhas} campanha${p.captacao.campanhas === 1 ? '' : 's'}`} />}
            <Cartao icone={Users} cor="#1baf7a" rotulo="Leads" valor={num(p.captacao.leads)} extra={detalhe} />
            {p.captacao.custoPorLead !== null && <Cartao icone={Target} cor="#eb6834" rotulo="Custo por lead" valor={reais(p.captacao.custoPorLead)} />}
          </div>
        </div>
        <div>
          <p>Campanhas de reconhecimento e tráfego para perfil</p>
          <div>
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
      <div>
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
    <main>
      <div>
        <div><Marca tamanho="h-12 w-12 text-base" /></div>
        <div>
          <p>Relatório de resultados</p>
          <h1>{r.cliente}</h1>
        </div>
        <div>
          <TriangleAlert />
          <h2>Este relatório foi substituído</h2>
          <p>Os números antigos foram bloqueados para evitar o envio de informações desatualizadas. Solicite à Grupo SRV o novo link deste período.</p>
        </div>
      </div>
    </main>
  )
  const a = r.anuncios
  return (
    <main>
      {imprimir && <ImprimirAoAbrir />}
      {/* Impressão / PDF: fundo branco, cores mantidas e sem quebrar cartões no meio. */}
      <style>{'@media print { @page { margin: 12mm } body, main { background: #fff !important } section { break-inside: avoid } * { -webkit-print-color-adjust: exact; print-color-adjust: exact } }'}</style>
      <div>
        <header>
          <div>
            <Marca tamanho="h-10 w-10 text-base" />
            <div>
              <p>Relatório de resultados</p>
              <h1>{r.cliente}</h1>
            </div>
          </div>
          <p>{data(r.de)} a {data(r.ate)}</p>
        </header>

        {r.destaques.length > 0 && (
          <Secao titulo="Destaques do período" icone={CheckCircle2}>
            <ul>{r.destaques.map((d) => <li key={d}><CheckCircle2 />{d}</li>)}</ul>
          </Secao>
        )}

        {a?.meta && <Plataforma titulo="Meta Ads (Instagram e Facebook)" p={a.meta} detalhe={[a.meta.conversas ? `${num(a.meta.conversas)} conversas` : '', a.meta.formularios ? `${num(a.meta.formularios)} cadastros` : '', a.meta.leadsSite ? `${num(a.meta.leadsSite)} pelo site` : ''].filter(Boolean).join(' · ') || undefined} />}
        {a?.google && <Plataforma titulo="Google Ads" p={a.google} detalhe="conversões" />}

        {a && !a.meta && !a.google && (
          <Secao titulo="Anúncios (Meta e Google)" icone={Target}>
            <div>
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
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Campanha</th>
                    {r.campanhas.some((c) => c.gasto !== null) && <th>Investido</th>}
                    <th>Resultado</th>
                    {r.campanhas.some((c) => c.custoPorResultado !== null) && <th>Custo por resultado</th>}
                  </tr>
                </thead>
                <tbody>
                  {r.campanhas.map((c, i) => (
                    <tr key={c.plataforma + c.nome + i}>
                      <td>
                        <p>{c.nome}</p>
                        <p>
                          <span>{c.plataforma === 'meta' ? 'Meta' : 'Google'}</span>
                          <span>{c.papel === 'lead' ? 'Geração de leads' : 'Marca (alcance e seguidores)'}</span>
                          {!c.ativa && <span>pausada</span>}
                        </p>
                      </td>
                      {r.campanhas!.some((x) => x.gasto !== null) && <td>{c.gasto === null ? '—' : reais(c.gasto)}</td>}
                      <td>{num(c.resultado)} <span>{c.rotuloResultado}</span></td>
                      {r.campanhas!.some((x) => x.custoPorResultado !== null) && <td>{c.custoPorResultado === null ? '—' : reais(c.custoPorResultado)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>Campanhas de marca levam pessoas ao perfil e trazem seguidores, que viram clientes depois: o resultado delas é o clique, não o lead.</p>
          </Secao>
        )}

        {r.instagram && (
          <Secao titulo={`Instagram @${r.instagram.usuario}`} icone={Camera}>
            {r.instagram.seguidoresGanhos !== undefined && <SeguidoresDoPeriodo s={separarSeguidores({ ganhos: r.instagram.seguidoresGanhos, perdidos: r.instagram.seguidoresPerdidos ?? 0, pagos: r.instagram.seguidoresPagos ?? null })} />}
            <div>
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
              <a href={r.instagram.melhorPost.link} target="_blank" rel="noreferrer">
                <MessageCircle />
                <span><strong>Post de maior destaque</strong> ({num(r.instagram.melhorPost.interacoes)} interações): <span>{r.instagram.melhorPost.legenda || 'ver no Instagram'}</span></span>
                <ExternalLink />
              </a>
            )}
          </Secao>
        )}

        {r.gmn && (
          <Secao titulo="Google (Meu Negócio e Maps)" icone={MapPin}>
            <div>
              <Cartao icone={Star} cor="#eda100" rotulo="Nota no Google" valor={r.gmn.nota === null ? '—' : `★ ${num(r.gmn.nota)}`} extra={`${num(r.gmn.avaliacoes)} avaliações`} />
              <div>
                <p>Saúde do perfil no Google</p>
                <div><Medidor nota={r.gmn.saude} /></div>
              </div>
            </div>
            {r.gmn.geogrid && (
              <div>
                <p>{r.gmn.geogrid.primeiro !== undefined ? fraseGeogrid(r.gmn.geogrid.palavra, r.gmn.geogrid.metricas, r.gmn.geogrid.primeiro, r.gmn.geogrid.lider ?? null) : <>Posição no Google Maps em cada ponto da região para <strong>&quot;{r.gmn.geogrid.palavra}&quot;</strong>: no top 3 em <strong>{num(r.gmn.geogrid.metricas.top3)}%</strong> dos pontos.</>}</p>
                <div><MapaGrade centro={r.gmn.geogrid.centro} pontos={r.gmn.geogrid.pontos} rotulo={`Mapa de posições para ${r.gmn.geogrid.palavra}`} /></div>
              </div>
            )}
          </Secao>
        )}

        {r.bio && (
          <Secao titulo="Link da bio do Instagram" icone={Link2}>
            <div>
              <Cartao icone={MousePointerClick} cor="#1baf7a" rotulo="Cliques no link da bio" valor={num(r.bio.cliques ?? r.bio.visitas ?? 0)} extra="vezes que tocaram no link do perfil" />
              {r.bio.visualizacoes != null && <Cartao icone={Eye} cor="#2a78d6" rotulo="Visualizações da página" valor={num(r.bio.visualizacoes)} extra={r.bio.pessoas ? `${num(r.bio.pessoas)} pessoas distintas por dia` : 'a página chegou a abrir'} />}
              <Cartao icone={Target} cor="#6250d6" rotulo="Toques nos botões" valor={num(r.bio.toques)} extra={r.bio.visualizacoes ? `${num(r.bio.toques / r.bio.visualizacoes)} por visualização` : undefined} />
              {r.bio.leadsOrganicos != null && <Cartao icone={Users} cor="#eb6834" rotulo="Leads orgânicos" valor={num(r.bio.leadsOrganicos)} extra="concluíram o quiz do WhatsApp" />}
            </div>
            {r.bio.botoes.length > 0 && (
              <ul>
                {r.bio.botoes.map((b) => (
                  <li key={b.rotulo}>
                    <div><span>{b.rotulo}</span><span><strong>{num(b.toques)}</strong> toques</span></div>
                    <div><div style={{ width: `${(b.toques / r.bio!.botoes[0].toques) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Secao>
        )}

        {r.meuNegocio && (
          <Secao titulo="Google Meu Negócio no período" icone={MapPin}>
            <div>
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
              <div>
                <p>Principais termos usados para encontrar o perfil</p>
                <p>Agregado mensal de {r.meuNegocio.palavrasPeriodo?.de} a {r.meuNegocio.palavrasPeriodo?.ate}</p>
                <ol>
                  {r.meuNegocio.palavrasChave.map((p) => <li key={p.termo}><span>{p.termo}</span><strong>{p.abaixoDe ? '< ' : ''}{num(p.visualizacoes)}</strong></li>)}
                </ol>
              </div>
            ) : null}
          </Secao>
        )}

        <footer>Relatório gerado pela Grupo SRV em {new Date(r.geradoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })}.</footer>
      </div>
    </main>
  )
}
