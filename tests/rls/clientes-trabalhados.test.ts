import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarCliente, criarUsuario, vincularUsuarioCliente } from '../ajuda/cenario'

describe('marca "trabalhei hoje neste cliente"', () => {
  it('cada pessoa vê e mexe só nas suas marcas, por dia', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const cliente = await criarCliente(db, 'Padaria')
    expect(await executar(db, ana, `insert into client_work_marks (client_id, day) values ($1, '2026-10-19')`, [cliente])).toBe(1)
    // repetir no mesmo dia não duplica (chave única por pessoa, cliente e dia)
    await expect(executar(db, ana, `insert into client_work_marks (client_id, day) values ($1, '2026-10-19')`, [cliente])).rejects.toThrow()
    // outro dia é outra marca: é assim que "zera" à meia-noite
    expect(await executar(db, ana, `insert into client_work_marks (client_id, day) values ($1, '2026-10-20')`, [cliente])).toBe(1)
    expect(await ler(db, ana, `select day::text from client_work_marks where day = '2026-10-20'`)).toHaveLength(1)
    expect(await ler(db, bia, `select * from client_work_marks`)).toEqual([])
    expect(await executar(db, bia, `delete from client_work_marks where client_id = $1`, [cliente])).toBe(0)
    expect(await executar(db, ana, `delete from client_work_marks where client_id = $1 and day = '2026-10-19'`, [cliente])).toBe(1)
  })

  it('não grava em nome de outra pessoa e cliente (portal) não usa', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const cliente = await criarCliente(db, 'Padaria')
    await expect(executar(db, ana, `insert into client_work_marks (user_id, client_id, day) values ($1, $2, '2026-10-19')`, [bia, cliente])).rejects.toThrow(/row-level security/)
    const login = await criarUsuario(db, { role: 'cliente' })
    await vincularUsuarioCliente(db, login, cliente)
    await expect(executar(db, login, `insert into client_work_marks (client_id, day) values ($1, '2026-10-19')`, [cliente])).rejects.toThrow(/row-level security/)
  })
})
