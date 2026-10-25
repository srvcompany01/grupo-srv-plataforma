import { BadgeDollarSign, Camera, CheckCircle2, ExternalLink, Eye, Heart, MapPin, MessageCircle, MousePointerClick, Star, Target, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { MapaGrade, Medidor } from '@/componentes/gmn/MapaGrade'
import { Marca } from '@/componentes/Marca'
import { leadsDoRelatorio } from '@/dominio/relatorio-compartilhado'
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

/** Relatório público que a agência envia ao cliente (link com token). Mostra só a foto guardada dos números. */
export default async function Relatorio({ params }: PageProps<'/r/[token]'>) {
  const r = await relatorioPorToken((await params).token)
  if (!r) notFound()
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

        {a && (
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

        {r.instagram && (
          <Secao titulo={`Instagram @${r.instagram.usuario}`} icone={Camera}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Cartao icone={Users} cor="#6250d6" rotulo="Seguidores" valor={num(r.instagram.seguidores)} extra={`${r.instagram.novosSeguidores >= 0 ? '+' : ''}${num(r.instagram.novosSeguidores)} no período`} />
              {r.instagram.alcancePosts !== undefined ? (
                <Cartao icone={Eye} cor="#2a78d6" rotulo="Alcance dos posts (orgânico)" valor={num(r.instagram.alcancePosts)} extra={`Alcance total da conta, com anúncios: ${num(r.instagram.alcance)}`} />
              ) : (
                <Cartao icone={Eye} cor="#2a78d6" rotulo="Alcance da conta (orgânico + anúncios)" valor={num(r.instagram.alcance)} extra={`${num(r.instagram.visualizacoes)} visualizações`} />
              )}
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
                <p className="text-rotulo text-texto-2">Posição no Google Maps em cada ponto da região para <strong>&quot;{r.gmn.geogrid.palavra}&quot;</strong>: no top 3 em <strong>{num(r.gmn.geogrid.metricas.top3)}%</strong> dos pontos.</p>
                <div className="max-w-xl"><MapaGrade centro={r.gmn.geogrid.centro} pontos={r.gmn.geogrid.pontos} rotulo={`Mapa de posições para ${r.gmn.geogrid.palavra}`} /></div>
              </div>
            )}
          </Secao>
        )}

        <footer className="pt-2 text-center text-legenda text-texto-3">Relatório gerado pela Grupo SRV em {new Date(r.geradoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })}.</footer>
      </div>
    </main>
  )
}
