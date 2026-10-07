import { expect, it } from 'vitest'
import { cssLateral, normalizarHex, variaveisLateral } from '@/dominio/tema-lateral'

it('normaliza hex com e sem #, curto e maiúsculo', () => {
  expect(normalizarHex('d11a22')).toBe('#D11A22')
  expect(normalizarHex('#abc')).toBe('#AABBCC')
  expect(normalizarHex('  #7a0f14 ')).toBe('#7A0F14')
})

it('rejeita hex inválido e tentativa de injetar CSS', () => {
  expect(normalizarHex('#12345')).toBeNull()
  expect(normalizarHex('red')).toBeNull()
  expect(normalizarHex('#fff;}body{display:none')).toBeNull()
})

it('usa texto escuro em fundo claro e claro em fundo escuro', () => {
  expect(variaveisLateral('#F6F6F7')['--lat-fg']).toBe('#111111')
  expect(variaveisLateral('#7A0F14')['--lat-fg']).toBe('#FFFFFF')
  expect(variaveisLateral('#D11A22')['--lat-fg']).toBe('#FFFFFF')
})

it('cai no padrão quando o hex é inválido', () => {
  expect(cssLateral('lixo')).toContain('--lat-bg:#F6F6F7')
})

it('lê modo e largura da barra com fallback seguro', async () => {
  const { lerLarguraLateral, lerModoLateral, limitarLargura } = await import('@/dominio/tema-lateral')
  expect(lerModoLateral('recolhida')).toBe('recolhida')
  expect(lerModoLateral('qualquer')).toBe('fixa')
  expect(lerModoLateral(undefined)).toBe('fixa')
  expect(lerLarguraLateral(undefined)).toBe(272)
  expect(lerLarguraLateral('abc')).toBe(272)
  expect(lerLarguraLateral('9999')).toBe(440)
  expect(limitarLargura(10)).toBe(208)
})
