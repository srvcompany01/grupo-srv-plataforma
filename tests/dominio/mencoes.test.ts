import { describe, expect, it } from 'vitest'
import { extrairMencoes, marcarMencao, segmentarTexto } from '@/dominio/mencoes'

const ID = '11111111-1111-1111-1111-111111111111'

describe('menções', () => {
  it('marcarMencao', () => {
    expect(marcarMencao('Bia', ID)).toBe(`@[Bia](${ID})`)
  })
  it('extrairMencoes sem repetir', () => {
    expect(extrairMencoes(`oi @[Ana Paula](${ID}) e @[Ana Paula](${ID})`)).toEqual([ID])
  })
  it('@ solto não é menção', () => {
    expect(extrairMencoes('oi @ana e @[sem id]')).toEqual([])
  })
  it('segmentarTexto', () => {
    expect(segmentarTexto(`a @[Bia](${ID}) b`)).toEqual([
      { tipo: 'texto', valor: 'a ' },
      { tipo: 'mencao', nome: 'Bia', id: ID },
      { tipo: 'texto', valor: ' b' },
    ])
    expect(segmentarTexto('sem menção')).toEqual([{ tipo: 'texto', valor: 'sem menção' }])
  })
})
