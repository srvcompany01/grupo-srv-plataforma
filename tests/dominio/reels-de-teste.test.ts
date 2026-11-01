import { describe, expect, it } from 'vitest'
import { validarPublicacao, type MidiaPublicavel } from '@/dominio/publicacao'

const video: MidiaPublicavel[] = [{ tipo: 'video', nome: 'a.mp4', chave: 'x/a.mp4' }]

describe('Reels de teste', () => {
  it('vale só para Reels, só no Instagram e sem collab', () => {
    expect(validarPublicacao('reels', ['instagram'], video, [], 'MANUAL')).toBeNull()
    expect(validarPublicacao('reels', ['instagram'], video, [], 'SS_PERFORMANCE')).toBeNull()
    expect(validarPublicacao('feed', ['instagram'], video, [], 'MANUAL')).toMatch(/só vale para o formato Reels/)
    expect(validarPublicacao('reels', ['instagram', 'facebook'], video, [], 'MANUAL')).toMatch(/só no Instagram/)
    expect(validarPublicacao('reels', ['instagram'], video, ['a'], 'MANUAL')).toMatch(/collab/)
  })
  it('sem teste, nada muda', () => {
    expect(validarPublicacao('reels', ['instagram', 'facebook'], video, [], null)).toBeNull()
  })
})
