import { describe, expect, it } from 'vitest'
import { formatarData, ROTULO_FORMATO, ROTULO_STATUS } from '@/dominio/formatar'

it('formata a data sem deslocar o dia por fuso', () => {
  expect(formatarData('2026-10-07')).toBe('07/10/2026')
  expect(formatarData('2026-01-01')).toBe('01/01/2026')
})

it('tem rótulo para todo status e formato', () => {
  expect(ROTULO_STATUS.ajuste).toBe('Ajuste solicitado')
  expect(ROTULO_FORMATO.reels).toBe('Reels')
})

it('formata data e hora no fuso de Belém', async () => {
  const { formatarDataHora } = await import('@/dominio/formatar')
  expect(formatarDataHora(new Date('2026-10-07T02:30:00Z'))).toBe('06/10/2026 às 23:30')
})

describe('rotuloMes', () => {
  it('mês curto com ano de dois dígitos, sem fuso', async () => {
    const { rotuloMes } = await import('@/dominio/formatar')
    expect(rotuloMes('2026-10-01')).toBe('out/26')
    expect(rotuloMes('2027-01-01')).toBe('jan/27')
  })
})

describe('duração', () => {
  it('formatarDuracao', async () => {
    const { formatarDuracao } = await import('@/dominio/formatar')
    expect(formatarDuracao(0)).toBe('0min')
    expect(formatarDuracao(2700)).toBe('45min')
    expect(formatarDuracao(4800)).toBe('1h 20min')
    expect(formatarDuracao(7200)).toBe('2h')
    expect(formatarDuracao(59)).toBe('0min')
  })
  it('formatarRelogio', async () => {
    const { formatarRelogio } = await import('@/dominio/formatar')
    expect(formatarRelogio(3723)).toBe('1:02:03')
    expect(formatarRelogio(65)).toBe('0:01:05')
  })
})

describe('formatarDataAtividade', () => {
  it('"jun 1 às 17:51" no fuso de Belém', async () => {
    const { formatarDataAtividade } = await import('@/dominio/formatar')
    expect(formatarDataAtividade(new Date('2026-06-01T20:51:00Z'))).toBe('jun 1 às 17:51')
    // 02:30Z ainda é o dia anterior em Belém
    expect(formatarDataAtividade(new Date('2026-10-07T02:30:00Z'))).toBe('out 6 às 23:30')
  })
})
