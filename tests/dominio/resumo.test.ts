import { expect, it } from 'vitest'
import { resumirPor } from '@/dominio/resumo'
import type { Categoria, TarefaResumo } from '@/dominio/tarefas'

function t(id: string, extra: Partial<TarefaResumo> = {}): TarefaResumo {
  return {
    id, titulo: id, paiId: null, statusId: 's', prioridade: 'normal', prazo: null, posicao: id, responsaveis: [], tags: [],
    listaId: 'l1', listaNome: 'Conteúdo', clienteId: 'c1', clienteNome: 'Acme', clienteCor: '#000000', concluidaEm: null, ...extra,
  }
}
const porLista = (x: TarefaResumo) => ({ id: x.listaId, nome: x.listaNome })
const porCliente = (x: TarefaResumo) => ({ id: x.clienteId, nome: x.clienteNome })

it('conta total, andamento, concluídas e atrasadas por departamento', () => {
  const cats: Record<string, Categoria> = { a: 'todo', b: 'in_progress', c: 'done', d: 'todo' }
  const tarefas = [
    t('a', { prazo: '2026-10-01' }),
    t('b'),
    t('c', { prazo: '2026-09-01', concluidaEm: '2026-09-02' }),
    t('d', { listaId: 'l2', listaNome: 'Tráfego' }),
  ]
  const r = resumirPor(tarefas, porLista, (x) => cats[x.id], '2026-10-07')
  expect(r).toEqual([
    { id: 'l1', nome: 'Conteúdo', total: 3, emAndamento: 1, concluidas: 1, atrasadas: 1 },
    { id: 'l2', nome: 'Tráfego', total: 1, emAndamento: 0, concluidas: 0, atrasadas: 0 },
  ])
})

it('agrupa por cliente e ordena por volume', () => {
  const tarefas = [t('a', { clienteId: 'c2', clienteNome: 'Beta' }), t('b'), t('c')]
  const r = resumirPor(tarefas, porCliente, () => 'todo', '2026-10-07')
  expect(r.map((l) => [l.nome, l.total])).toEqual([['Acme', 2], ['Beta', 1]])
})
