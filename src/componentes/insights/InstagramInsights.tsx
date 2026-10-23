import { ExternalLink, PlayCircle } from 'lucide-react'
import { engajamento, porFormato, type ResumoInstagram } from '@/dominio/insights'
import { Numeros } from './BlocoAnalise'
import { GraficoDiario } from './GraficoDiario'

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Belem' })

/** Números do Instagram no período, alcance por dia, desempenho por formato e os melhores posts. */
export function InstagramInsights({ ig, dias }: { ig: ResumoInstagram; dias: string[] }) {
  const porDia = new Map(ig.alcancePorDia.map((d) => [d.dia, d.valor]))
  const formatos = porFormato(ig.posts)
  const melhores = [...ig.posts].sort((a, b) => b.interacoes - a.interacoes).slice(0, 6)
  return (
    <div className="@container space-y-4">
      <Numeros
        itens={[
          ['Seguidores', numero.format(ig.seguidores), ig.novosSeguidores ? `${ig.novosSeguidores > 0 ? '+' : ''}${numero.format(ig.novosSeguidores)} no período` : undefined],
          ['Alcance', numero.format(ig.alcance)],
          ['Visualizações', numero.format(ig.visualizacoes)],
          ['Interações', numero.format(ig.interacoes), `${pct(engajamento(ig.interacoes, ig.alcance))} do alcance`],
          ['Posts', String(ig.posts.length)],
          ['Cliques no perfil', numero.format(ig.cliquesPerfil)],
        ]}
      />
      <GraficoDiario titulo="Alcance do perfil por dia" dias={dias} series={[{ nome: 'Alcance', valores: dias.map((d) => porDia.get(d) ?? 0) }]} formato={(n) => numero.format(n)} tipo="barras" />
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
                  <td className="py-1.5 pr-3 font-medium text-texto">{f.formato}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{f.posts}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{numero.format(f.alcance)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{numero.format(f.interacoes)}</td>
                  <td className="py-1.5 text-right tabular-nums">{pct(f.engajamento)}</td>
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
              <li key={p.id} className="overflow-hidden rounded-xl border border-borda bg-white">
                <a href={p.link} target="_blank" rel="noreferrer" className="block">
                  <div className="relative aspect-square bg-fundo">
                    {p.imagem && (
                      // eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Instagram (URL que expira)
                      <img src={p.imagem} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                    {p.formato === 'Reels' && <PlayCircle className="absolute right-1.5 top-1.5 h-5 w-5 text-white drop-shadow" aria-label="Reels" />}
                  </div>
                  <div className="space-y-0.5 p-2">
                    <p className="flex items-center justify-between text-micro text-texto-3"><span>{p.formato} · {quando.format(new Date(p.em))}</span><ExternalLink className="h-3 w-3" /></p>
                    <p className="text-rotulo font-semibold tabular-nums text-texto">{numero.format(p.interacoes)} interações</p>
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
