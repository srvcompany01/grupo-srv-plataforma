import { describe, expect, it } from 'vitest'
import { lerPaginaMeta, urlBibliotecaAnuncios } from '@/dominio/biblioteca-anuncios'

describe('biblioteca de anúncios do Meta', () => {
  it('aceita ID, link da biblioteca e link de página com id=', () => {
    expect(lerPaginaMeta(' 104512345678901 ')).toEqual({ id: '104512345678901' })
    expect(lerPaginaMeta('https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=104512345678901&search_type=page')).toEqual({ id: '104512345678901' })
    expect(lerPaginaMeta('https://www.facebook.com/profile.php?id=100089123456789')).toEqual({ id: '100089123456789' })
    expect(lerPaginaMeta('')).toEqual({ id: null })
    expect(lerPaginaMeta('https://www.facebook.com/padariadoze')).toEqual({ erro: expect.stringMatching(/view_all_page_id/) })
  })

  it('monta o link dos anúncios ativos da página', () => {
    expect(urlBibliotecaAnuncios('123456')).toContain('active_status=active')
    expect(urlBibliotecaAnuncios('123456')).toContain('view_all_page_id=123456')
  })
})
