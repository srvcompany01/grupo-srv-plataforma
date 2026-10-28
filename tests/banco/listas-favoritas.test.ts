import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarEspaco, criarUsuario } from '../ajuda/cenario'

async function base(db: Banco) {
  const espaco = await criarEspaco(db, 'Roteiros')
  const ana = await criarUsuario(db, { role: 'membro' })
  const bia = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, espaco, ana, 'membro')
  await adicionarMembro(db, espaco, bia, 'membro')
  const lista = (await db.query<{ id: string }>(`insert into lists (space_id, name, position) values ($1, 'L', 'a0') returning id`, [espaco])).rows[0].id
  return { ana, bia, lista }
}

const favoritar = (db: Banco, user: string, lista: string) =>
  comoUsuario(db, user, (tx) => tx.query(`insert into list_favorites (user_id, list_id) values ($1, $2)`, [user, lista]))

describe('listas favoritas', () => {
  it('cada pessoa vê só as suas e não favorita duas vezes', async () => {
    const db = await criarBanco()
    const { ana, bia, lista } = await base(db)
    await favoritar(db, ana, lista)
    await expect(favoritar(db, ana, lista)).rejects.toThrow(/duplicate|unique/)
    expect(await ler(db, ana, `select count(*)::int as n from list_favorites`)).toEqual([{ n: 1 }])
    expect(await ler(db, bia, `select count(*)::int as n from list_favorites`)).toEqual([{ n: 0 }])
  })

  it('não grava em nome de outra pessoa nem como cliente; apagar a lista leva a estrela junto', async () => {
    const db = await criarBanco()
    const { ana, bia, lista } = await base(db)
    await expect(comoUsuario(db, ana, (tx) => tx.query(`insert into list_favorites (user_id, list_id) values ($1, $2)`, [bia, lista]))).rejects.toThrow(/row-level security/)
    const cli = await criarUsuario(db, { role: 'cliente' })
    await expect(favoritar(db, cli, lista)).rejects.toThrow(/row-level security/)
    await favoritar(db, ana, lista)
    await db.query(`delete from lists where id = $1`, [lista])
    expect((await db.query(`select count(*)::int as n from list_favorites`)).rows).toEqual([{ n: 0 }])
  })
})
