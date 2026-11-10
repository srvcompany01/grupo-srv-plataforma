import { describe, expect, it } from 'vitest'
import { limiteDaRota, permitir } from '@/dominio/limite'

describe('limite de pedidos', () => {
  it('só limita os POSTs públicos que gravam', () => {
    expect(limiteDaRota('POST', '/api/leads')?.max).toBe(10)
    expect(limiteDaRota('POST', '/api/blog/newsletter')?.grupo).toBe('formulario')
    expect(limiteDaRota('POST', '/l/padaria/quiz')?.max).toBe(60)
    expect(limiteDaRota('POST', '/l/padaria/v')?.grupo).toBe('contagem')
    expect(limiteDaRota('GET', '/api/leads')).toBeNull()
    expect(limiteDaRota('POST', '/api/mcp')).toBeNull()
    expect(limiteDaRota('POST', '/tarefas')).toBeNull()
  })

  it('barra depois do máximo e libera na janela seguinte, por chave', () => {
    const t = 1_000_000
    for (let i = 0; i < 3; i++) expect(permitir('a', 3, t + i)).toBe(true)
    expect(permitir('a', 3, t + 10)).toBe(false)
    expect(permitir('b', 3, t + 10)).toBe(true)
    expect(permitir('a', 3, t + 60_000)).toBe(true)
  })
})
