import { expect, it } from 'vitest'
import { idsDaArvore } from '@/dominio/arvore-tarefa'

it('a tag de cliente vale para a raiz e todas as descendentes, de qualquer ponto da árvore, sem tocar nas outras', () => {
  const paiDe = new Map<string, string | null>([['mae', null], ['f1', 'mae'], ['f2', 'mae'], ['neto', 'f1'], ['outra', null], ['filhaDeOutra', 'outra']])
  const esperado = ['mae', 'f1', 'f2', 'neto']
  expect(idsDaArvore(paiDe, 'neto').sort()).toEqual([...esperado].sort())
  expect(idsDaArvore(paiDe, 'mae').sort()).toEqual([...esperado].sort())
  expect(idsDaArvore(paiDe, 'outra').sort()).toEqual(['filhaDeOutra', 'outra'])
})
