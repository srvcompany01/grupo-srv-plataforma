import { describe, expect, it } from 'vitest'
import { posicaoEntre } from '@/dominio/posicao'

describe('posicaoEntre', () => {
  it('gera uma posição inicial', () => {
    expect(posicaoEntre(null, null)).toMatch(/.+/)
  })

  it('fica entre os vizinhos', () => {
    const a = posicaoEntre(null, null)
    const b = posicaoEntre(a, null)
    const m = posicaoEntre(a, b)
    expect(a < m && m < b).toBe(true)
    expect(posicaoEntre(null, a) < a).toBe(true)
  })

  it('60 inserções sucessivas entre o mesmo par mantêm a ordem', () => {
    const a = posicaoEntre(null, null)
    let b = posicaoEntre(a, null)
    const ordem = [b]
    for (let i = 0; i < 60; i++) {
      b = posicaoEntre(a, b)
      ordem.unshift(b)
    }
    const ordenado = [...ordem].sort()
    expect(ordenado).toEqual(ordem)
    expect(new Set(ordem).size).toBe(61)
    expect(ordem.every((p) => p > a)).toBe(true)
  })
})
