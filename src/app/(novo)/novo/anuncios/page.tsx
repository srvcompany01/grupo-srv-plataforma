import { ChevronDown, Coins, Eye, Info, MousePointerClick, Percent, Receipt, ShoppingBag, TrendingDown, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { somarDias } from '@/dominio/agenda'
import { ROTULO_STATUS, podeGerirAnuncios } from '@/dominio/controle-anuncios'
import { dataDeHoje } from '@/dominio/filtros'
import type { PagoPorDia } from '@/dominio/insights'
import { METRICAS, barras, diasCompletos, periodoAnterior, somar, valorDe, variacao, type DiaPago, type Metrica } from '@/dominio/painel-anuncios'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { estruturaMeta } from '@/servicos/controle-anuncios'
import { estruturaGoogle, pagoPorDiaGoogle, situacaoGoogle } from '@/servicos/google-agencia'
import { pagoPorDiaMeta } from '@/servicos/meta-anuncios'
import { NomeCliente } from '@/componentes/NomeCliente'
import { LigarCampanha } from './LigarCampanha'

export const maxDuration = 60

type Plataforma = 'meta' | 'google'
type Filtro = 'todas' | 'ativas' | 'pausadas'
type Params = { cliente?: string; dias: string; p?: Plataforma; m: Metrica; c: Filtro }

const PLATAFORMAS: Record<Plataforma, { nome: string; letra: string; fundo: string }> = {
  meta: { nome: 'Meta Ads', letra: 'M', fundo: '#0866ff' },
  google: { nome: 'Google Ads', letra: 'G', fundo: '#ea4335' },
}
const VISUAL: Record<Metrica, { icone: LucideIcon; cor: string }> = {
  investimento: { icone: Wallet, cor: '#d80d12' },
  impressoes: { icone: Eye, cor: '#7c3aed' },
  cliques: { icone: MousePointerClick, cor: '#4f46e5' },
  ctr: { icone: Percent, cor: '#0f766e' },
  cpc: { icone: Coins, cor: '#d97706' },
  conversoes: { icone: ShoppingBag, cor: '#16a34a' },
  cpa: { icone: Receipt, cor: '#db2777' },
  roas: { icone: TrendingUp, cor: '#b45309' },
}
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2 })
const inteiro = (n: number) => Math.round(n).toLocaleString('pt-BR')
function formatar(m: Metrica, v: number | null): string {
  if (v === null) return '—'
  const tipo = METRICAS[m].tipo
  if (tipo === 'reais') return reais(v)
  if (tipo === 'pct') return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
  if (tipo === 'vezes') return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×`
  return inteiro(v)
}
const diaCurto = (d: string) => `${Number(d.slice(8))} ${MESES[Number(d.slice(5, 7)) - 1]}`
const paraDia = (l: PagoPorDia): DiaPago => ({ dia: l.dia, gasto: l.gasto, impressoes: l.impressoes, cliques: l.cliques, conversoes: l.conversoes ?? 0, valor: l.valor ?? 0 })

/** Anúncios no design novo: totais com comparação e tendência, gráfico do indicador escolhido, orçamento do mês e campanhas. */
export default async function AnunciosNovo({ searchParams }: PageProps<'/novo/anuncios'>) {
  const eu = await exigirEquipe()
  const sp = await searchParams
  const texto = (v: unknown) => (typeof v === 'string' ? v : undefined)
  const [clientes, google] = await Promise.all([listarClientes(await criarClienteServidor()), situacaoGoogle()])
  const comAnuncios = clientes.filter((c) => !c.interno && c.status !== 'encerrado' && (c.metaContaId || (c.googleAdsId && google.conectado)))
  const escolhido = comAnuncios.find((c) => c.id === sp.cliente) ?? comAnuncios[0] ?? null
  const plataformas: Plataforma[] = escolhido ? [...(escolhido.metaContaId ? ['meta' as const] : []), ...(escolhido.googleAdsId && google.conectado ? ['google' as const] : [])] : []

  const dias = ['7', '90'].includes(texto(sp.dias) ?? '') ? texto(sp.dias)! : '30'
  const atual: Params = {
    cliente: escolhido?.id,
    dias,
    p: plataformas.find((p) => p === sp.p) ?? plataformas[0],
    m: texto(sp.m) && texto(sp.m)! in METRICAS ? (texto(sp.m) as Metrica) : 'investimento',
    c: sp.c === 'ativas' || sp.c === 'pausadas' ? sp.c : 'todas',
  }
  const link = (mudar: Partial<Params>) => `/novo/anuncios?${new URLSearchParams(Object.entries({ ...atual, ...mudar }).filter((e): e is [string, string] => !!e[1]))}`
  const ate = somarDias(dataDeHoje(new Date()), -1)
  const periodo = { de: somarDias(ate, -(Number(dias) - 1)), ate }

  return (
    <>
      <header className="nv-topo">
        <h1 className="nv-titulo">Anúncios</h1>
        {escolhido && (
          <details className="nv-menu" key={escolhido.id}>
            <summary className="nv-seletor" aria-label="Trocar cliente"><NomeCliente nome={escolhido.nome} /><ChevronDown size={16} aria-hidden="true" /></summary>
            <div>
              {comAnuncios.map((c) => <Link key={c.id} href={`/novo/anuncios?${new URLSearchParams({ cliente: c.id, dias })}`} aria-current={c.id === escolhido.id ? 'true' : undefined}>{c.nome}</Link>)}
            </div>
          </details>
        )}
        <span className="nv-esp" />
        <nav className="nv-pilulas" aria-label="Período">
          {['7', '30', '90'].map((d) => <Link key={d} href={link({ dias: d })} className="nv-pilula" aria-current={dias === d ? 'true' : undefined}>{d} dias</Link>)}
        </nav>
        {escolhido && <Link href={`/anuncios?cliente=${escolhido.id}#controle`} className="nv-botao escuro">Controle completo</Link>}
      </header>

      {!escolhido || !atual.p ? (
        <section className="nv-cartao"><p className="nv-vazio">Nenhum cliente com conta de anúncios cadastrada.</p></section>
      ) : (
        <>
          {plataformas.length > 1 && (
            <nav className="nv-abas" aria-label="Plataforma">
              {plataformas.map((p) => (
                <Link key={p} href={link({ p })} className="nv-aba" aria-current={atual.p === p ? 'true' : undefined}>
                  <i className="nv-logo" style={{ background: PLATAFORMAS[p].fundo }} aria-hidden="true">{PLATAFORMAS[p].letra}</i>{PLATAFORMAS[p].nome}
                </Link>
              ))}
            </nav>
          )}
          <Suspense key={`${escolhido.id}-${dias}-${atual.p}`} fallback={<div className="nv-kpis">{Array.from({ length: 8 }, (_, i) => <div key={i} className="nv-osso" />)}</div>}>
            <DoCliente cliente={escolhido} periodo={periodo} plataformas={plataformas} params={atual as Params & { p: Plataforma }} link={link} podeGerir={podeGerirAnuncios(eu.papel)} />
          </Suspense>
        </>
      )}
    </>
  )
}

type Linha = { id: string; nome: string; tipo: string; ligado: boolean; status: string; orcamento: string; gasto: number; resultados: number; roas: number | null }

async function DoCliente({ cliente, periodo, plataformas, params, link, podeGerir }: { cliente: Cliente; periodo: { de: string; ate: string }; plataformas: Plataforma[]; params: Params & { p: Plataforma }; link: (m: Partial<Params>) => string; podeGerir: boolean }) {
  const p = params.p
  const anterior = periodoAnterior(periodo)
  const inicioMes = `${periodo.ate.slice(0, 8)}01`
  // Uma consulta por plataforma cobre o período, o anterior e o mês corrente.
  const faixa = { de: anterior.de < inicioMes ? anterior.de : inicioMes, ate: periodo.ate }
  const [rMeta, rGoogle, rCampanhas] = await Promise.all([
    plataformas.includes('meta') ? pagoPorDiaMeta(cliente.metaContaId!, faixa) : null,
    plataformas.includes('google') ? pagoPorDiaGoogle(cliente.googleAdsId!, faixa) : null,
    p === 'meta' ? estruturaMeta(cliente.metaContaId!, periodo).catch((e: Error) => ({ erro: e.message })) : estruturaGoogle(cliente.googleAdsId!, periodo),
  ])
  const erros: string[] = []
  const lista = (r: PagoPorDia[] | { erro: string } | null, fonte: string) => {
    if (r && 'erro' in r) erros.push(`${fonte}: ${r.erro}`)
    return r && !('erro' in r) ? r.map(paraDia) : []
  }
  const serie: Record<Plataforma, DiaPago[]> = { meta: lista(rMeta, 'Meta'), google: lista(rGoogle, 'Google Ads') }
  const dias = diasCompletos(periodo, serie[p])
  const total = somar(dias)
  const totalAnterior = somar(diasCompletos(anterior, serie[p]))
  const gastoMes = somar(serie[p].filter((d) => d.dia >= inicioMes)).gasto
  const metricas = (Object.keys(METRICAS) as Metrica[]).filter((m) => m !== 'roas' || total.valor > 0 || totalAnterior.valor > 0)
  const m = metricas.includes(params.m) ? params.m : 'investimento'
  const comparacao = `vs. ${params.dias} dias anteriores`

  let linhas: Linha[] = []
  let diarioAtivo = 0
  if (rCampanhas && 'erro' in rCampanhas) erros.push(`Campanhas: ${rCampanhas.erro}`)
  else if (p === 'meta' && rCampanhas) {
    linhas = (rCampanhas as Awaited<ReturnType<typeof estruturaMeta>>).map((c) => {
      // Orçamento na campanha ou, sem ele, a soma dos conjuntos ligados.
      const diario = c.diario ?? c.filhos.filter((f) => f.ligado).reduce((s, f) => s + (f.diario ?? 0), 0)
      if (c.ligado) diarioAtivo += diario
      return { id: c.id, nome: c.nome, tipo: '', ligado: c.ligado, status: ROTULO_STATUS[c.status] ?? c.status, orcamento: diario ? `${reais(diario)}/dia` : c.total ? `${reais(c.total)} total` : '—', gasto: c.gasto, resultados: c.leads, roas: null }
    })
  } else if (rCampanhas) {
    // ponytail: orçamento compartilhado entre campanhas do Google conta uma vez por campanha; deduplicar pelo recurso se aparecer.
    linhas = (rCampanhas as Exclude<Awaited<ReturnType<typeof estruturaGoogle>>, { erro: string }>).map((c) => {
      const ligado = c.status === 'ENABLED'
      if (ligado) diarioAtivo += c.orcamento?.diario ?? 0
      return { id: c.id, nome: c.nome, tipo: c.tipo, ligado, status: ROTULO_STATUS[c.status] ?? c.status, orcamento: c.orcamento ? `${reais(c.orcamento.diario)}/dia` : '—', gasto: c.custo, resultados: c.conversoes, roas: c.custo && c.valor ? c.valor / c.custo : null }
    })
  }
  linhas.sort((a, b) => b.gasto - a.gasto)
  const visiveis = linhas.filter((l) => params.c === 'todas' || (params.c === 'ativas') === l.ligado)

  const mesAte = periodo.ate
  const diasNoMes = new Date(Date.UTC(Number(mesAte.slice(0, 4)), Number(mesAte.slice(5, 7)), 0)).getUTCDate()
  const previsto = diarioAtivo * diasNoMes
  const usado = previsto ? Math.min(100, (gastoMes / previsto) * 100) : 0

  const porPlataforma = plataformas.map((x) => ({ p: x, gasto: somar(diasCompletos(periodo, serie[x])).gasto }))
  const somaPlataformas = porPlataforma.reduce((s, x) => s + x.gasto, 0)

  const bs = barras(m, dias)
  const maior = Math.max(...bs.map((b) => b.valor), 0)
  const iMaior = bs.findIndex((b) => b.valor === maior && maior > 0)

  return (
    <>
      {erros.length > 0 && <p className="nv-aviso" role="status">{erros.join(' · ')}</p>}

      <section className="nv-kpis" aria-label="Totais">
        {metricas.map((k) => {
          const V = VISUAL[k]
          return (
            <Link key={k} href={link({ m: k })} scroll={false} className="nv-kpi-card" aria-current={k === m ? 'true' : undefined}>
              <div className="nv-kpi-topo">
                <i style={{ background: V.cor }} aria-hidden="true"><V.icone /></i>
                <span>{METRICAS[k].nome}</span>
                <span className="nv-ajuda" title={METRICAS[k].ajuda} aria-label={METRICAS[k].ajuda}><Info aria-hidden="true" /></span>
              </div>
              <span className="nv-numero">{formatar(k, valorDe(k, total))}</span>
              <Variacao m={k} atual={valorDe(k, total)} anterior={valorDe(k, totalAnterior)} legenda={comparacao} />
              <Tendencia valores={dias.map((d) => valorDe(k, d) ?? 0)} cor={V.cor} />
            </Link>
          )
        })}
      </section>

      <div className="nv-meio">
        <section className="nv-cartao">
          <span className="nv-rotulo">{METRICAS[m].nome} · {PLATAFORMAS[p].nome}</span>
          <div className="nv-total">
            <span className="nv-numero">{formatar(m, valorDe(m, total))}</span>
            <Variacao m={m} atual={valorDe(m, total)} anterior={valorDe(m, totalAnterior)} legenda={comparacao} />
          </div>
          <div className="nv-barras" role="img" aria-label={`${METRICAS[m].nome} por ${bs.length < dias.length ? `grupos de ${Math.ceil(dias.length / bs.length)} dias` : 'dia'}`}>
            {bs.map((b, i) => (
              <div key={b.dia} className={i === iMaior ? 'nv-barra maior' : 'nv-barra'}>
                <div><span style={{ height: `${maior ? Math.max(3, (b.valor / maior) * 100) : 3}%` }}>{i === iMaior && <em>{formatar(m, b.valor)}</em>}</span></div>
                <small>{diaCurto(b.dia)}</small>
              </div>
            ))}
          </div>
        </section>

        <div className="nv-coluna">
          <section className="nv-cartao">
            <div className="nv-cab"><h2>Orçamento do mês</h2><span className="nv-esp" />{previsto > 0 && <span className="nv-rotulo">{Math.round(usado)}% usado</span>}</div>
            <p className="nv-orc"><b>{reais(gastoMes)}</b> {previsto > 0 ? <span className="nv-rotulo">de {reais(previsto)} previstos</span> : <span className="nv-rotulo">investidos em {MESES_LONGOS[Number(mesAte.slice(5, 7)) - 1]}</span>}</p>
            {previsto > 0 && (
              <>
                <div className="nv-orc-barra" aria-hidden="true"><i style={{ width: `${usado}%` }} /></div>
                <span className="nv-rotulo">Saldo restante: <b>{reais(Math.max(0, previsto - gastoMes))}</b> · previsto pelos orçamentos diários das campanhas ligadas, até ontem</span>
              </>
            )}
            {previsto === 0 && <span className="nv-rotulo">Sem campanha ligada com orçamento diário.</span>}
          </section>

          <section className="nv-cartao">
            <h2>Investimento por plataforma</h2>
            {porPlataforma.map((x) => {
              const pct = somaPlataformas ? (x.gasto / somaPlataformas) * 100 : 0
              return (
                <div key={x.p} className="nv-plat">
                  <div><i className="nv-logo peq" style={{ background: PLATAFORMAS[x.p].fundo }} aria-hidden="true">{PLATAFORMAS[x.p].letra}</i><span>{PLATAFORMAS[x.p].nome}</span><span className="nv-esp" /><b>{reais(x.gasto)}</b><span className="nv-rotulo">{Math.round(pct)}%</span></div>
                  <div className="nv-plat-barra" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </section>
        </div>
      </div>

      <section className="nv-cartao">
        <div className="nv-cab">
          <h2>Campanhas</h2><span className="nv-rotulo">{linhas.length} em {PLATAFORMAS[p].nome}</span><span className="nv-esp" />
          <nav className="nv-pilulas peq" aria-label="Filtrar campanhas">
            {(['todas', 'ativas', 'pausadas'] as const).map((c) => <Link key={c} href={link({ c })} scroll={false} className="nv-pilula" aria-current={params.c === c ? 'true' : undefined}>{c[0].toUpperCase() + c.slice(1)}</Link>)}
          </nav>
        </div>
        {visiveis.length ? (
          <div className="nv-tabela-caixa">
            <table className="nv-tabela">
              <thead><tr><th>Campanha</th><th>Status</th><th>Orçamento</th><th>Investido</th><th>Resultados</th><th>Custo/result.</th><th>ROAS</th><th><span className="sr-only">Ligar ou pausar</span></th></tr></thead>
              <tbody>
                {visiveis.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.nome}</strong>{l.tipo && <small>{l.tipo}</small>}</td>
                    <td><span className={l.ligado ? 'nv-status ativa' : 'nv-status'}>{l.status}</span></td>
                    <td>{l.orcamento}</td>
                    <td><b>{reais(l.gasto)}</b></td>
                    <td>{inteiro(l.resultados)}</td>
                    <td>{l.resultados ? reais(l.gasto / l.resultados) : '—'}</td>
                    <td>{l.roas === null ? '—' : <b className={l.roas >= 1 ? 'nv-bom' : undefined}>{formatar('roas', l.roas)}</b>}</td>
                    <td><LigarCampanha clienteId={cliente.id} plataforma={p} id={l.id} nome={l.nome} ligado={l.ligado} podeGerir={podeGerir} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="nv-vazio">Nenhuma campanha {params.c === 'todas' ? '' : params.c.slice(0, -1) + ' '}nesta conta.</p>}
      </section>
    </>
  )
}

/** Selo de variação: verde quando melhora (para custo, melhorar é cair), vermelho quando piora. */
function Variacao({ m, atual, anterior, legenda }: { m: Metrica; atual: number | null; anterior: number | null; legenda: string }) {
  const v = variacao(atual, anterior)
  if (v === null) return <div className="nv-var"><span>sem base para comparar</span></div>
  const bom = v === 0 || v > 0 === METRICAS[m].melhorSobe
  const Seta = v >= 0 ? TrendingUp : TrendingDown
  return (
    <div className="nv-var">
      <b className={bom ? 'bom' : 'ruim'}><Seta aria-hidden="true" />{v > 0 ? '+' : ''}{v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</b>
      <span>{legenda}</span>
    </div>
  )
}

/** Linha fina com o valor de cada dia do período. */
function Tendencia({ valores, cor }: { valores: number[]; cor: string }) {
  const max = Math.max(...valores)
  const min = Math.min(...valores)
  const pontos = valores.map((v, i) => `${(i / Math.max(1, valores.length - 1)) * 100},${22 - ((v - min) / (max - min || 1)) * 20}`).join(' ')
  return (
    <svg className="nv-spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pontos} fill="none" stroke={cor} strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
