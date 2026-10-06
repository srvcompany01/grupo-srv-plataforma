import { describe, expect, it } from 'vitest'
import { grupoDePrazo, posicaoAoSoltar, statusDaCategoria } from '@/dominio/kanban'

describe('posicaoAoSoltar', () => {
  const col = [
    { id: 'a', posicao: 'a0' },
    { id: 'b', posicao: 'a1' },
    { id: 'c', posicao: 'a2' },
  ]
  it('no topo', () => {
    expect(posicaoAoSoltar(col, 'x', 0) < 'a0').toBe(true)
  })
  it('no fim', () => {
    expect(posicaoAoSoltar(col, 'x', 3) > 'a2').toBe(true)
  })
  it('entre dois', () => {
    const p = posicaoAoSoltar(col, 'x', 1)
    expect(p > 'a0' && p < 'a1').toBe(true)
  })
  it('ignora o próprio cartão ao reordenar na mesma coluna', () => {
    // move "a" para depois de "b": índice 1 na coluna sem "a"
    const p = posicaoAoSoltar(col, 'a', 1)
    expect(p > 'a1' && p < 'a2').toBe(true)
  })
  it('coluna vazia', () => {
    expect(posicaoAoSoltar([], 'x', 0)).toMatch(/.+/)
  })
})

describe('statusDaCategoria', () => {
  const st = [
    { id: '1', nome: 'A fazer', cor: '', categoria: 'todo' as const },
    { id: '2', nome: 'Fazendo', cor: '', categoria: 'in_progress' as const },
    { id: '3', nome: 'Revisão', cor: '', categoria: 'in_progress' as const },
    { id: '4', nome: 'Feito', cor: '', categoria: 'done' as const },
  ]
  it('primeiro status da categoria', () => {
    expect(statusDaCategoria(st, 'in_progress')).toBe('2')
    expect(statusDaCategoria(st, 'done')).toBe('4')
  })
  it('sem status na categoria', () => {
    expect(statusDaCategoria(st.slice(0, 1), 'done')).toBeNull()
  })
})

describe('grupoDePrazo', () => {
  it.each([
    [null, null, 'sem-prazo'],
    ['2026-10-05', null, 'atrasadas'],
    ['2026-10-05', '2026-10-05T10:00:00Z', 'depois'],
    ['2026-10-06', null, 'hoje'],
    ['2026-10-12', null, 'semana'],
    ['2026-10-13', null, 'depois'],
  ] as const)('%s (concluída %s) → %s', (prazo, concluida, esperado) => {
    expect(grupoDePrazo(prazo, concluida, '2026-10-06')).toBe(esperado)
  })
})
