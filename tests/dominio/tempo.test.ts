import { describe, expect, it } from 'vitest'
import { segundosDecorridos, totalTempo } from '@/dominio/tempo'

const agora = Date.parse('2026-10-07T12:00:00Z')

describe('tempo', () => {
  it('segundosDecorridos', () => {
    expect(segundosDecorridos('2026-10-07T11:58:30Z', agora)).toBe(90)
  })
  it('relógio adiantado não dá negativo', () => {
    expect(segundosDecorridos('2026-10-07T12:00:05Z', agora)).toBe(0)
  })
  it('total soma fechados e o corrido do aberto', () => {
    const regs = [
      { inicio: '2026-10-07T08:00:00Z', fim: '2026-10-07T09:00:00Z', segundos: 3600 },
      { inicio: '2026-10-06T10:00:00Z', fim: '2026-10-06T11:30:00Z', segundos: 5400 },
      { inicio: '2026-10-07T11:59:00Z', fim: null, segundos: null },
    ]
    expect(totalTempo(regs, agora)).toBe(3600 + 5400 + 60)
  })
  it('sem registros', () => expect(totalTempo([], agora)).toBe(0))
})
