import { expect, it } from 'vitest'

it('lê modo e largura da barra com fallback seguro', async () => {
  const { lerLarguraLateral, lerModoLateral, limitarLargura } = await import('@/dominio/tema-lateral')
  expect(lerModoLateral('recolhida')).toBe('recolhida')
  expect(lerModoLateral('qualquer')).toBe('fixa')
  expect(lerModoLateral(undefined)).toBe('fixa')
  expect(lerLarguraLateral(undefined)).toBe(240)
  expect(lerLarguraLateral('abc')).toBe(240)
  expect(lerLarguraLateral('9999')).toBe(440)
  expect(limitarLargura(10)).toBe(208)
})

it('lembra quais espaços e pastas estão recolhidos', async () => {
  const { escreverFechados, lerFechados } = await import('@/dominio/tema-lateral')
  const a = '11111111-1111-1111-1111-111111111111'
  const b = '22222222-2222-2222-2222-222222222222'
  expect(lerFechados(undefined)).toEqual([])
  expect(lerFechados(`${a}.lixo.${b}.${a}`)).toEqual([a, b])
  expect(lerFechados(escreverFechados([a, b]))).toEqual([a, b])
  expect(lerFechados(Array.from({ length: 100 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`).join('.'))).toHaveLength(60)
})

it('tema claro é o padrão; só "escuro" liga o modo noturno', async () => {
  const { lerModoTema } = await import('@/dominio/tema-lateral')
  expect(lerModoTema(undefined)).toBe('claro')
  expect(lerModoTema('claro')).toBe('claro')
  expect(lerModoTema('qualquer')).toBe('claro')
  expect(lerModoTema('escuro')).toBe('escuro')
})
