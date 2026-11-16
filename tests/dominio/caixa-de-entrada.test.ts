import { describe, expect, it } from 'vitest'
import { avisoDeVideoGrande, idDaPastaDoDrive, problemaDoVideo, tipoPelaPasta } from '@/dominio/caixa-de-entrada'

describe('tipoPelaPasta', () => {
  it('reconhece orgânico e anúncio pelo nome das pastas, sem depender de acento', () => {
    expect(tipoPelaPasta(['Conteúdo Orgânico', 'Reels'])).toBe('organico')
    expect(tipoPelaPasta(['Anúncios'])).toBe('anuncio')
    expect(tipoPelaPasta(['Criativos de tráfego'])).toBe('anuncio')
    expect(tipoPelaPasta([])).toBe('indefinido')
    expect(tipoPelaPasta(['Novembro'])).toBe('indefinido')
  })
  it('a pasta mais perto do arquivo vence', () => {
    expect(tipoPelaPasta(['Orgânico', 'Anúncio de Black Friday'])).toBe('anuncio')
  })
})

describe('idDaPastaDoDrive', () => {
  it('aceita o link ou o id', () => {
    expect(idDaPastaDoDrive('https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?usp=sharing')).toBe('1AbCdEfGhIjKlMnOp')
    expect(idDaPastaDoDrive('https://drive.google.com/drive/u/0/folders/1AbCdEfGhIjKlMnOp')).toBe('1AbCdEfGhIjKlMnOp')
    expect(idDaPastaDoDrive('1AbCdEfGhIjKlMnOp')).toBe('1AbCdEfGhIjKlMnOp')
  })
  it('recusa o que não é pasta', () => {
    expect(idDaPastaDoDrive('abc')).toBe('')
    expect(idDaPastaDoDrive('https://exemplo.com/pasta')).toBe('')
  })
})

describe('problemaDoVideo', () => {
  it('só MP4 e MOV até 4 GB', () => {
    expect(problemaDoVideo({ mime: 'video/mp4', tamanho: 300 * 1024 ** 2 })).toBeNull()
    expect(problemaDoVideo({ mime: 'video/quicktime', tamanho: 1024 ** 3 })).toBeNull()
    expect(problemaDoVideo({ mime: 'video/avi', tamanho: 1 })).toMatch(/MP4 ou MOV/)
    expect(problemaDoVideo({ mime: 'video/mp4', tamanho: 1.5 * 1024 ** 3 })).toBeNull()
    expect(problemaDoVideo({ mime: 'video/mp4', tamanho: 4 * 1024 ** 3 + 1 })).toMatch(/acima de 4 GB/)
  })
})

describe('avisoDeVideoGrande', () => {
  it('só avisa acima de 1 GB e deixa claro que a plataforma não comprime', () => {
    expect(avisoDeVideoGrande(1024 ** 3)).toBeNull()
    expect(avisoDeVideoGrande(900 * 1024 ** 2)).toBeNull()
    const aviso = avisoDeVideoGrande(1.5 * 1024 ** 3, 'Reels.mp4')
    expect(aviso).toMatch(/Reels\.mp4 tem 1,50 GB/)
    expect(aviso).toMatch(/não comprime/)
    expect(aviso).toMatch(/Meta/)
  })
})
