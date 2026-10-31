import { describe, expect, it } from 'vitest'
import { dataEHoraEmBelem, diaDaSemana, formatarHorario, formatarPrazo, horarioValido } from '@/dominio/prazo'

describe('prazo', () => {
  it('dia da semana abreviado', () => {
    expect(diaDaSemana('2026-10-31')).toBe('sáb')
    expect(diaDaSemana('2026-11-02')).toBe('seg')
  })
  it('horário curto', () => {
    expect(formatarHorario('10:00')).toBe('10h')
    expect(formatarHorario('10:30')).toBe('10h30')
    expect(formatarHorario('09:05')).toBe('9h05')
  })
  it('layout segue o que foi escolhido: só a data ou data e horário', () => {
    expect(formatarPrazo('2026-10-31')).toBe('31/10 (sáb)')
    expect(formatarPrazo('2026-10-31', null)).toBe('31/10 (sáb)')
    expect(formatarPrazo('2026-10-31', '10:00')).toBe('31/10 (sáb) · 10h')
    expect(formatarPrazo('2026-10-31', '15:30', { ano: true })).toBe('31/10/2026 (sáb) · 15h30')
  })
  it('valida horário', () => {
    expect(horarioValido('23:59')).toBe(true)
    expect(horarioValido('24:00')).toBe(false)
    expect(horarioValido('9:00')).toBe(false)
    expect(horarioValido(null)).toBe(false)
  })
  it('converte um instante para data e hora de Belém (UTC-3)', () => {
    expect(dataEHoraEmBelem('2026-10-31T13:00:00Z')).toEqual({ data: '2026-10-31', horario: '10:00' })
    expect(dataEHoraEmBelem('2026-11-01T02:30:00Z')).toEqual({ data: '2026-10-31', horario: '23:30' })
  })
})
