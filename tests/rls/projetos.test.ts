import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarCliente, criarLista, criarUsuario } from '../ajuda/cenario'

describe('lista de projetos', () => {
  it('lista solta que a equipe toda vê; só uma pode ser a de projetos; membro não marca', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const membro = await criarUsuario(db, { role: 'membro' })
    const cliente = await criarCliente(db, 'Interno')
    const a = await criarLista(db, { spaceId: null, clientId: cliente, nome: 'Projetos' })
    const b = await criarLista(db, { spaceId: null, clientId: cliente, nome: 'Outra' })
    expect(await executar(db, membro, `update lists set is_projects = true where id = $1`, [a])).toBe(0)
    expect(await executar(db, admin, `update lists set is_projects = true where id = $1`, [a])).toBe(1)
    await expect(executar(db, admin, `update lists set is_projects = true where id = $1`, [b])).rejects.toThrow(/duplicate|unique/)
    expect(await ler(db, membro, `select name from lists where is_projects`)).toEqual([{ name: 'Projetos' }])
  })
})
