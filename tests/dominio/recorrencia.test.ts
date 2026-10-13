import { expect, it } from 'vitest'
import { descreverRecorrencia } from '@/dominio/recorrencia'

it('descreve a regra no singular e no plural', () => {
  expect(descreverRecorrencia({ frequencia: 'monthly', cada: 1 })).toBe('Repete todo mês')
  expect(descreverRecorrencia({ frequencia: 'weekly', cada: 1 })).toBe('Repete toda semana')
  expect(descreverRecorrencia({ frequencia: 'weekly', cada: 2 })).toBe('Repete a cada 2 semanas')
})
