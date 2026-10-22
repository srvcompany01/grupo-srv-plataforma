import { ExternalLink, Megaphone, PlayCircle } from 'lucide-react'
import { Modulo } from '@/componentes/Modulo'
import Link from 'next/link'
import { totaisAnuncios, type AnuncioAvaliado, type Desempenho, type Ranking } from '@/dominio/anuncios-meta'
import { anunciosAtivos } from '@/servicos/meta-anuncios'

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`

const SELO: Record<Desempenho, { rotulo: string; classe: string }> = {
  bom: { rotulo: 'Bom desempenho', classe: 'bg-sucesso-fundo text-sucesso-forte' },
  medio: { rotulo: 'Na média', classe: 'bg-aviso-fundo text-aviso-forte' },
  fraco: { rotulo: 'Fraco', classe: 'bg-perigo-fundo text-perigo-forte' },
  'poucos-dados': { rotulo: 'Poucos dados ainda', classe: 'bg-fundo text-texto-3' },
}
const RANK: Record<NonNullable<Ranking>, string> = { acima: 'acima da média', media: 'na média', abaixo: 'abaixo da média' }

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-micro text-texto-3">{rotulo}</p>
      <p className="truncate text-rotulo font-semibold tabular-nums text-texto">{valor}</p>
    </div>
  )
}

function Cartao({ a, mostrarGasto }: { a: AnuncioAvaliado; mostrarGasto: boolean }) {
  const diag = [['Qualidade', a.qualidade], ['Engajamento', a.engajamento], ['Conversão', a.conversao]].filter(([, v]) => v) as [string, NonNullable<Ranking>][]
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-borda bg-white">
      <div className="relative aspect-square bg-fundo">
        {a.imagem && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Meta (URL assinada que expira)
          <img src={a.imagem} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        {a.video && <PlayCircle className="absolute right-2 top-2 h-6 w-6 text-white drop-shadow" aria-label="Vídeo" />}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-legenda font-semibold ${SELO[a.desempenho].classe}`} title={a.motivos.join('\n')}>{SELO[a.desempenho].rotulo}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="truncate text-rotulo font-semibold text-texto" title={a.nome}>{a.titulo || a.nome}</p>
          {a.texto && <p className="line-clamp-2 text-legenda text-texto-2">{a.texto}</p>}
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-borda pt-2">
          <Metrica rotulo="Impressões" valor={numero.format(a.impressoes)} />
          <Metrica rotulo="Alcance" valor={numero.format(a.alcance)} />
          <Metrica rotulo="CTR" valor={pct(a.ctr)} />
          <Metrica rotulo="Cliques" valor={numero.format(a.cliques)} />
          <Metrica rotulo={a.video ? 'Visualizações' : 'Frequência'} valor={a.video ? numero.format(a.visualizacoesVideo) : a.frequencia.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} />
          {mostrarGasto ? <Metrica rotulo="Investido" valor={reais.format(a.gasto)} /> : <Metrica rotulo="CPM" valor={reais.format(a.cpm)} />}
        </div>
        {(a.motivos.length > 0 || diag.length > 0) && (
          <ul className="space-y-0.5 text-micro text-texto-2">
            {a.motivos.map((m) => <li key={m}>• {m}</li>)}
            {diag.length > 0 && <li className="text-texto-3">Meta: {diag.map(([k, v]) => `${k} ${RANK[v]}`).join(' · ')}</li>}
          </ul>
        )}
        {a.link && (
          <a href={a.link} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1 text-legenda font-semibold text-[#0866ff] hover:underline">
            Ver o anúncio publicado <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </li>
  )
}

/**
 * Anúncios ativos da conta do cliente com os resultados do período, puxados da API de Marketing do Meta.
 * `mostrarGasto` só para a equipe (o cliente vê resultados, não o investimento). `href` troca o período.
 */
export async function GaleriaAnuncios({ contaId, dias, mostrarGasto, href }: { contaId: string; dias: 7 | 30; mostrarGasto: boolean; href: (dias: 7 | 30) => string }) {
  const r = await anunciosAtivos(contaId, dias)
  const chip = (ativo: boolean) => `rounded-md px-2.5 py-1 text-rotulo font-semibold ${ativo ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`
  const periodo = (
    <nav className="flex gap-0.5 rounded-lg bg-fundo p-0.5" aria-label="Período dos resultados">
      {([7, 30] as const).map((d) => <Link key={d} href={href(d)} scroll={false} className={chip(d === dias)}>Últimos {d} dias</Link>)}
    </nav>
  )
  return (
    <Modulo icone={Megaphone} titulo="Anúncios ativos" descricao={`Facebook e Instagram · resultados dos últimos ${dias} dias, direto do Meta`} acoes={periodo}>
      <div className="@container space-y-3">
      {'erro' in r ? (
        <p className="rounded-xl border border-perigo-borda bg-perigo-fundo/40 px-3 py-2 text-rotulo text-perigo-forte">{r.erro}</p>
      ) : r.anuncios.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda py-10 text-center text-corpo text-texto-3">Nenhum anúncio ativo nesta conta agora.</p>
      ) : (
        <>
          <Resumo anuncios={r.anuncios} mostrarGasto={mostrarGasto} />
          <ul className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">{r.anuncios.map((a) => <Cartao key={a.id} a={a} mostrarGasto={mostrarGasto} />)}</ul>
          <p className="text-legenda text-texto-3">Dados do Meta, atualizados a cada 30 minutos. &quot;Bom&quot; e &quot;Fraco&quot; comparam o CTR com a média dos anúncios deste cliente e usam o diagnóstico da Meta (com 500+ impressões).</p>
        </>
      )}
      </div>
    </Modulo>
  )
}

function Resumo({ anuncios, mostrarGasto }: { anuncios: AnuncioAvaliado[]; mostrarGasto: boolean }) {
  const t = totaisAnuncios(anuncios)
  const bons = anuncios.filter((a) => a.desempenho === 'bom').length
  const fracos = anuncios.filter((a) => a.desempenho === 'fraco').length
  const itens: [string, string][] = [
    ['Anúncios ativos', String(anuncios.length)],
    ['Impressões', numero.format(t.impressoes)],
    ['Cliques', numero.format(t.cliques)],
    ['CTR geral', pct(t.ctr)],
    ...(t.visualizacoesVideo ? [['Visualizações de vídeo', numero.format(t.visualizacoesVideo)] as [string, string]] : []),
    ...(mostrarGasto ? [['Investido', reais.format(t.gasto)] as [string, string]] : []),
    ['Bons / fracos', `${bons} / ${fracos}`],
  ]
  return (
    <div className="grid grid-cols-2 gap-2 @xl:grid-cols-4 @5xl:grid-cols-7">
      {itens.map(([r, v]) => (
        <div key={r} className="rounded-xl border border-borda bg-white p-2.5">
          <p className="text-micro text-texto-3">{r}</p>
          <p className="text-destaque font-bold tabular-nums text-texto">{v}</p>
        </div>
      ))}
    </div>
  )
}
