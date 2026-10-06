import { describe, expect, it } from 'vitest'
import { descreverAtividade } from '@/dominio/atividade'

const nomes = {
  status: { s1: 'A fazer', s2: 'Em andamento' },
  usuarios: { u2: 'Bruno' },
  tags: { t1: 'Urgente cliente' },
}
const d = (a: Partial<Parameters<typeof descreverAtividade>[0]>) =>
  descreverAtividade({ action: 'updated', field: null, old_value: null, new_value: null, ator: 'Ana', ...a }, nomes)

describe('descreverAtividade', () => {
  it('descreve cada ação', () => {
    expect(d({ action: 'created' })).toBe('Ana criou a tarefa')
    expect(d({ action: 'moved' })).toBe('Ana moveu a tarefa')
    expect(d({ action: 'archived' })).toBe('Ana arquivou a tarefa')
    expect(d({ field: 'status_id', old_value: 's1', new_value: 's2' })).toBe(
      'Ana mudou o status de A fazer para Em andamento',
    )
    expect(d({ action: 'assignee_added', new_value: { user_id: 'u2' } })).toBe('Ana adicionou Bruno como responsável')
    expect(d({ action: 'assignee_removed', old_value: { user_id: 'u2' } })).toBe('Ana removeu Bruno dos responsáveis')
    expect(d({ action: 'tag_added', new_value: { tag_id: 't1' } })).toBe('Ana adicionou a etiqueta Urgente cliente')
    expect(d({ action: 'tag_removed', old_value: { tag_id: 't1' } })).toBe('Ana removeu a etiqueta Urgente cliente')
  })

  it('descreve campos', () => {
    expect(d({ field: 'due_date', old_value: null, new_value: '2026-10-07' })).toBe('Ana mudou o prazo de — para 07/10/2026')
    expect(d({ field: 'title', old_value: 'A', new_value: 'B' })).toBe('Ana mudou o título de "A" para "B"')
    expect(d({ field: 'priority', old_value: 'normal', new_value: 'urgente' })).toBe(
      'Ana mudou a prioridade de Normal para Urgente',
    )
    expect(d({ field: 'estimate_minutes', old_value: null, new_value: 90 })).toBe(
      'Ana mudou a estimativa de — para 1h30',
    )
    expect(d({ field: 'description' })).toBe('Ana editou a descrição')
    expect(d({ field: 'visible_to_client', new_value: true })).toBe('Ana deixou a tarefa visível para o cliente')
    expect(d({ field: 'visible_to_client', new_value: false })).toBe('Ana ocultou a tarefa do cliente')
  })

  it('usuário e status desconhecidos', () => {
    expect(d({ action: 'assignee_added', new_value: { user_id: 'x' } })).toBe('Ana adicionou alguém como responsável')
    expect(descreverAtividade({ action: 'created', field: null, old_value: null, new_value: null, ator: null }, nomes)).toBe(
      'Sistema criou a tarefa',
    )
  })
})
