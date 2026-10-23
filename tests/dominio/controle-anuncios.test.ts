import { describe, expect, it } from 'vitest'
import { centavos, configDoModo, modoDoDestino, montarCriativo, montarPublico, podeGerirAnuncios } from '@/dominio/controle-anuncios'

describe('controle de anúncios', () => {
  it('só admin e gestor mexem', () => {
    expect([podeGerirAnuncios('admin'), podeGerirAnuncios('gestor'), podeGerirAnuncios('membro')]).toEqual([true, true, false])
  })

  it('público: Brasil quando não há local; cidade com raio limitado; gênero e interesses', () => {
    expect(montarPublico({}).geo_locations).toEqual({ countries: ['BR'] })
    const p = montarPublico({ locais: [{ chave: '123', tipo: 'cidade', raioKm: 200 }, { chave: '7', tipo: 'estado' }], idadeMin: 25, idadeMax: 20, generos: 'mulheres', interesses: [{ id: '6003', nome: 'Odontologia' }] })
    expect(p.geo_locations).toEqual({ cities: [{ key: '123', radius: 80, distance_unit: 'kilometer' }], regions: [{ key: '7' }] })
    expect([p.age_min, p.age_max, p.genders]).toEqual([25, 25, [2]])
    expect(p.flexible_spec).toEqual([{ interests: [{ id: '6003', name: 'Odontologia' }] }])
    expect(p.targeting_automation).toEqual({ advantage_audience: 0 })
  })

  it('criativo de WhatsApp com imagem e de formulário com vídeo', () => {
    const w = montarCriativo({ modo: 'whatsapp', paginaId: 'p', instagramId: 'ig', midia: { imagemHash: 'h' }, anuncio: { texto: 'Oi' } })
    expect(w).toMatchObject({ page_id: 'p', instagram_user_id: 'ig', link_data: { image_hash: 'h', call_to_action: { type: 'WHATSAPP_MESSAGE' } } })
    expect(() => montarCriativo({ modo: 'formulario', paginaId: 'p', instagramId: null, midia: { imagemHash: 'h' }, anuncio: { texto: 'x' } })).toThrow(/formulário/)
    const f = montarCriativo({ modo: 'formulario', paginaId: 'p', instagramId: null, midia: { videoId: 'v', capa: 'c' }, anuncio: { texto: 'x', titulo: 'T' }, formularioId: 'f' })
    expect(f).toMatchObject({ video_data: { video_id: 'v', image_url: 'c', title: 'T', call_to_action: { type: 'SIGN_UP', value: { lead_gen_form_id: 'f' } } } })
    expect(() => montarCriativo({ modo: 'site', paginaId: 'p', instagramId: null, midia: { imagemHash: 'h' }, anuncio: { texto: 'x' } })).toThrow(/link/)
  })

  it('modo e orçamento', () => {
    expect(configDoModo('formulario').otimizacao).toBe('LEAD_GENERATION')
    expect(modoDoDestino('WHATSAPP', 'OUTCOME_ENGAGEMENT')).toBe('whatsapp')
    expect(modoDoDestino(undefined, 'OUTCOME_LEADS')).toBe('formulario')
    expect(modoDoDestino('MESSENGER', 'OUTCOME_ENGAGEMENT')).toBeNull()
    expect(centavos(49.9)).toBe(4990)
    expect(() => centavos(0)).toThrow()
    expect(() => centavos(60_000)).toThrow()
  })
})
