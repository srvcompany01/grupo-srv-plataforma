import { ExternalLink, Heart, PlayCircle } from 'lucide-react'
import { COR_FORMATO_IG } from '@/componentes/insights/InstagramInsights'
import { SeguidoresDoPeriodo } from '@/componentes/insights/SeguidoresDoPeriodo'
import { SeloTom } from '@/componentes/insights/tom'
import { LogoRede } from '@/componentes/redes/LogoRede'
import { analisarOrganico, engajamentoOrganico, metricasOrganicas, porFormato, separarSeguidores, tomEngajamento, tomVariacao, type ResumoInstagram } from '@/dominio/insights'
import { EvolucaoSocial } from './EvolucaoSocial'
import { SinaisTabela } from './SinaisTabela'
import type { Explicacao } from './ComoCalculamos'
import { CartaoSocial, FaixaKpis, type Kpi } from './Social'

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const inteiro = new Intl.NumberFormat('pt-BR')
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Belem' })
const diaLocal = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Belem' })

const API = 'API do Instagram (Meta)'
const HORA = 'a cada hora'
const ex = (formula: string, excluido?: string): Explicacao => ({ formula, fonte: API, atualizado: HORA, excluido })

/** Instagram de um cliente: faixa de métricas, gráfico em foco + interações, sinais, formatos e melhores posts. */
export function InstagramSocial({ ig, dias, rotuloPeriodo, cliquesLinkBio, seguidoresPagos }: { ig: ResumoInstagram; dias: string[]; rotuloPeriodo: string; cliquesLinkBio?: number | null; seguidoresPagos?: number | null }) {
  const org = metricasOrganicas(ig)
  const seg = seguidoresPagos === undefined ? null : separarSeguidores({ ganhos: ig.seguidoresGanhos, perdidos: ig.seguidoresPerdidos, pagos: seguidoresPagos })
  const soma = (campo: 'alcance' | 'interacoes' | 'visualizacoes' | 'um') => {
    const m = new Map<string, number>()
    for (const p of ig.posts) {
      const d = diaLocal.format(new Date(p.em))
      m.set(d, (m.get(d) ?? 0) + (campo === 'um' ? 1 : p[campo]))
    }
    return dias.map((d) => m.get(d) ?? 0)
  }
  const alcanceConta = new Map(ig.alcancePorDia.map((a) => [a.dia, a.valor]))
  const serieConta = dias.map((d) => alcanceConta.get(d) ?? 0)
  const serieAlcance = soma('alcance')
  const serieInter = soma('interacoes')
  const serieViews = soma('visualizacoes')
  const seriePosts = soma('um')
  const eng = engajamentoOrganico(ig)
  const porSemana = (ig.posts.length / Math.max(1, dias.length)) * 7
  const tomSeg = tomVariacao(ig.novosSeguidores)
  const kpis: Kpi[] = [
    { id: 'seg', rotulo: 'Seguidores', valor: inteiro.format(ig.seguidores), chip: ig.novosSeguidores ? { valor: `${ig.novosSeguidores > 0 ? '+' : ''}${numero.format(ig.novosSeguidores)}`, sentido: ig.novosSeguidores > 0 ? 'sobe' : 'desce', tom: tomSeg === 'ruim' ? 'ruim' : 'bom', texto: ' no período' } : undefined, explicacao: ex('seguidores hoje; saldo = ganhos − perdidos no período'), foco: true },
    { id: 'alc', rotulo: 'Alcance da conta', valor: inteiro.format(ig.alcance), extra: 'inclui anúncios', serie: serieConta, explicacao: ex('contas únicas alcançadas no período', 'nada: soma orgânico e pago, o Instagram não separa no total da conta') },
    { id: 'eng', rotulo: 'Engajamento dos posts', valor: eng === null ? '—' : pct(eng), extra: eng === null ? 'sem posts no período' : 'interações ÷ alcance', medidor: eng === null ? undefined : { posicao: Math.min(1, eng / 6), tom: tomEngajamento(eng) }, explicacao: ex('(curtidas + comentários + salvamentos + compartilhamentos) ÷ alcance dos posts', 'interações da conta que não vieram de posts do período') },
    { id: 'int', rotulo: 'Interações nos posts', valor: inteiro.format(org.interacoes), serie: serieInter, explicacao: ex('curtidas + comentários + salvamentos + compartilhamentos dos posts do período', 'posts publicados fora do período') },
    { id: 'views', rotulo: 'Visualizações dos posts', valor: inteiro.format(org.visualizacoes), serie: serieViews, explicacao: ex('soma das visualizações de cada post publicado no período', 'visualizações de anúncios') },
    { id: 'alcp', rotulo: 'Alcance dos posts', valor: inteiro.format(org.alcance), extra: ig.seguidores && org.posts ? `${pct((org.alcance / org.posts / ig.seguidores) * 100)} da base por post` : undefined, serie: serieAlcance, explicacao: ex('soma do alcance de cada post; % da base = alcance ÷ posts ÷ seguidores', 'alcance pago') },
    { id: 'posts', rotulo: 'Posts publicados', valor: String(ig.posts.length), extra: `${porSemana.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por semana`, serie: seriePosts, explicacao: ex('posts, Reels e carrosséis publicados no período', 'Stories') },
    { id: 'engc', rotulo: 'Contas engajadas', valor: inteiro.format(ig.contasEngajadas), extra: 'contas únicas que interagiram', explicacao: ex('contas únicas que curtiram, comentaram, salvaram ou compartilharam') },
    ...(cliquesLinkBio === undefined ? [] : [{ id: 'bio', rotulo: 'Cliques no link da bio', valor: cliquesLinkBio === null ? '—' : inteiro.format(cliquesLinkBio), extra: cliquesLinkBio === null ? 'sem link rastreado na bio' : 'pelo link da plataforma', explicacao: { formula: 'cliques registrados no link da bio do cliente', fonte: 'página da bio da plataforma', atualizado: 'em tempo real' } }]),
    { id: 'toques', rotulo: 'Toques nos botões de contato', valor: inteiro.format(ig.cliquesPerfil), extra: 'ligar, rota e e-mail', explicacao: ex('toques em ligar, como chegar e e-mail do perfil') },
  ]
  const interacoes = [
    { nome: 'Curtidas', valor: org.curtidas, cor: '#12b76a' },
    { nome: 'Comentários', valor: org.comentarios, cor: '#2a78d6' },
    { nome: 'Salvamentos', valor: org.salvamentos, cor: '#f0a928' },
    { nome: 'Compartilhamentos', valor: org.compartilhamentos, cor: '#e5484d' },
  ]
  const maiorInteracao = Math.max(1, ...interacoes.map((i) => i.valor))
  const formatos = porFormato(ig.posts)
  const melhores = [...ig.posts].sort((a, b) => b.interacoes - a.interacoes).slice(0, 6)
  const analise = analisarOrganico(ig, dias.length)
  return (
    <div className="flex flex-col gap-2">
      <CartaoSocial>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <LogoRede slug="instagram" tamanho={36} />
            <div className="min-w-0">
              <h2 className="ins-titulo" style={{ fontSize: 16 }}>Instagram</h2>
              <p className="ins-sub">@{ig.usuario} · {ig.posts.length} publicações · {rotuloPeriodo}</p>
            </div>
          </div>
          <span className="ins-pilula"><i />dados do Instagram · atualiza {HORA}</span>
        </div>
      </CartaoSocial>
      {seg && <SeguidoresDoPeriodo s={seg} />}
      <FaixaKpis itens={kpis} />
      <div className="ins-principal">
        <CartaoSocial titulo="Evolução" sub={`Últimos ${dias.length} dias · passe o mouse para ver o valor do dia`}>
          <EvolucaoSocial dias={dias} metricas={[
            { id: 'conta', nome: 'Alcance da conta', valores: serieConta },
            { id: 'alcp', nome: 'Alcance dos posts', valores: serieAlcance },
            { id: 'int', nome: 'Interações dos posts', valores: serieInter },
            { id: 'views', nome: 'Visualizações dos posts', valores: serieViews },
            { id: 'posts', nome: 'Posts publicados', valores: seriePosts },
          ]} />
        </CartaoSocial>
        <CartaoSocial titulo="Como as pessoas interagem" sub={`Soma dos últimos ${dias.length} dias`}>
          <p className="ins-grande mb-4">{inteiro.format(org.interacoes)}</p>
          <ul className="ins-legenda">
            {interacoes.map((i) => (
              <li key={i.nome}>
                <div><span><span className="pt" style={{ background: i.cor }} />{i.nome}</span><span className="tabular-nums" style={{ color: 'var(--ins-suave)' }}>{inteiro.format(i.valor)}</span></div>
                <div className="ins-barra"><span style={{ width: `${Math.max(2, (i.valor / maiorInteracao) * 100)}%`, background: i.cor }} /></div>
              </li>
            ))}
          </ul>
        </CartaoSocial>
      </div>
      <SinaisTabela analise={analise} />
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
      {melhores.length > 0 && (
        <CartaoSocial titulo="Melhores posts do período" sub="Ordenados por interações">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {melhores.map((p) => (
              <li key={p.id} className="ins-post">
                <a href={p.link} target="_blank" rel="noreferrer" className="block">
                  <div className="relative aspect-square" style={{ background: 'var(--bg-active)' }}>
                    {p.imagem && (
                      // eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Instagram (URL que expira)
                      <img src={p.imagem} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                    {p.formato === 'Reels' && <PlayCircle className="absolute right-2 top-2 h-5 w-5 text-white drop-shadow" aria-label="Reels" />}
                    <span className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10.5px] font-semibold text-white" style={{ background: COR_FORMATO_IG[p.formato] }}>{p.formato}</span>
                  </div>
                  <div className="space-y-0.5 p-2.5">
                    <p className="flex items-center justify-between text-[11px]" style={{ color: 'var(--ins-suave)' }}><span>{quando.format(new Date(p.em))}</span><ExternalLink className="h-3 w-3" /></p>
                    <p className="flex items-center gap-1 text-[13px] font-semibold tabular-nums"><Heart className="h-3.5 w-3.5" style={{ color: '#e5484d' }} aria-hidden />{numero.format(p.interacoes)} interações</p>
                    <p className="text-[11px]" style={{ color: 'var(--ins-suave)' }}>{numero.format(p.alcance)} de alcance · {numero.format(p.salvamentos)} salvos</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </CartaoSocial>
      )}
    </div>
  )
}
