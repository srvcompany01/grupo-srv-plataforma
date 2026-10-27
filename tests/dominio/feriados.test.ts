import { describe, expect, it } from 'vitest'
import { feriadosDoAno, feriadosEntre } from '@/dominio/feriados'

describe('feriados', () => {
  it('calcula os móveis a partir da Páscoa', () => {
    const f2026 = feriadosDoAno(2026)
    expect(f2026.get('2026-04-05')).toBe('Páscoa')
    expect(f2026.get('2026-04-03')).toBe('Sexta-feira Santa')
    expect(f2026.get('2026-02-17')).toBe('Carnaval')
    expect(f2026.get('2026-06-04')).toBe('Corpus Christi')
    expect(feriadosDoAno(2027).get('2027-03-28')).toBe('Páscoa')
  })
  it('lista entre datas atravessando o ano', () => {
    expect(feriadosEntre('2026-12-20', '2027-01-02').map((f) => f.data)).toEqual(['2026-12-25', '2027-01-01'])
  })
})
