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

const salvar = (db: Banco, user: string, lista: string, nome: string, params: string) =>
  comoUsuario(db, user, (tx) => tx.query(`insert into saved_filters (user_id, list_id, name, params) values ($1, $2, $3, $4)`, [user, lista, nome, params]))

describe('filtros salvos', () => {
  it('vários por lista, cada pessoa vê só os seus', async () => {
    const db = await criarBanco()
    const { ana, bia, lista } = await base(db)
    await salvar(db, ana, lista, 'Atrasadas', 'prazo=atrasadas')
    await salvar(db, ana, lista, 'Urgentes', 'prio=urgente')
    await salvar(db, bia, lista, 'Minhas', 'resp=x')
    expect(await ler(db, ana, `select name from saved_filters order by name`)).toEqual([{ name: 'Atrasadas' }, { name: 'Urgentes' }])
    expect(await ler(db, bia, `select name from saved_filters`)).toEqual([{ name: 'Minhas' }])
  })

  it('rejeita nome/params vazios, gravar em nome de outro e usuário cliente', async () => {
    const db = await criarBanco()
    const { ana, bia, lista } = await base(db)
    await expect(salvar(db, ana, lista, ' ', 'a=1')).rejects.toThrow(/check/)
    await expect(salvar(db, ana, lista, 'X', '')).rejects.toThrow(/check/)
    await expect(comoUsuario(db, ana, (tx) => tx.query(`insert into saved_filters (user_id, list_id, name, params) values ($1, $2, 'X', 'a=1')`, [bia, lista]))).rejects.toThrow(/row-level security/)
    const cli = await criarUsuario(db, { role: 'cliente' })
    await expect(salvar(db, cli, lista, 'X', 'a=1')).rejects.toThrow(/row-level security/)
  })

  it('apagar a lista leva os filtros junto', async () => {
    const db = await criarBanco()
    const { ana, lista } = await base(db)
    await salvar(db, ana, lista, 'X', 'a=1')
    await db.query(`delete from lists where id = $1`, [lista])
    expect((await db.query(`select count(*)::int as n from saved_filters`)).rows).toEqual([{ n: 0 }])
  })
})
