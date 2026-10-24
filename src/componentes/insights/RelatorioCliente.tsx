import { BarChart3, Combine, Eye, Megaphone, MousePointerClick, Search, Sprout, Target, TriangleAlert, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Modulo } from '@/componentes/Modulo'
import { analisarCombinado, analisarOrganico, analisarPago, engajamentoOrganico, tomCtrMeta, tomEngajamento, type Tom } from '@/dominio/insights'
import { diasDoPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import type { DadosDoCliente } from '@/servicos/relatorio-cliente'
import { BlocoAnalise, Numeros } from './BlocoAnalise'
import { EmBreve } from './EmBreve'
import { GraficoDiario } from './GraficoDiario'
import { InstagramInsights } from './InstagramInsights'
import { SeloTom } from './tom'

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const reaisCurto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

/** Cada parte do relatório tem a sua cor (azul = pago, rosa = orgânico, violeta = os dois juntos). */
function Secao({ icone: Icone, titulo, descricao, cor, children }: { icone: typeof Megaphone; titulo: string; descricao: string; cor: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border-l-4 bg-white pl-3" style={{ borderLeftColor: cor }}>
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: cor }}><Icone className="h-4 w-4" /></span>
        <div>
          <h3 className="text-corpo font-semibold text-texto">{titulo}</h3>
          <p className="text-legenda text-texto-3">{descricao}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

/** Relatório do cliente em três partes: tráfego pago, orgânico e os dois juntos (com gráficos e recomendações). */
export function RelatorioCliente({ dados, periodo, seletor, extraOrganico }: { dados: DadosDoCliente; periodo: PeriodoAnuncios; seletor: ReactNode; extraOrganico?: ReactNode }) {
  const { ig, pago, pagoPorDia } = dados
  const dias = diasDoPeriodo(periodo)
  const total = (pago.meta?.gasto ?? 0) + (pago.google?.custo ?? 0)
  const pagoDia = new Map(pagoPorDia.map((d) => [d.dia, d]))
  const igDia = new Map((ig?.alcancePorDia ?? []).map((d) => [d.dia, d.valor]))
  const cliquesPagos = (pago.meta?.cliques ?? 0) + (pago.google?.cliques ?? 0)
  const tomConversao: Tom | undefined = !pago.google ? undefined : pago.google.conversoes > 0 ? 'bom' : pago.google.custo > 0 ? 'ruim' : 'neutro'
  return (
    <Modulo icone={BarChart3} titulo="Relatório do cliente" descricao={`Tráfego pago, orgânico e os dois juntos · ${rotuloPeriodo(periodo)}`} acoes={seletor}>
      <div className="space-y-5">
        {dados.erros.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-legenda text-aviso-forte">
            {dados.erros.map((e) => <li key={e} className="flex gap-1.5"><TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />{e}</li>)}
          </ul>
        )}

        <Secao icone={Megaphone} titulo="Tráfego pago" descricao="Meta (Facebook e Instagram) e Google Ads" cor="#2a78d6">
          {(pago.meta || pago.google) && (
            <Numeros
              itens={[
                { rotulo: 'Investido', valor: reais.format(total), icone: Wallet, cor: '#2a78d6' },
                { rotulo: 'Meta', valor: pago.meta ? reais.format(pago.meta.gasto) : '—', extra: pago.meta ? `${pago.meta.anuncios} anúncios ativos` : 'sem conta', tom: pago.meta ? (pago.meta.fracos ? 'atencao' : 'bom') : undefined, icone: Megaphone, cor: '#0866ff' },
                { rotulo: 'Google Ads', valor: pago.google ? reais.format(pago.google.custo) : '—', extra: pago.google ? `${pago.google.campanhas} campanhas` : 'sem conta', icone: Search, cor: '#eb6834' },
                { rotulo: 'Impressões (Meta)', valor: numero.format(pago.meta?.impressoes ?? 0), icone: Eye, cor: '#1baf7a' },
                { rotulo: 'Cliques', valor: numero.format(cliquesPagos), extra: pago.meta ? `CTR Meta ${pct(pago.meta.ctr)}` : undefined, tom: pago.meta ? tomCtrMeta(pago.meta.ctr) : undefined, icone: MousePointerClick, cor: '#e87ba4' },
                { rotulo: 'Conversões (Google)', valor: pago.google ? pago.google.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—', tom: tomConversao, icone: Target, cor: '#008300' },
              ]}
            />
          )}
          <BlocoAnalise analise={analisarPago(pago)} />
          <EmBreve itens={['TikTok Ads', 'LinkedIn Ads']} />
        </Secao>

        <Secao icone={Sprout} titulo="Orgânico" descricao="Instagram (e, quando liberados, Google Meu Negócio e TikTok)" cor="#d55181">
          {ig ? (
            <>
              <InstagramInsights ig={ig} dias={dias} />
              <BlocoAnalise analise={analisarOrganico(ig, dias.length)} />
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-borda px-3 py-4 text-center text-rotulo text-texto-3">Sem Instagram ligado: preencha a Página do Facebook do cliente no cadastro (o Instagram profissional precisa estar ligado a ela).</p>
          )}
          {extraOrganico}
          <EmBreve itens={['TikTok', 'YouTube', 'Facebook (Página)']} />
        </Secao>

        <Secao icone={Combine} titulo="Pago + orgânico" descricao="Como o investimento e o perfil andam juntos no período" cor="#6250d6">
          {(pago.meta || pago.google) && ig ? (
            <>
              <div className="grid gap-4 xl:grid-cols-2">
                <GraficoDiario titulo="Investimento por dia (Meta + Google)" dias={dias} series={[{ nome: 'Investido', valores: dias.map((d) => pagoDia.get(d)?.gasto ?? 0) }]} formato={(n) => reaisCurto.format(n)} tipo="barras" />
                <GraficoDiario
                  titulo="Alcance por dia"
                  dias={dias}
                  series={[
                    { nome: 'Anúncios (Meta)', valores: dias.map((d) => pagoDia.get(d)?.alcance ?? 0) },
                    { nome: 'Perfil do Instagram', valores: dias.map((d) => igDia.get(d) ?? 0) },
                  ]}
                  formato={(n) => numero.format(n)}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] text-rotulo">
                  <thead>
                    <tr className="border-b border-borda text-left text-legenda text-texto-3">
                      <th className="py-1.5 pr-3 font-medium">Comparativo</th>
                      <th className="py-1.5 pr-3 text-right font-medium">Pago</th>
                      <th className="py-1.5 text-right font-medium">Orgânico (Instagram)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      ['Alcance (somado por dia)', numero.format(pagoPorDia.reduce((s, d) => s + d.alcance, 0)), numero.format(ig.alcancePorDia.reduce((s, d) => s + d.valor, 0))],
                      ['Impressões / visualizações', numero.format(pagoPorDia.reduce((s, d) => s + d.impressoes, 0)), numero.format(ig.visualizacoes)],
                      ['Cliques / interações', numero.format(cliquesPagos), numero.format(ig.interacoes)],
                      ['Taxa (CTR / engajamento)', pago.meta ? <span key="pago" className="inline-flex items-center gap-1.5">{pct(pago.meta.ctr)} <SeloTom tom={tomCtrMeta(pago.meta.ctr)} /></span> : '—', engajamentoOrganico(ig) === null ? '—' : <span key="organico" className="inline-flex items-center gap-1.5">{pct(engajamentoOrganico(ig)!)} <SeloTom tom={tomEngajamento(engajamentoOrganico(ig)!)} /></span>],
                      ['Investimento', reais.format(total), 'R$ 0,00'],
                    ] as [string, ReactNode, ReactNode][]).map(([r, a, b]) => (
                      <tr key={r} className="border-b border-borda/60 last:border-0">
                        <td className="py-1.5 pr-3 text-texto-2">{r}</td>
                        <td className="py-1.5 pr-3 text-right font-medium tabular-nums">{a}</td>
                        <td className="py-1.5 text-right font-medium tabular-nums">{b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
          <BlocoAnalise analise={analisarCombinado(ig, pagoPorDia, pago)} />
        </Secao>
      </div>
    </Modulo>
  )
}
