import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const { janelas } = await import('@/servicos/insights-instagram')

describe('janelas de 30 dias da API do Instagram', () => {
  it('7 dias = uma janela de meia-noite a meia-noite (Belém)', () => {
    expect(janelas('2026-10-16', '2026-10-22')).toEqual([{ since: Date.parse('2026-10-16T03:00:00Z') / 1000, until: Date.parse('2026-10-23T03:00:00Z') / 1000 }])
  })
  it('70 dias = 3 janelas contínuas, nenhuma passa de 30 dias', () => {
    const js = janelas('2026-08-01', '2026-10-09')
    expect(js).toHaveLength(3)
    for (let i = 1; i < js.length; i++) expect(js[i].since).toBe(js[i - 1].until)
    expect(js.every((j) => j.until - j.since <= 30 * 86400)).toBe(true)
    expect(js[2].until).toBe(Date.parse('2026-10-10T03:00:00Z') / 1000)
  })
})
