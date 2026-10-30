import { describe, expect, it } from 'vitest'
import { editarFaixaEtaria, editarSpecDoCriativo } from '@/dominio/controle-anuncios'

const imagem = { page_id: '1', instagram_user_id: '2', link_data: { image_hash: 'h', link: 'https://wa.me/', message: 'Texto antigo', name: 'Título antigo', description: 'Desc', call_to_action: { type: 'WHATSAPP_MESSAGE', value: { app_destination: 'WHATSAPP', link: 'https://wa.me/' } } } }
const video = { page_id: '1', video_data: { video_id: 'v', image_url: 'c', message: 'Legenda', title: 'T', call_to_action: { type: 'LEARN_MORE', value: { link: 'https://site.com' } } } }

describe('editarSpecDoCriativo', () => {
  it('troca texto, título e botão de um anúncio de imagem sem tocar no resto nem no original', () => {
    const { spec, mudancas } = editarSpecDoCriativo(imagem, { texto: 'Texto novo', titulo: 'Novo', botao: 'SIGN_UP' })
    const ld = spec.link_data as Record<string, unknown>
    expect(ld.message).toBe('Texto novo')
    expect(ld.name).toBe('Novo')
    expect(ld.description).toBe('Desc')
    expect(ld.image_hash).toBe('h')
    expect((ld.call_to_action as { type: string }).type).toBe('SIGN_UP')
    expect(spec.page_id).toBe('1')
    expect(mudancas).toHaveLength(3)
    expect(imagem.link_data.message).toBe('Texto antigo')
  })

  it('anúncio de vídeo usa title e link_description; link muda também no botão', () => {
    const { spec } = editarSpecDoCriativo(video, { titulo: 'Novo título', descricao: 'Nova', link: 'https://novo.com' })
    const vd = spec.video_data as Record<string, unknown>
    expect(vd.title).toBe('Novo título')
    expect(vd.link_description).toBe('Nova')
    expect((vd.call_to_action as { value: { link: string } }).value.link).toBe('https://novo.com')
  })

  it('sem mudança real não lista alteração', () => {
    expect(editarSpecDoCriativo(imagem, { texto: 'Texto antigo' }).mudancas).toEqual([])
  })

  it('recusa criativo de publicação existente e carrossel com campos por cartão', () => {
    expect(() => editarSpecDoCriativo({ page_id: '1' }, { texto: 'x' })).toThrow(/publicação existente/)
    expect(() => editarSpecDoCriativo({ link_data: { message: 'a', child_attachments: [{}] } }, { titulo: 'x' })).toThrow(/carrossel/)
  })
})

describe('criativo vindo da Meta com miniatura declarada dos dois jeitos', () => {
  it('vídeo com image_url e image_hash: mantém só a image_url (a Meta recusa os dois juntos)', () => {
    const { spec } = editarSpecDoCriativo({ page_id: '1', video_data: { video_id: 'v', image_url: 'https://c', image_hash: 'abc', message: 'a' } }, { texto: 'b' })
    const vd = spec.video_data as Record<string, unknown>
    expect(vd.image_url).toBe('https://c')
    expect('image_hash' in vd).toBe(false)
    expect(vd.message).toBe('b')
  })
  it('link com image_hash e picture: mantém só o hash', () => {
    const { spec } = editarSpecDoCriativo({ page_id: '1', link_data: { image_hash: 'h', picture: 'https://p', link: 'https://x', message: 'a' } }, { texto: 'b' })
    const ld = spec.link_data as Record<string, unknown>
    expect(ld.image_hash).toBe('h')
    expect('picture' in ld).toBe(false)
  })
})

describe('editarFaixaEtaria', () => {
  it('muda só o que foi pedido e mantém o resto do público', () => {
    const r = editarFaixaEtaria({ age_min: 18, age_max: 65, geo_locations: { countries: ['BR'] } }, 25)
    expect(r.targeting).toEqual({ age_min: 25, age_max: 65, geo_locations: { countries: ['BR'] } })
    expect(r.mudancas).toEqual(['idade mínima: 18 → 25'])
  })
  it('recusa faixa inválida', () => {
    expect(() => editarFaixaEtaria({}, 30, 20)).toThrow(/inválida/)
    expect(() => editarFaixaEtaria({}, 10)).toThrow(/inválida/)
    expect(() => editarFaixaEtaria({}, undefined, 70)).toThrow(/inválida/)
  })
})
