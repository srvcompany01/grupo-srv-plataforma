import { describe, expect, it } from 'vitest'
import {
  EXTENSAO_ANEXO,
  validarAnexosComentario,
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

describe('gerarChaveTarefa', () => {
  it('monta tarefas/<id>/<uuid>.<ext>', async () => {
    const { gerarChaveTarefa } = await import('@/infra/r2')
    expect(gerarChaveTarefa('t1', 'audio/webm')).toMatch(/^tarefas\/t1\/[0-9a-f-]{36}\.webm$/)
    expect(gerarChaveTarefa('t1', 'audio/webm;codecs=opus')).toMatch(/\.webm$/)
  })
  it('mime desconhecido lança erro', async () => {
    const { gerarChaveTarefa } = await import('@/infra/r2')
    expect(() => gerarChaveTarefa('t1', 'application/x-msdownload')).toThrow()
  })
})

describe('chaves do protótipo e anexos do comentário', () => {
  it('recusa nomes do protótipo como tipo', () => {
    expect(validarAnexo({ mime: 'constructor', tamanho: 10 })).toBe('Tipo de arquivo não permitido')
    expect(validarAnexo({ mime: '__proto__', tamanho: 10 })).toBe('Tipo de arquivo não permitido')
  })
  it('validarAnexosComentario exige chave da própria tarefa e tipo válido', () => {
    const t = '11111111-1111-1111-1111-111111111111'
    const ok = { chave: `tarefas/${t}/22222222-2222-2222-2222-222222222222.png`, nome: 'a.png', mime: 'image/png', tamanho: 10 }
    expect(validarAnexosComentario(t, [ok])).toBeNull()
    expect(validarAnexosComentario(t, [{ ...ok, chave: `tarefas/outra/x.png` }])).toBe('Anexo inválido')
    expect(validarAnexosComentario(t, [{ ...ok, mime: 'text/html' }])).toBe('Tipo de arquivo não permitido')
  })
})
