import { describe, expect, it } from 'vitest'
import { avaliarAnuncios, lerAnuncio, lerContaAnuncios, referencias, taxasDoAnuncio, totaisAnuncios, type AnuncioBruto } from '@/dominio/anuncios-meta'

const bruto = (id: string, ins: Record<string, unknown>, extra: Partial<AnuncioBruto> = {}): AnuncioBruto => ({ id, name: id, creative: { body: 'Texto', image_url: 'https://img/x.jpg' }, insights: { data: [ins as never] }, ...extra })

describe('anúncios do Meta', () => {
  it('lê a conta de anúncios', () => {
    expect(lerContaAnuncios('act_1234567890')).toEqual({ id: '1234567890' })
    expect(lerContaAnuncios('1234567890')).toEqual({ id: '1234567890' })
    expect(lerContaAnuncios('https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1234567890&nav_entry_point=bm')).toEqual({ id: '1234567890' })
    expect(lerContaAnuncios('')).toEqual({ id: null })
    expect(lerContaAnuncios('minha conta')).toHaveProperty('erro')
  })

  it('lê métricas, ações e diagnóstico da API', () => {
    const a = lerAnuncio(bruto('1', {
      impressions: '12000', reach: '8000', clicks: '240', ctr: '2.0', cpm: '15.5', cpc: '0.77', spend: '186.00', frequency: '1.5',
      actions: [{ action_type: 'video_view', value: '3100' }, { action_type: 'link_click', value: '180' }],
      quality_ranking: 'ABOVE_AVERAGE', engagement_rate_ranking: 'AVERAGE', conversion_rate_ranking: 'UNKNOWN',
    }, { creative: { body: 'Oi', video_id: '9', effective_object_story_id: '111_222' } }))
    expect(a).toMatchObject({ impressoes: 12000, alcance: 8000, ctr: 2, gasto: 186, visualizacoesVideo: 3100, cliquesLink: 180, qualidade: 'acima', engajamento: 'media', conversao: null, video: true, link: 'https://www.facebook.com/111_222' })
    expect(lerAnuncio({ id: '2' })).toMatchObject({ impressoes: 0, imagem: null, link: null })
  })

  it('com resultados na conta: classifica pelo custo por resultado', () => {
    const conversa = (n: number) => [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: String(n) }]
    const lista = [
      lerAnuncio(bruto('barato', { impressions: '10000', spend: '100', actions: conversa(20), frequency: '1.2' })),
      lerAnuncio(bruto('na-media', { impressions: '10000', spend: '100', actions: conversa(10), frequency: '1.2' })),
      lerAnuncio(bruto('sem-resultado', { impressions: '10000', spend: '60', frequency: '1.2' })),
      lerAnuncio(bruto('novo', { impressions: '120', spend: '5' })),
    ]
    const r = avaliarAnuncios(lista)
    expect(r.map((a) => [a.id, a.desempenho])).toEqual([['barato', 'bom'], ['na-media', 'medio'], ['sem-resultado', 'fraco'], ['novo', 'poucos-dados']])
    expect(r[2].motivos[0]).toMatch(/sem nenhum resultado/)
    expect(lista[0]).toMatchObject({ resultados: 20, custoPorResultado: 5 })
  })

  it('sem resultados na conta: CTR no link com referência fixa (não reprova metade por definição)', () => {
    const lista = [
      lerAnuncio(bruto('a', { impressions: '10000', clicks: '300', inline_link_clicks: '200', frequency: '1.2' })),
      lerAnuncio(bruto('b', { impressions: '10000', clicks: '150', inline_link_clicks: '100', frequency: '1.2' })),
      lerAnuncio(bruto('c', { impressions: '10000', clicks: '100', inline_link_clicks: '50', frequency: '4.0', quality_ranking: 'BELOW_AVERAGE_20' })),
    ]
    expect(avaliarAnuncios(lista).map((a) => [a.id, a.desempenho])).toEqual([['a', 'bom'], ['b', 'medio'], ['c', 'fraco']])
    expect(lista[0].cliquesLink).toBe(200)
    expect(totaisAnuncios(lista)).toMatchObject({ impressoes: 30000, cliques: 550, resultados: 0 })
  })

  it('campanha de marca (tráfego/conteúdo) não é comparada com as de lead nem reprovada por não gerar lead', () => {
    const conversa = (n: number) => [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: String(n) }]
    const camp = (objective: string) => ({ campaign: { name: objective, objective }, creative: { body: 'x' } })
    const lista = [
      lerAnuncio(bruto('whats', { impressions: '10000', spend: '130', actions: conversa(10), frequency: '1.2' }, camp('OUTCOME_ENGAGEMENT'))),
      lerAnuncio(bruto('trafego', { impressions: '20000', spend: '400', inline_link_clicks: '600', frequency: '1.2' }, camp('OUTCOME_TRAFFIC'))),
    ]
    const r = avaliarAnuncios(lista)
    const t = r.find((a) => a.id === 'trafego')!
    expect(t.papel).toBe('marca')
    expect(t.desempenho).toBe('bom') // CTR no link de 3%
    expect(t.motivos[0]).toMatch(/Campanha de marca/)
    expect(t.motivos.join(' ')).not.toMatch(/sem nenhum resultado/)
    expect(r.find((a) => a.id === 'whats')!.papel).toBe('lead')
    expect(referencias(lista).lead.custoPorResultado).toBe(13)
  })

  it('P1-4: CTR e CPC por todos os cliques e pelos cliques no link', () => {
    expect(taxasDoAnuncio({ impressoes: 10000, cliques: 40, cliquesLink: 0, gasto: 20 })).toEqual({ ctrTodos: 0.4, cpcTodos: 0.5, ctrLink: 0, cpcLink: null })
  })
})
