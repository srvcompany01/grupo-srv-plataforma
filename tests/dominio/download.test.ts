import { describe, expect, it } from 'vitest'
import { nomeZip, nomesNoZip } from '@/dominio/download'

describe('nomeZip', () => {
  it('usa o cliente sem acento e a data prevista', () => {
    expect(nomeZip('Aurum Belém', '2026-10-07')).toBe('aurum-belem-2026-10-07.zip')
  })

  it('limpa caracteres que quebram nome de arquivo', () => {
    expect(nomeZip('  Ouro & Cia / Assis!! ', '2026-01-02')).toBe('ouro-cia-assis-2026-01-02.zip')
  })

  it('tem um nome mesmo se o cliente vier só com símbolos', () => {
    expect(nomeZip('***', '2026-01-02')).toBe('post-2026-01-02.zip')
  })
})

describe('nomesNoZip', () => {
  it('numera na ordem do carrossel com dois dígitos', () => {
    expect(nomesNoZip(['capa.jpg', 'Foto Final.PNG', 'c.webp'])).toEqual(['01-capa.jpg', '02-foto-final.png', '03-c.webp'])
  })

  it('não colide quando os nomes originais se repetem', () => {
    const nomes = nomesNoZip(['IMG.jpg', 'IMG.jpg'])
    expect(new Set(nomes).size).toBe(2)
  })

  it('mantém dois dígitos até 20 imagens', () => {
    const nomes = nomesNoZip(Array.from({ length: 20 }, () => 'a.jpg'))
    expect(nomes[19]).toBe('20-a.jpg')
  })

  it('remove caminhos e acentos do nome original', () => {
    expect(nomesNoZip(['../../ção.jpeg'])).toEqual(['01-cao.jpeg'])
  })
})
