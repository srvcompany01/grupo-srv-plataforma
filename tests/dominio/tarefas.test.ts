import { describe, expect, it } from 'vitest'
import { agruparPorStatus, montarArvore, type TarefaResumo } from '@/dominio/tarefas'

const t = (id: string, posicao: string, paiId: string | null = null, statusId = 's1'): TarefaResumo => ({
  id,
  titulo: id,
  paiId,
  statusId,
  prioridade: 'normal',
  prazo: null,
  posicao,
  responsaveis: [],
  tags: [],
  listaId: 'l',
  listaNome: 'Lista',
  clienteId: 'c',
  clienteNome: 'C',
  clienteCor: '#3b82f6',
  concluidaEm: null,
})

describe('montarArvore', () => {
  it('monta até a neta e ordena por posição em cada nível', () => {
    const arvore = montarArvore([t('b', 'a2'), t('a', 'a1'), t('a2', 'a2', 'a'), t('a1', 'a1', 'a'), t('n', 'a0', 'a1')])
    expect(arvore.map((x) => x.id)).toEqual(['a', 'b'])
    expect(arvore[0].filhos.map((x) => x.id)).toEqual(['a1', 'a2'])
    expect(arvore[0].filhos[0].filhos.map((x) => x.id)).toEqual(['n'])
  })

  it('filha sem mãe na consulta vira raiz', () => {
    expect(montarArvore([t('f', 'a0', 'invisivel')]).map((x) => x.id)).toEqual(['f'])
  })
})

describe('agruparPorStatus', () => {
  it('mantém a ordem dos status e status vazios', () => {
    const status = [
      { id: 's1', nome: 'A fazer', cor: '#1', categoria: 'todo' as const },
      { id: 's2', nome: 'Em andamento', cor: '#2', categoria: 'in_progress' as const },
      { id: 's3', nome: 'Concluído', cor: '#3', categoria: 'done' as const },
    ]
    const grupos = agruparPorStatus(montarArvore([t('a', 'a0', null, 's3'), t('b', 'a1', null, 's1')]), status)
    expect(grupos.map((g) => [g.status.id, g.tarefas.map((x) => x.id)])).toEqual([
      ['s1', ['b']],
      ['s2', []],
      ['s3', ['a']],
    ])
  })
})
