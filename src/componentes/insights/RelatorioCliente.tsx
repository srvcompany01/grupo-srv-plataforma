import { BarChart3, Combine, Megaphone, Sprout, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Modulo } from '@/componentes/Modulo'
import { analisarCombinado, analisarOrganico, analisarPago, engajamento } from '@/dominio/insights'
import { diasDoPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import type { DadosDoCliente } from '@/servicos/relatorio-cliente'
import { BlocoAnalise, Numeros } from './BlocoAnalise'
import { EmBreve } from './EmBreve'
import { GraficoDiario } from './GraficoDiario'
import { InstagramInsights } from './InstagramInsights'

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const reaisCurto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

function Secao({ icone: Icone, titulo, descricao, children }: { icone: typeof Megaphone; titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-borda pt-4 first:border-0 first:pt-0">
      <header className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fundo text-texto-2"><Icone className="h-4 w-4" /></span>
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
  return (
    <Modulo icone={BarChart3} titulo="Relatório do cliente" descricao={`Tráfego pago, orgânico e os dois juntos · ${rotuloPeriodo(periodo)}`} acoes={seletor}>
      <div className="space-y-5">
        {dados.erros.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-legenda text-aviso-forte">
            {dados.erros.map((e) => <li key={e} className="flex gap-1.5"><TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />{e}</li>)}
          </ul>
        )}

        <Secao icone={Megaphone} titulo="Tráfego pago" descricao="Meta (Facebook e Instagram) e Google Ads">
          {(pago.meta || pago.google) && (
            <Numeros
              itens={[
                ['Investido', reais.format(total)],
                ['Meta', pago.meta ? reais.format(pago.meta.gasto) : '—', pago.meta ? `${pago.meta.anuncios} anúncios ativos` : 'sem conta'],
                ['Google Ads', pago.google ? reais.format(pago.google.custo) : '—', pago.google ? `${pago.google.campanhas} campanhas` : 'sem conta'],
                ['Impressões', numero.format(pago.meta?.impressoes ?? 0), 'Meta'],
                ['Cliques', numero.format(cliquesPagos)],
                ['Conversões (Google)', pago.google ? pago.google.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'],
              ]}
            />
          )}
          <BlocoAnalise analise={analisarPago(pago)} />
          <EmBreve itens={['TikTok Ads', 'LinkedIn Ads']} />
        </Secao>

        <Secao icone={Sprout} titulo="Orgânico" descricao="Instagram (e, quando liberados, Google Meu Negócio e TikTok)">
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

        <Secao icone={Combine} titulo="Pago + orgânico" descricao="Como o investimento e o perfil andam juntos no período">
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
                    {[
                      ['Alcance (somado por dia)', numero.format(pagoPorDia.reduce((s, d) => s + d.alcance, 0)), numero.format(ig.alcancePorDia.reduce((s, d) => s + d.valor, 0))],
                      ['Impressões / visualizações', numero.format(pagoPorDia.reduce((s, d) => s + d.impressoes, 0)), numero.format(ig.visualizacoes)],
                      ['Cliques / interações', numero.format(cliquesPagos), numero.format(ig.interacoes)],
                      ['Taxa (CTR / engajamento)', pago.meta ? pct(pago.meta.ctr) : '—', pct(engajamento(ig.interacoes, ig.alcance))],
                      ['Investimento', reais.format(total), 'R$ 0,00'],
                    ].map(([r, a, b]) => (
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
