import { expect, it } from 'vitest'

it('lê modo e largura da barra com fallback seguro', async () => {
  const { lerLarguraLateral, lerModoLateral, limitarLargura } = await import('@/dominio/tema-lateral')
  expect(lerModoLateral('recolhida')).toBe('recolhida')
  expect(lerModoLateral('qualquer')).toBe('fixa')
  expect(lerModoLateral(undefined)).toBe('fixa')
  expect(lerLarguraLateral(undefined)).toBe(264)
  expect(lerLarguraLateral('abc')).toBe(264)
  expect(lerLarguraLateral('9999')).toBe(440)
  expect(limitarLargura(10)).toBe(208)
})
