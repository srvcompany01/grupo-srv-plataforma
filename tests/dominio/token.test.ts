import { expect, it } from 'vitest'
import { gerarToken } from '@/dominio/token'

it('gera 32 caracteres alfanuméricos', () => {
  for (let i = 0; i < 100; i++) expect(gerarToken()).toMatch(/^[A-Za-z0-9]{32}$/)
})

it('não repete', () => {
  expect(new Set(Array.from({ length: 1000 }, gerarToken)).size).toBe(1000)
})
