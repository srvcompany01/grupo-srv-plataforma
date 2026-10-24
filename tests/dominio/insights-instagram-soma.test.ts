import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

describe('P1-7: cliques no perfil', () => {
  it('null quando a Meta não entrega em nenhuma janela; 0 só quando ela responde 0', async () => {
    const { somaOuNulo } = await import('@/servicos/insights-instagram')
    expect(somaOuNulo([null, null])).toBeNull()
    expect(somaOuNulo([0, null])).toBe(0)
    expect(somaOuNulo([3, 4])).toBe(7)
  })
})
