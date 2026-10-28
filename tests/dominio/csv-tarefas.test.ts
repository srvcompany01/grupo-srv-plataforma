import { describe, expect, it } from 'vitest'
import { lerCsvDeTarefas } from '@/dominio/csv-tarefas'

describe('lerCsvDeTarefas', () => {
  it('lê título e vencimento, ignora cabeçalho e linhas vazias', () => {
    expect(lerCsvDeTarefas('titulo,vencimento\nPost A,2026-11-03\n\n"Post, B";05/11/2026\nSó título')).toEqual([
      { titulo: 'Post A', prazo: '2026-11-03' },
      { titulo: 'Post, B', prazo: '2026-11-05' },
      { titulo: 'Só título', prazo: null },
    ])
  })
})
