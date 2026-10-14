import { expect, it } from 'vitest'
import { iconeDoStatus, textoSobreCor } from '@/dominio/status-icone'

const s = (id: string, categoria: 'todo' | 'in_progress' | 'done') => ({ id, categoria })

it('a fatia cresce a cada status em andamento; a fazer é vazio e concluído é cheio', () => {
  const lista = [s('a', 'todo'), s('b', 'in_progress'), s('c', 'in_progress'), s('d', 'in_progress'), s('e', 'done')]
  expect(iconeDoStatus(lista, 'a')).toEqual({ categoria: 'todo', fracao: 0 })
  expect([iconeDoStatus(lista, 'b').fracao, iconeDoStatus(lista, 'c').fracao, iconeDoStatus(lista, 'd').fracao]).toEqual([0.25, 0.5, 0.75])
  expect(iconeDoStatus(lista, 'e')).toEqual({ categoria: 'done', fracao: 1 })
  expect(iconeDoStatus([s('a', 'todo'), s('b', 'in_progress'), s('c', 'done')], 'b').fracao).toBe(0.5)
  expect(iconeDoStatus(lista, 'x')).toEqual({ categoria: 'todo', fracao: 0 })
})

it('texto branco sobre cor escura e escuro sobre cor clara', () => {
  expect(textoSobreCor('#6d28d9')).toBe('#ffffff')
  expect(textoSobreCor('#fde68a')).toBe('#26292e')
})
