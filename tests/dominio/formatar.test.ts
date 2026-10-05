import { expect, it } from 'vitest'
import { formatarData, ROTULO_FORMATO, ROTULO_STATUS } from '@/dominio/formatar'

it('formata a data sem deslocar o dia por fuso', () => {
  expect(formatarData('2026-10-07')).toBe('07/10/2026')
  expect(formatarData('2026-01-01')).toBe('01/01/2026')
})

it('tem rótulo para todo status e formato', () => {
  expect(ROTULO_STATUS.ajuste).toBe('Ajuste solicitado')
  expect(ROTULO_FORMATO.reels).toBe('Reels')
})
