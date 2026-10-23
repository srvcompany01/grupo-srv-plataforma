import { describe, expect, it } from 'vitest'
import { consultaPeriodo, lerPeriodo, rotuloPeriodo } from '@/dominio/periodo-anuncios'

const hoje = '2026-10-23'
describe('período dos anúncios', () => {
  it('atalhos terminam ontem', () => {
    expect(lerPeriodo({}, hoje)).toEqual({ de: '2026-10-16', ate: '2026-10-22', atalho: 7 })
    expect(lerPeriodo({ dias: '30' }, hoje)).toEqual({ de: '2026-09-23', ate: '2026-10-22', atalho: 30 })
  })
  it('intervalo escolhido; inválido volta a 7 dias; futuro corta em hoje', () => {
    expect(lerPeriodo({ de: '2026-10-01', ate: '2026-10-10' }, hoje)).toEqual({ de: '2026-10-01', ate: '2026-10-10', atalho: null })
    expect(lerPeriodo({ de: '2026-10-10', ate: '2026-10-01' }, hoje).atalho).toBe(7)
    expect(lerPeriodo({ de: '2026-10-20', ate: '2026-12-31' }, hoje)).toEqual({ de: '2026-10-20', ate: hoje, atalho: null })
    expect(lerPeriodo({ de: '2020-01-01', ate: '2026-10-01' }, hoje).atalho).toBe(7)
    expect(lerPeriodo({ de: 'x', ate: '2026-10-01' }, hoje).atalho).toBe(7)
  })
  it('URL e rótulo', () => {
    expect(consultaPeriodo(lerPeriodo({}, hoje))).toBe('')
    expect(consultaPeriodo(lerPeriodo({ dias: '30' }, hoje))).toBe('dias=30')
    const p = lerPeriodo({ de: '2026-10-01', ate: '2026-10-10' }, hoje)
    expect(consultaPeriodo(p)).toBe('de=2026-10-01&ate=2026-10-10')
    expect(rotuloPeriodo(p)).toBe('01/10 a 10/10/2026')
    expect(rotuloPeriodo(lerPeriodo({ de: '2025-12-20', ate: '2026-01-05' }, hoje))).toBe('20/12/2025 a 05/01/2026')
  })
})
