import { describe, expect, it } from 'vitest'
import { escolherMime, MIMES_AUDIO, MIMES_VIDEO, nomeGravacao } from '@/dominio/gravacao'

describe('escolherMime', () => {
  it('pega o primeiro suportado', () => {
    expect(escolherMime(MIMES_VIDEO, (m) => m === 'video/webm')).toBe('video/webm')
    expect(escolherMime(MIMES_AUDIO, () => true)).toBe('audio/webm;codecs=opus')
  })
  it('Safari: só mp4', () => {
    expect(escolherMime(MIMES_AUDIO, (m) => m === 'audio/mp4')).toBe('audio/mp4')
  })
  it('nenhum suportado → null', () => {
    expect(escolherMime(MIMES_VIDEO, () => false)).toBeNull()
  })
})

describe('nomeGravacao', () => {
  const d = new Date(2026, 9, 7, 9, 5)
  it('áudio webm', () => expect(nomeGravacao('audio', 'audio/webm;codecs=opus', d)).toBe('audio-2026-10-07-0905.webm'))
  it('áudio mp4 vira m4a', () => expect(nomeGravacao('audio', 'audio/mp4', d)).toBe('audio-2026-10-07-0905.m4a'))
  it('vídeo mp4', () => expect(nomeGravacao('video', 'video/mp4', d)).toBe('video-2026-10-07-0905.mp4'))
  it('vídeo webm', () => expect(nomeGravacao('video', 'video/webm;codecs=vp9,opus', d)).toBe('video-2026-10-07-0905.webm'))
})
