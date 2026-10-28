import { ExternalLink, Eye, Heart, LayoutGrid, Link2, PlayCircle, Radar, Users } from 'lucide-react'
import { engajamentoOrganico, metricasOrganicas, porFormato, separarSeguidores, tomAlcanceBase, tomEngajamento, tomFrequencia, tomVariacao, type ResumoInstagram } from '@/dominio/insights'
import { Numeros } from './BlocoAnalise'
import { SeguidoresDoPeriodo } from './SeguidoresDoPeriodo'
import { GraficoDiario } from './GraficoDiario'
import { SeloTom } from './tom'

/** Cor de cada formato (identidade fixa, a mesma em todos os clientes). */
export const COR_FORMATO_IG: Record<string, string> = { Reels: '#e87ba4', Carrossel: '#6250d6', Foto: '#2a78d6', 'Vídeo': '#eb6834' }

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Belem' })

/** Números do Instagram no período, alcance por dia, desempenho por formato e os melhores posts. */
export function InstagramInsights({ ig, dias, cliquesLinkBio, seguidoresPagos }: { ig: ResumoInstagram; dias: string[]; cliquesLinkBio?: number | null; /** Seguidores atribuídos aos anúncios no período; undefined = não separar, null = sem dado dos anúncios. */ seguidoresPagos?: number | null }) {
  const organico = metricasOrganicas(ig)
  const seg = seguidoresPagos === undefined ? null : separarSeguidores({ ganhos: ig.seguidoresGanhos, perdidos: ig.seguidoresPerdidos, pagos: seguidoresPagos })
  const porDia = new Map<string, number>()
  const diaLocal = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Belem' })
  for (const p of ig.posts) {
    const dia = diaLocal.format(new Date(p.em))
    porDia.set(dia, (porDia.get(dia) ?? 0) + p.alcance)
  }
  const formatos = porFormato(ig.posts)
  const melhores = [...ig.posts].sort((a, b) => b.interacoes - a.interacoes).slice(0, 6)
  const porSemana = (ig.posts.length / Math.max(1, dias.length)) * 7
  return (
    <div className="@container space-y-4">
      {seg && <SeguidoresDoPeriodo s={seg} />}
      <Numeros
        itens={[
          { rotulo: 'Seguidores', valor: numero.format(ig.seguidores), extra: ig.novosSeguidores ? `${ig.novosSeguidores > 0 ? '▲ +' : '▼ '}${numero.format(ig.novosSeguidores)} no período` : undefined, tom: tomVariacao(ig.novosSeguidores), rotuloTom: ig.novosSeguidores > 0 ? 'Crescendo' : 'Caindo', icone: Users, cor: '#6250d6' },
          { rotulo: 'Alcance dos posts', valor: numero.format(organico.alcance), extra: ig.seguidores && organico.posts ? `${pct((organico.alcance / organico.posts / ig.seguidores) * 100)} da base por post` : undefined, tom: organico.posts ? tomAlcanceBase(organico.alcance / organico.posts, ig.seguidores) : undefined, icone: Radar, cor: '#2a78d6' },
          { rotulo: 'Visualizações dos posts', valor: numero.format(organico.visualizacoes), icone: Eye, cor: '#1baf7a' },
          { rotulo: 'Interações nos posts', valor: numero.format(organico.interacoes), extra: engajamentoOrganico(ig) === null ? 'sem posts no período' : `${pct(engajamentoOrganico(ig)!)} de engajamento`, tom: engajamentoOrganico(ig) === null ? undefined : tomEngajamento(engajamentoOrganico(ig)!), icone: Heart, cor: '#e87ba4' },
          { rotulo: 'Posts', valor: String(ig.posts.length), extra: `${porSemana.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por semana`, tom: tomFrequencia(porSemana), icone: LayoutGrid, cor: '#eb6834' },
          ...(cliquesLinkBio === undefined ? [] : [{ rotulo: 'Cliques no link da bio', valor: cliquesLinkBio === null ? '—' : numero.format(cliquesLinkBio), extra: cliquesLinkBio === null ? 'sem link rastreado na bio' : 'pelo link da plataforma', icone: Link2, cor: '#1baf7a' }]),
          { rotulo: 'Toques nos botões de contato', valor: numero.format(ig.cliquesPerfil), extra: 'ligar, rota e e-mail do perfil', icone: Radar, cor: '#6250d6' },
        ]}
      />
      <GraficoDiario titulo="Alcance dos posts pela data de publicação" dias={dias} series={[{ nome: 'Posts orgânicos', valores: dias.map((d) => porDia.get(d) ?? 0) }]} formato={(n) => numero.format(n)} tipo="barras" />
      {formatos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-rotulo">
            <thead>
              <tr className="border-b border-borda text-left text-legenda text-texto-3">
                <th className="py-1.5 pr-3 font-medium">Formato</th>
                <th className="py-1.5 pr-3 text-right font-medium">Posts</th>
                <th className="py-1.5 pr-3 text-right font-medium">Alcance médio</th>
                <th className="py-1.5 pr-3 text-right font-medium">Interações médias</th>
                <th className="py-1.5 text-right font-medium">Engajamento</th>
              </tr>
            </thead>
            <tbody>
              {formatos.map((f) => (
                <tr key={f.formato} className="border-b border-borda/60 last:border-0">
                  <td className="py-1.5 pr-3 font-medium text-texto"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_FORMATO_IG[f.formato] }} />{f.formato}</span></td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{f.posts}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{numero.format(f.alcance)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{numero.format(f.interacoes)}</td>
                  <td className="py-1.5 text-right tabular-nums"><span className="inline-flex items-center gap-1.5">{pct(f.engajamento)} {tomEngajamento(f.engajamento) !== 'neutro' && <SeloTom tom={tomEngajamento(f.engajamento)} />}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {melhores.length > 0 && (
        <div>
          <p className="mb-2 text-legenda font-semibold text-texto-2">Melhores posts do período</p>
          <ul className="grid grid-cols-2 gap-2 @xl:grid-cols-3 @4xl:grid-cols-6">
            {melhores.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-lg border border-borda bg-white">
                <a href={p.link} target="_blank" rel="noreferrer" className="block">
                  <div className="relative aspect-square bg-fundo">
                    {p.imagem && (
                      // eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Instagram (URL que expira)
                      <img src={p.imagem} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                    {p.formato === 'Reels' && <PlayCircle className="absolute right-1.5 top-1.5 h-5 w-5 text-claro drop-shadow" aria-label="Reels" />}
                    <span className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-micro font-semibold text-claro" style={{ background: COR_FORMATO_IG[p.formato] }}>{p.formato}</span>
                  </div>
                  <div className="space-y-0.5 p-2">
                    <p className="flex items-center justify-between text-micro text-texto-3"><span>{quando.format(new Date(p.em))}</span><ExternalLink className="h-3 w-3" /></p>
                    <p className="flex items-center gap-1 text-rotulo font-semibold tabular-nums text-texto"><Heart className="h-3.5 w-3.5" style={{ color: '#e87ba4' }} aria-hidden />{numero.format(p.interacoes)} interações</p>
                    <p className="text-micro text-texto-3">{numero.format(p.alcance)} de alcance · {numero.format(p.salvamentos)} salvos</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
