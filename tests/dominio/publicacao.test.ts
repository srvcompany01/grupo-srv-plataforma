import { describe, expect, it } from 'vitest'
import { planoInstagram, prontoParaPublicar, situacaoPublicacao, validarPublicacao, type MidiaPublicavel } from '@/dominio/publicacao'

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
