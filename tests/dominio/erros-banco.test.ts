import { describe, expect, it } from 'vitest'
import { mensagemErro } from '@/dominio/erros-banco'

describe('mensagemErro', () => {
  it('RLS vira falta de permissão', () => {
    expect(mensagemErro({ code: '42501', message: 'new row violates row-level security policy for table "lists"' })).toBe(
      'Você não tem permissão para isso.',
    )
  })

  it('regra do banco repassa a mensagem', () => {
    expect(mensagemErro({ code: 'P0001', message: 'A tarefa precisa de pelo menos um responsável' })).toBe(
      'A tarefa precisa de pelo menos um responsável',
    )
  })

  it('duplicado', () => {
    expect(mensagemErro({ code: '23505', message: 'duplicate key' })).toBe('Já existe um registro com esses dados.')
  })

  it('qualquer outra coisa é genérica', () => {
    expect(mensagemErro(new Error('socket hang up'))).toBe('Algo deu errado. Tente de novo.')
    expect(mensagemErro(null)).toBe('Algo deu errado. Tente de novo.')
  })
})
