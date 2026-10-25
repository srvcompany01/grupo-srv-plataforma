import { describe, expect, it } from 'vitest'
import { formatoDaMidiaPublicada, formatoPublicado, lerCollabs, planoInstagram, prontoParaPublicar, situacaoPublicacao, validarPublicacao, type MidiaPublicavel } from '@/dominio/publicacao'

const foto = (n: string, ext = 'jpg'): MidiaPublicavel => ({ tipo: 'imagem', nome: n, chave: `conteudo/t/${n}.${ext}` })
const video = (n: string): MidiaPublicavel => ({ tipo: 'video', nome: n, chave: `conteudo/t/${n}.mp4` })

describe('publicação na Meta', () => {
  it('valida formato, mídias e redes', () => {
    expect(validarPublicacao('feed', ['instagram'], [foto('a')])).toBeNull()
    expect(validarPublicacao('feed', [], [foto('a')])).toMatch(/Escolha onde/)
    expect(validarPublicacao('tiktok', ['instagram'], [video('v')])).toMatch(/TikTok/)
    expect(validarPublicacao('feed', ['instagram'], [])).toMatch(/Adicione/)
    expect(validarPublicacao('reels', ['instagram'], [foto('a')])).toMatch(/1 vídeo/)
    expect(validarPublicacao('stories', ['instagram', 'facebook'], [foto('a')])).toMatch(/Stories só/)
    expect(validarPublicacao('feed', ['instagram'], [foto('a', 'png')])).toMatch(/só aceita foto em JPG/)
    expect(validarPublicacao('feed', ['facebook'], [foto('a', 'png')])).toBeNull()
    expect(validarPublicacao('feed', ['facebook'], [foto('a'), video('v')])).toMatch(/não mistura/)
    expect(validarPublicacao('feed', ['instagram'], [foto('a'), video('v')])).toBeNull()
  })

  it('forma do post no Instagram', () => {
    expect(planoInstagram('feed', [foto('a')]).tipo).toBe('IMAGE')
    expect(planoInstagram('feed', [video('v')]).tipo).toBe('REELS')
    expect(planoInstagram('feed', [foto('a'), foto('b')]).tipo).toBe('CAROUSEL')
    expect(planoInstagram('reels', [video('v')]).tipo).toBe('REELS')
    expect(planoInstagram('stories', [foto('a'), foto('b')])).toMatchObject({ tipo: 'STORIES', midias: [{}, {}] })
  })

  it('só publica vencido e aprovado (ou direto)', () => {
    const agora = new Date('2026-10-22T20:00:00Z')
    const base = { status: 'agendado' as const, em: '2026-10-22T19:00:00Z', modo: 'aprovacao' as const, aprovacao: 'aprovado' as const }
    expect(prontoParaPublicar(base, agora)).toBe(true)
    expect(prontoParaPublicar({ ...base, aprovacao: 'aguardando' }, agora)).toBe(false)
    expect(prontoParaPublicar({ ...base, modo: 'direto', aprovacao: 'rascunho' }, agora)).toBe(true)
    expect(prontoParaPublicar({ ...base, em: '2026-10-22T21:00:00Z' }, agora)).toBe(false)
    expect(prontoParaPublicar({ ...base, status: 'publicado' }, agora)).toBe(false)
    expect(situacaoPublicacao({ ...base, aprovacao: 'aguardando' }, agora)).toMatch(/horário já passou/)
    expect(situacaoPublicacao({ ...base, aprovacao: 'ajuste' }, agora)).toBe('Ajuste pedido pelo cliente')
    expect(situacaoPublicacao(base, agora)).toBe('Agendado')
  })
})

describe('collab', () => {
  it('lê @, links e separadores; recusa inválido e mais de 3', () => {
    expect(lerCollabs('@Aurum.Belem, ouroassis https://www.instagram.com/grupo_srv/ @aurum.belem')).toEqual(['aurum.belem', 'ouroassis', 'grupo_srv'])
    expect(lerCollabs('')).toEqual([])
    expect(lerCollabs('@a @b @c @d')).toEqual({ erro: 'No máximo 3 perfis na collab.' })
    expect('erro' in (lerCollabs('perfil-invalido') as object)).toBe(true)
  })
  it('só Instagram e não em Stories', () => {
    const foto = [{ tipo: 'imagem' as const, nome: 'a.jpg', chave: 'x/a.jpg' }]
    expect(validarPublicacao('feed', ['instagram', 'facebook'], foto, ['ouroassis'])).toBeNull()
    expect(validarPublicacao('feed', ['facebook'], foto, ['ouroassis'])).toMatch(/só no Instagram/)
    expect(validarPublicacao('stories', ['instagram'], foto, ['ouroassis'])).toMatch(/Stories/)
  })
})

describe('Google Meu Negócio', () => {
  it('precisa de foto e não aceita Stories', () => {
    expect(validarPublicacao('feed', ['google'], [foto('a')])).toBeNull()
    expect(validarPublicacao('reels', ['google'], [video('v')])).toMatch(/precisa de uma foto/)
    expect(validarPublicacao('stories', ['instagram', 'google'], [foto('a')])).toMatch(/Stories não vão para o Google/)
    expect(validarPublicacao('feed', ['google'], [foto('a', 'png')])).toBeNull() // PNG só é problema no Instagram
  })
})

describe('formato publicado', () => {
  it('vídeo único em feed sai como Reels; carrossel e foto ficam feed; stories', () => {
    const video = { tipo: 'video' as const, nome: 'v.mp4', chave: 'k' }
    const foto = { tipo: 'imagem' as const, nome: 'f.jpg', chave: 'k' }
    expect(formatoPublicado(planoInstagram('feed', [video]))).toBe('reels')
    expect(formatoPublicado(planoInstagram('feed', [foto]))).toBe('feed')
    expect(formatoPublicado(planoInstagram('feed', [foto, foto]))).toBe('feed')
    expect(formatoPublicado(planoInstagram('stories', [video]))).toBe('stories')
  })

  it('C4: usa media_product_type e media_type confirmados pela Graph API', () => {
    expect(formatoDaMidiaPublicada('VIDEO', 'REELS')).toBe('reels')
    expect(formatoDaMidiaPublicada('CAROUSEL_ALBUM', 'FEED')).toBe('feed')
    expect(formatoDaMidiaPublicada('IMAGE', 'STORY')).toBe('stories')
    expect(formatoDaMidiaPublicada(undefined, undefined, 'reels')).toBe('reels')
  })
})
