import { describe, expect, it } from 'vitest'
import { avaliarAnuncios, lerAnuncio, lerContaAnuncios, totaisAnuncios, type AnuncioBruto } from '@/dominio/anuncios-meta'

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

  it('classifica pelo CTR da conta, diagnóstico da Meta e frequência', () => {
    const lista = [
      lerAnuncio(bruto('bom', { impressions: '10000', ctr: '3.0', clicks: '300', frequency: '1.2' })),
      lerAnuncio(bruto('medio', { impressions: '10000', ctr: '2.0', clicks: '200', frequency: '1.2' })),
      lerAnuncio(bruto('fraco', { impressions: '10000', ctr: '1.0', clicks: '100', frequency: '4.0', quality_ranking: 'BELOW_AVERAGE_20' })),
      lerAnuncio(bruto('novo', { impressions: '120', ctr: '5.0' })),
    ]
    const r = avaliarAnuncios(lista)
    expect(r.map((a) => [a.id, a.desempenho])).toEqual([['bom', 'bom'], ['medio', 'medio'], ['fraco', 'fraco'], ['novo', 'poucos-dados']])
    expect(r[2].motivos.join(' ')).toMatch(/Frequência alta/)
    expect(totaisAnuncios(lista)).toMatchObject({ impressoes: 30120, cliques: 600 })
  })
})
