import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarCliente, criarEspaco, criarLista, criarUsuario, idInterno } from '../ajuda/cenario'

describe('excluir cliente', () => {
  it('só o admin exclui, nunca o interno, e só se nada estiver ligado a ele', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const gestor = await criarUsuario(db, { role: 'gestor' })
    const livre = await criarCliente(db, 'Livre')
    const emUso = await criarCliente(db, 'Em uso')
    await criarLista(db, { spaceId: await criarEspaco(db, 'E'), clientId: emUso })

    expect(await executar(db, gestor, `delete from clients where id = $1`, [livre])).toBe(0)
    expect(await executar(db, admin, `delete from clients where id = $1`, [await idInterno(db)])).toBe(0)
    await expect(executar(db, admin, `delete from clients where id = $1`, [emUso])).rejects.toThrow(/foreign key|violates/)
    expect(await executar(db, admin, `delete from clients where id = $1`, [livre])).toBe(1)
    expect(await ler(db, admin, `select id from clients where id = $1`, [livre])).toEqual([])
  })
})
