import { describe, expect, it } from 'vitest'
import { avisosGoogle, intervaloNegocio, lerAvaliacoesNegocio, lerCampanha, lerContaGoogleAds, lerMetricasNegocio, lerPalavrasChaveNegocio, totaisCampanhas } from '@/dominio/google'

describe('google', () => {
  it('conta do Google Ads', () => {
    expect(lerContaGoogleAds('123-456-7890')).toEqual({ id: '1234567890' })
    expect(lerContaGoogleAds('')).toEqual({ id: null })
    expect('erro' in lerContaGoogleAds('12345')).toBe(true)
  })
  it('campanhas e totais', () => {
    const c = lerCampanha({ campaign: { id: '1', name: 'Busca', advertisingChannelType: 'SEARCH' }, metrics: { impressions: '1000', clicks: '50', costMicros: '25000000', conversions: 5 } })
    expect(c).toMatchObject({ tipo: 'Pesquisa', custo: 25, ctr: 5, cpc: 0.5, conversoes: 5 })
    expect(totaisCampanhas([c, c])).toMatchObject({ custo: 50, cliques: 100, ctr: 5, custoPorConversao: 5 })
  })
  it('métricas do Meu Negócio', () => {
    const m = lerMetricasNegocio({
      multiDailyMetricTimeSeries: [{ dailyMetricTimeSeries: [
        { dailyMetric: 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH', timeSeries: { datedValues: [{ date: { year: 2026, month: 10, day: 1 }, value: '10' }, { date: { year: 2026, month: 10, day: 2 } }] } },
        { dailyMetric: 'BUSINESS_IMPRESSIONS_MOBILE_MAPS', timeSeries: { datedValues: [{ date: { year: 2026, month: 10, day: 1 }, value: '5' }] } },
        { dailyMetric: 'CALL_CLICKS', timeSeries: { datedValues: [{ date: { year: 2026, month: 10, day: 2 }, value: '3' }] } },
      ] }],
    })
    expect(m).toMatchObject({ buscas: 10, mapas: 5, visualizacoes: 15, ligacoes: 3 })
    expect(m.porDia).toEqual([{ dia: '2026-10-01', visualizacoes: 15, acoes: 0 }, { dia: '2026-10-02', visualizacoes: 0, acoes: 3 }])
    expect(intervaloNegocio('2026-10-01', '2026-10-07')).toContainEqual(['dailyRange.end_date.day', '7'])
    expect(intervaloNegocio('2026-10-01', '2026-10-07')).toContainEqual(['dailyMetrics', 'MESSAGING_CLICKS'])
    expect(intervaloNegocio('2026-10-01', '2026-10-07')).not.toContainEqual(['dailyMetrics', 'BUSINESS_CONVERSATIONS'])
  })
  it('avaliações do período e termos que levaram ao perfil', () => {
    const a = lerAvaliacoesNegocio([
      { starRating: 'FIVE', createTime: '2026-10-02T12:00:00Z', reviewReply: { comment: 'Obrigado' } },
      { starRating: 'THREE', createTime: '2026-10-07T02:30:00Z' },
      { starRating: 'ONE', createTime: '2026-09-30T12:00:00Z' },
    ], '2026-10-01', '2026-10-06')
    expect(a).toEqual({ novas: 2, notaMedia: 4, respondidas: 1, semResposta: 1, distribuicao: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 } })
    expect(lerPalavrasChaveNegocio([
      { searchKeyword: 'ouro belém', insightsValue: { value: '42' } },
      { searchKeyword: 'comprar ouro', insightsValue: { threshold: '15' } },
    ])).toEqual([{ termo: 'ouro belém', visualizacoes: 42, abaixoDe: false }, { termo: 'comprar ouro', visualizacoes: 15, abaixoDe: true }])
  })
})

describe('P1-8: avisos do Google Ads', () => {
  it('conversão sem valor e gasto sem conversão viram aviso; conta ok fica sem aviso', () => {
    expect(avisosGoogle({ custo: 100, conversoes: 12, valorConversoes: 0 })[0]).toMatch(/sem valor configurado/)
    expect(avisosGoogle({ custo: 100, conversoes: 0, valorConversoes: 0 })[0]).toMatch(/Nenhuma conversão/)
    expect(avisosGoogle({ custo: 100, conversoes: 12, valorConversoes: 3000 })).toEqual([])
  })
})
