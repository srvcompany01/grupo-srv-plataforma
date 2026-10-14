import { expect, it } from 'vitest'
import { ehSubtarefa, tarefasDoCalendario } from '@/dominio/calendario'

const t = (id: string, paiId: string | null = null) => ({ id, paiId })
const todas = [t('sub1', 'mae'), t('mae'), t('sub2', 'mae'), t('outra')]

it('só tarefas-mãe', () => expect(tarefasDoCalendario(todas, 'maes').map((x) => x.id)).toEqual(['mae', 'outra']))
it('só subtarefas', () => expect(tarefasDoCalendario(todas, 'subtarefas').map((x) => x.id)).toEqual(['sub1', 'sub2']))
it('ambas: mães primeiro, nada se perde', () => {
  const r = tarefasDoCalendario(todas, 'ambas').map((x) => x.id)
  expect(r).toEqual(['mae', 'outra', 'sub1', 'sub2'])
  expect(r).toHaveLength(todas.length)
})
it('reconhece subtarefa', () => {
  expect(ehSubtarefa(t('a', 'b'))).toBe(true)
  expect(ehSubtarefa(t('a'))).toBe(false)
})
