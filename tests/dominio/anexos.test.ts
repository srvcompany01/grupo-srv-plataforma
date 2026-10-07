import { describe, expect, it } from 'vitest'
import {
  EXTENSAO_ANEXO,
  LIMITE_ARQUIVO,
  LIMITE_VIDEO,
  normalizarMime,
  tipoDoAnexo,
  validarAnexo,
} from '@/dominio/anexos'

describe('anexos', () => {
  it('normalizarMime tira parâmetros e maiúsculas', () => {
    expect(normalizarMime('audio/webm;codecs=opus')).toBe('audio/webm')
    expect(normalizarMime('Video/MP4')).toBe('video/mp4')
  })
  it('tipoDoAnexo', () => {
    expect(tipoDoAnexo('audio/mp4')).toBe('audio')
    expect(tipoDoAnexo('video/quicktime')).toBe('video')
    expect(tipoDoAnexo('application/pdf')).toBe('arquivo')
  })
  it('validarAnexo', () => {
    expect(validarAnexo({ mime: 'application/x-msdownload', tamanho: 10 })).toBe('Tipo de arquivo não permitido')
    expect(validarAnexo({ mime: 'application/pdf', tamanho: LIMITE_ARQUIVO + 1 })).toBe('Arquivo maior que 100 MB')
    expect(validarAnexo({ mime: 'video/webm', tamanho: LIMITE_VIDEO })).toBeNull()
    expect(validarAnexo({ mime: 'video/webm', tamanho: LIMITE_VIDEO + 1 })).toBe('Vídeo maior que 500 MB')
    expect(validarAnexo({ mime: 'application/pdf', tamanho: 0 })).toBe('Arquivo vazio')
    expect(validarAnexo({ mime: 'audio/webm;codecs=opus', tamanho: 10 })).toBeNull()
  })
  it('EXTENSAO_ANEXO cobre os tipos esperados', () => {
    for (const m of [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'text/plain', 'text/csv', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg',
      'audio/wav', 'video/webm', 'video/mp4', 'video/quicktime',
    ]) {
      expect(EXTENSAO_ANEXO[m], m).toBeTruthy()
    }
  })
})
