import { describe, expect, it } from 'vitest'
import { limparOpcoes } from '@/dominio/clientes-galeria'
import { criarBanco } from '../ajuda/banco'
import { criarCliente } from '../ajuda/cenario'

it('limparOpcoes: nome obrigatório, sem repetidas, cor válida, máximo 20', () => {
  expect(limparOpcoes([{ nome: ' Alto ', cor: '#d64545' }, { nome: 'alto', cor: '#000000' }, { nome: '', cor: '#111111' }, { nome: 'Baixo', cor: 'vermelho' }])).toEqual([
    { nome: 'Alto', cor: '#d64545' },
    { nome: 'Baixo', cor: '#87909e' },
  ])
  expect(limparOpcoes('lixo')).toEqual([])
  expect(limparOpcoes(Array.from({ length: 30 }, (_, i) => ({ nome: `o${i}`, cor: '#111111' })))).toHaveLength(20)
})

describe('campo de seleção do cliente', () => {
  it('"Risco de churn" já existe e só aceita as opções cadastradas', async () => {
    const db = await criarBanco()
    const cliente = await criarCliente(db, 'Padaria')
    const { rows } = await db.query<{ id: string }>(`select id from client_fields where name = 'Risco de churn' and kind = 'selecao'`)
    expect(rows).toHaveLength(1)
    const campo = rows[0].id
    await db.query(`insert into client_field_values (client_id, field_id, value) values ($1, $2, 'Alto')`, [cliente, campo])
    await expect(db.query(`update client_field_values set value = 'Qualquer' where client_id = $1`, [cliente])).rejects.toThrow(/Escolha uma das opções/)
  })
})

it('churn: Baixo azul, Médio laranja, Alto vermelho; e existe o campo Cidade (texto, na galeria)', async () => {
  const db = await criarBanco()
  const { rows } = await db.query<{ options: { nome: string; cor: string }[] }>(`select options from client_fields where name = 'Risco de churn'`)
  expect(rows[0].options).toEqual([
    { nome: 'Baixo', cor: '#3b82f6' },
    { nome: 'Médio', cor: '#f97316' },
    { nome: 'Alto', cor: '#d64545' },
  ])
  const cidade = await db.query(`select kind, show_on_card from client_fields where name = 'Cidade'`)
  expect(cidade.rows).toEqual([{ kind: 'texto', show_on_card: true }])
})
