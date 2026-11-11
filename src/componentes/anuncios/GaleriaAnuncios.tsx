import { ExternalLink, Megaphone, PlayCircle } from 'lucide-react'
import { Modulo } from '@/componentes/Modulo'
import type { ReactNode } from 'react'
import { rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { totaisAnuncios, type AnuncioAvaliado, type Desempenho, type Ranking } from '@/dominio/anuncios-meta'
import { anunciosAtivos, nomeDaConta } from '@/servicos/meta-anuncios'

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
    <div>
      <p>{rotulo}</p>
      <p>{valor}</p>
    </div>
  )
}

function Cartao({ a, mostrarGasto }: { a: AnuncioAvaliado; mostrarGasto: boolean }) {
  const diag = [['Qualidade', a.qualidade], ['Engajamento', a.engajamento], ['Conversão', a.conversao]].filter(([, v]) => v) as [string, NonNullable<Ranking>][]
  return (
    <li>
      <div>
        {a.imagem && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Meta (URL assinada que expira)
          <img src={a.imagem} alt="" loading="lazy" />
        )}
        {a.video && <PlayCircle aria-label="Vídeo" />}
        <span title={a.motivos.join('\n')}>{SELO[a.desempenho].rotulo}</span>
      </div>
      <div>
        <div>
          <p title={a.nome}>{a.titulo || a.nome}</p>
          <p>
            <span
              title={a.papel === 'lead' ? 'Gera conversas/leads: avaliado pelo custo por resultado' : 'Tráfego/conteúdo para o Instagram: traz seguidores e visitas que viram lead depois; avaliado pelo custo do clique, não por leads'}
            >
              {a.papel === 'lead' ? 'Leads' : 'Marca'}
            </span>
            {(a.campanha || a.conjunto) && <span title={`${a.campanha} › ${a.conjunto}`}>{a.conjunto || a.campanha}</span>}
          </p>
          {a.texto && <p>{a.texto}</p>}
        </div>
        <div>
          <Metrica rotulo="Impressões" valor={numero.format(a.impressoes)} />
          <Metrica rotulo="Alcance" valor={numero.format(a.alcance)} />
          <Metrica rotulo="CTR" valor={pct(a.ctr)} />
          <Metrica rotulo="Cliques" valor={numero.format(a.cliques)} />
          <Metrica rotulo={a.video ? 'Visualizações' : 'Frequência'} valor={a.video ? numero.format(a.visualizacoesVideo) : a.frequencia.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} />
          {mostrarGasto ? <Metrica rotulo="Investido" valor={reais.format(a.gasto)} /> : <Metrica rotulo="CPM" valor={reais.format(a.cpm)} />}
          <Metrica rotulo="Resultados" valor={numero.format(a.resultados)} />
          {mostrarGasto && <Metrica rotulo="Custo/resultado" valor={a.custoPorResultado === null ? '—' : reais.format(a.custoPorResultado)} />}
          <Metrica rotulo="Cliques no link" valor={numero.format(a.cliquesLink)} />
        </div>
        {(a.motivos.length > 0 || diag.length > 0) && (
          <ul>
            {a.motivos.map((m) => <li key={m}>• {m}</li>)}
            {diag.length > 0 && <li>Meta: {diag.map(([k, v]) => `${k} ${RANK[v]}`).join(' · ')}</li>}
          </ul>
        )}
        {a.link && (
          <a href={a.link} target="_blank" rel="noreferrer">
            Ver o anúncio publicado <ExternalLink />
          </a>
        )}
      </div>
    </li>
  )
}

/**
 * Anúncios ativos da conta do cliente com os resultados do período, puxados da API de Marketing do Meta.
 * `mostrarGasto` só para a equipe (o cliente vê resultados, não o investimento). `seletor` troca o período.
 */
export async function GaleriaAnuncios({ contaId, periodo, mostrarGasto, seletor, incorporado = false }: { contaId: string; periodo: PeriodoAnuncios; mostrarGasto: boolean; seletor: ReactNode; /** Dentro de outro módulo: sem o cartão próprio, só um subtítulo. */ incorporado?: boolean }) {
  const [r, conta] = await Promise.all([anunciosAtivos(contaId, periodo), mostrarGasto ? nomeDaConta(contaId) : Promise.resolve(null)])
  const corpo = (
      <div>
      {'erro' in r ? (
        <p>{r.erro}</p>
      ) : r.anuncios.length === 0 ? (
        <p>Nenhum anúncio ativo nesta conta agora.</p>
      ) : (
        <>
          <Resumo anuncios={r.anuncios} mostrarGasto={mostrarGasto} />
          <ul>{r.anuncios.map((a) => <Cartao key={a.id} a={a} mostrarGasto={mostrarGasto} />)}</ul>
          <p>
            {periodo.atalho === 'hoje' ? 'Dados consultados agora na Meta; a própria Meta pode levar alguns minutos para consolidar o dia. ' : 'Dados do Meta, atualizados a cada 30 minutos. '}Cada anúncio é avaliado pelo objetivo da campanha, comparando só com os do mesmo tipo (com 500+ impressões):{' '}
            <strong>Leads</strong> (conversas no WhatsApp/Direct, formulário) pelo custo por resultado;{' '}
            <strong>Marca</strong> (tráfego e conteúdo para o Instagram) pelo custo do clique e CTR no link, porque o papel dela é levar pessoas ao perfil, que viram lead depois.
          </p>
        </>
      )}
      </div>
  )
  const sub = `${conta ? `Conta "${conta}" (act_${contaId}) · ` : ''}Facebook e Instagram`
  if (incorporado) return <div><h3>Anúncios ativos <span>{sub}</span></h3>{corpo}</div>
  return <Modulo icone={Megaphone} titulo="Anúncios ativos" descricao={`${sub} · ${rotuloPeriodo(periodo)}`} acoes={seletor}>{corpo}</Modulo>
}

function Resumo({ anuncios, mostrarGasto }: { anuncios: AnuncioAvaliado[]; mostrarGasto: boolean }) {
  const t = totaisAnuncios(anuncios)
  const captacao = totaisAnuncios(anuncios.filter((a) => a.papel === 'lead'))
  const reconhecimento = totaisAnuncios(anuncios.filter((a) => a.papel === 'marca'))
  const bons = anuncios.filter((a) => a.desempenho === 'bom').length
  const fracos = anuncios.filter((a) => a.desempenho === 'fraco').length
  const itens: [string, string][] = [
    ['Anúncios ativos', String(anuncios.length)],
    ...(mostrarGasto ? [['Captação · investido', reais.format(captacao.gasto)] as [string, string], ['Captação · resultados', numero.format(captacao.resultados)] as [string, string], ['Captação · CPL', captacao.custoPorResultado === null ? '—' : reais.format(captacao.custoPorResultado)] as [string, string], ['Reconhecimento · investido', reais.format(reconhecimento.gasto)] as [string, string], ['Reconhecimento · cliques', numero.format(reconhecimento.cliquesLink)] as [string, string], ['Reconhecimento · CPC', reconhecimento.cliquesLink ? reais.format(reconhecimento.gasto / reconhecimento.cliquesLink) : '—'] as [string, string]] : []),
    ['Impressões', numero.format(t.impressoes)],
    ['CTR geral', pct(t.ctr)],
    ...(t.visualizacoesVideo ? [['Visualizações de vídeo', numero.format(t.visualizacoesVideo)] as [string, string]] : []),
    ['Bons / fracos', `${bons} / ${fracos}`],
  ]
  return (
    <div>
      {itens.map(([r, v]) => (
        <div key={r}>
          <p>{r}</p>
          <p>{v}</p>
        </div>
      ))}
    </div>
  )
}
