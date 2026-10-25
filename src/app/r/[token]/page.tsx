import { BadgeDollarSign, Camera, CheckCircle2, ExternalLink, Eye, Heart, Link2, MapPin, Megaphone, MessageCircle, MousePointerClick, Star, Target, TriangleAlert, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { MapaGrade, Medidor } from '@/componentes/gmn/MapaGrade'
import { Marca } from '@/componentes/Marca'
import { fraseGeogrid } from '@/dominio/gmn'
import { leadsDoRelatorio, type AnunciosPlataforma } from '@/dominio/relatorio-compartilhado'
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
            {p.reconhecimento.custoPorClique !== null && <Cartao icone={Target} cor="#eb6834" rotulo="Custo por clique" valor={reais(p.reconhecimento.custoPorClique)} />}
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
export default async function Relatorio({ params }: PageProps<'/r/[token]'>) {
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Cartao icone={Users} cor="#6250d6" rotulo="Seguidores" valor={num(r.instagram.seguidores)} extra={`${r.instagram.novosSeguidores >= 0 ? '+' : ''}${num(r.instagram.novosSeguidores)} no período`} />
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
              <Cartao icone={Users} cor="#1baf7a" rotulo="Visitas ao link da bio" valor={num(r.bio.visitas)} extra="pessoas que abriram o link" />
              <Cartao icone={MousePointerClick} cor="#6250d6" rotulo="Toques nos botões" valor={num(r.bio.toques)} extra={r.bio.visitas ? `${num(r.bio.toques / r.bio.visitas)} por visita` : undefined} />
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
