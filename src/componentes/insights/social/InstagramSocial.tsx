import { COR_FORMATO_IG } from '@/componentes/insights/InstagramInsights'
import { SeguidoresDoPeriodo } from '@/componentes/insights/SeguidoresDoPeriodo'
import { SeloTom } from '@/componentes/insights/tom'
import { LogoRede } from '@/componentes/redes/LogoRede'
import { analisarOrganico, metricasOrganicas, porFormato, separarSeguidores, tomEngajamento, type ResumoInstagram } from '@/dominio/insights'
import { CartaoSocial } from './Cartao'
import type { Metrica } from './Metricas'
import { PainelInstagram, type PostLista } from './PainelInstagram'
import { SinaisTabela } from './SinaisTabela'

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const inteiro = new Intl.NumberFormat('pt-BR')
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const diaLocal = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Belem' })
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Variação em % contra o período anterior; sem base (anterior zerado ou ausente) = sem chip. */
const variacao = (atual: number, anterior: number | undefined) => (anterior && anterior > 0 ? ((atual - anterior) / anterior) * 100 : undefined)

/** Instagram de um cliente no padrão de referência: cabeçalho, cartões de métricas com variação, evolução, interações e melhores posts. */
export function InstagramSocial({ ig, anterior, dias, rotuloPeriodo, cliquesLinkBio, seguidoresPagos }: { ig: ResumoInstagram; /** Mesmo período, imediatamente antes (para as variações). */ anterior?: ResumoInstagram | null; dias: string[]; rotuloPeriodo: string; cliquesLinkBio?: number | null; seguidoresPagos?: number | null }) {
  const org = metricasOrganicas(ig)
  const seg = seguidoresPagos === undefined ? null : separarSeguidores({ ganhos: ig.seguidoresGanhos, perdidos: ig.seguidoresPerdidos, pagos: seguidoresPagos })
  const serie = (dados?: { dia: string; valor: number }[]) => {
    if (!dados?.length) return undefined
    const m = new Map(dados.map((d) => [d.dia, d.valor]))
    return dias.map((d) => m.get(d) ?? 0)
  }
  const porDiaPosts = new Map<string, number>()
  for (const p of ig.posts) { const d = diaLocal.format(new Date(p.em)); porDiaPosts.set(d, (porDiaPosts.get(d) ?? 0) + 1) }
  const seriePosts = dias.map((d) => porDiaPosts.get(d) ?? 0)
  const extras = ig.seriesPorDia ?? {}
  const baseSeguidores = ig.seguidores - ig.novosSeguidores
  const metricas: Metrica[] = [
    { id: 'seguidores', rotulo: 'Seguidores', valor: inteiro.format(ig.seguidores), icone: 'users', cor: '#d98a00', delta: baseSeguidores > 0 && ig.novosSeguidores ? (ig.novosSeguidores / baseSeguidores) * 100 : undefined },
    { id: 'alcance', rotulo: 'Alcance', valor: inteiro.format(ig.alcance), icone: 'radar', cor: '#4f46e5', delta: variacao(ig.alcance, anterior?.alcance), serie: serie(ig.alcancePorDia), extra: 'inclui anúncios' },
    { id: 'engajadas', rotulo: 'Contas engajadas', valor: inteiro.format(ig.contasEngajadas), icone: 'heart', cor: '#d6249f', delta: variacao(ig.contasEngajadas, anterior?.contasEngajadas), serie: serie(extras.contasEngajadas) },
    { id: 'interacoes', rotulo: 'Interações totais', valor: inteiro.format(ig.interacoes), icone: 'pointer', cor: '#16a34a', delta: variacao(ig.interacoes, anterior?.interacoes) },
    { id: 'toques', rotulo: 'Toques no perfil', valor: inteiro.format(ig.cliquesPerfil), icone: 'check', cor: '#c40a0f', delta: variacao(ig.cliquesPerfil, anterior?.cliquesPerfil), extra: 'ligar, rota e e-mail' },
    { id: 'views', rotulo: 'Visualizações', valor: inteiro.format(ig.visualizacoes), icone: 'eye', cor: '#9333ea', delta: variacao(ig.visualizacoes, anterior?.visualizacoes), serie: serie(extras.visualizacoes) },
    { id: 'novos', rotulo: 'Novos seguidores', valor: inteiro.format(ig.novosSeguidores), icone: 'trending', cor: '#0f9d8a', delta: variacao(ig.novosSeguidores, anterior?.novosSeguidores), serie: serie(extras.novosSeguidores), extra: 'saldo no período' },
    { id: 'posts', rotulo: 'Posts publicados', valor: String(ig.posts.length), icone: 'layout', cor: '#f59e0b', delta: variacao(ig.posts.length, anterior?.posts.length), serie: seriePosts },
    ...(cliquesLinkBio === undefined ? [] : [{ id: 'bio', rotulo: 'Cliques no link', valor: cliquesLinkBio === null ? '—' : inteiro.format(cliquesLinkBio), icone: 'link', cor: '#6b7280', extra: cliquesLinkBio === null ? 'sem link rastreado na bio' : 'pelo link da plataforma' } satisfies Metrica]),
  ]
  const interacoes = [
    { nome: 'Curtidas', valor: org.curtidas },
    { nome: 'Comentários', valor: org.comentarios },
    { nome: 'Compartilhamentos', valor: org.compartilhamentos },
    { nome: 'Salvamentos', valor: org.salvamentos },
  ]
  const melhores: PostLista[] = [...ig.posts].sort((a, b) => b.alcance - a.alcance).slice(0, 5).map((p) => ({
    id: p.id,
    titulo: p.legenda.split('\n')[0].slice(0, 70) || `${p.formato} sem legenda`,
    formato: p.formato,
    engajamento: p.alcance ? pct((p.interacoes / p.alcance) * 100) : '—',
    valor: numero.format(p.alcance),
    link: p.link,
    imagem: p.imagem,
  }))
  const formatos = porFormato(ig.posts)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LogoRede slug="instagram" tamanho={34} />
          <div className="min-w-0">
            <h2 className="ins-titulo" style={{ fontSize: 15 }}>Instagram</h2>
            <p className="ins-sub">@{ig.usuario} · consultado hoje, {hora.format(new Date())} · {rotuloPeriodo}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="tabular-nums" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1.1 }}>{inteiro.format(ig.seguidores)}</p>
          <p className="ins-sub">seguidores</p>
        </div>
      </div>
      {seg && <SeguidoresDoPeriodo s={seg} />}
      <PainelInstagram metricas={metricas} dias={dias} interacoes={interacoes} totalInteracoes={org.interacoes} posts={melhores} />
      <SinaisTabela analise={analisarOrganico(ig, dias.length)} />
      {formatos.length > 0 && (
        <CartaoSocial titulo="Desempenho por formato" sub="Média por post publicado no período">
          <div className="overflow-x-auto">
            <table className="ins-tabela min-w-[28rem]">
              <thead>
                <tr><th>Formato</th><th className="text-right">Posts</th><th className="text-right">Alcance médio</th><th className="text-right">Interações médias</th><th className="text-right">Engajamento</th></tr>
              </thead>
              <tbody>
                {formatos.map((f) => (
                  <tr key={f.formato}>
                    <td className="font-medium"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_FORMATO_IG[f.formato] }} />{f.formato}</span></td>
                    <td className="text-right tabular-nums">{f.posts}</td>
                    <td className="text-right tabular-nums">{numero.format(f.alcance)}</td>
                    <td className="text-right tabular-nums">{numero.format(f.interacoes)}</td>
                    <td className="text-right tabular-nums"><span className="inline-flex items-center gap-1.5">{pct(f.engajamento)} {tomEngajamento(f.engajamento) !== 'neutro' && <SeloTom tom={tomEngajamento(f.engajamento)} />}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CartaoSocial>
      )}
    </div>
  )
}
