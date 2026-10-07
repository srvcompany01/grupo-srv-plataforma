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

import { mencoesParaEdicao, mencoesDaEdicao } from '@/dominio/mencoes'

describe('menções na edição', () => {
  it('mencoesParaEdicao troca o marcador por @Nome', () => {
    expect(mencoesParaEdicao(`oi @[Ana Paula](${ID}) tudo?`)).toBe('oi @Ana Paula tudo?')
  })
  it('mencoesDaEdicao devolve o marcador', () => {
    const pessoas = [{ id: ID, nome: 'Ana Paula' }]
    expect(mencoesDaEdicao('oi @Ana Paula tudo?', pessoas)).toBe(`oi @[Ana Paula](${ID}) tudo?`)
  })
  it('ida e volta é idêntica', () => {
    const t = `@[Bia](${ID}) e @[Bia Souza](22222222-2222-2222-2222-222222222222).`
    const pessoas = [
      { id: ID, nome: 'Bia' },
      { id: '22222222-2222-2222-2222-222222222222', nome: 'Bia Souza' },
    ]
    expect(mencoesDaEdicao(mencoesParaEdicao(t), pessoas)).toBe(t)
  })
  it('não converte quando o nome continua em outra palavra', () => {
    expect(mencoesDaEdicao('@Biana', [{ id: ID, nome: 'Bia' }])).toBe('@Biana')
  })
  it('nome apagado da caixa não vira menção', () => {
    expect(mencoesDaEdicao('oi', [{ id: ID, nome: 'Bia' }])).toBe('oi')
  })
})
