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

const salvar = (db: Banco, user: string, lista: string, params: string) =>
  comoUsuario(db, user, (tx) =>
    tx.query(`insert into saved_views (user_id, list_id, params) values ($1, $2, $3) on conflict (user_id, list_id) do update set params = excluded.params`, [user, lista, params]),
  )

describe('visões salvas', () => {
  it('cada pessoa guarda a sua e não enxerga a dos outros', async () => {
    const db = await criarBanco()
    const { ana, bia, lista } = await base(db)
    await salvar(db, ana, lista, 'visao=kanban')
    await salvar(db, bia, lista, 'grupo=mes')
    expect(await ler(db, ana, `select params from saved_views`)).toEqual([{ params: 'visao=kanban' }])
    expect(await ler(db, bia, `select params from saved_views`)).toEqual([{ params: 'grupo=mes' }])
  })

  it('salvar de novo substitui (uma por pessoa e lista) e apagar volta ao original', async () => {
    const db = await criarBanco()
    const { ana, lista } = await base(db)
    await salvar(db, ana, lista, 'visao=kanban')
    await salvar(db, ana, lista, 'visao=calendario')
    expect(await ler(db, ana, `select params from saved_views`)).toEqual([{ params: 'visao=calendario' }])
    await comoUsuario(db, ana, (tx) => tx.query(`delete from saved_views where list_id = $1`, [lista]))
    expect(await ler(db, ana, `select count(*)::int as n from saved_views`)).toEqual([{ n: 0 }])
  })

  it('não grava em nome de outra pessoa nem texto vazio; usuário cliente não grava', async () => {
    const db = await criarBanco()
    const { ana, bia, lista } = await base(db)
    await expect(salvar(db, ana, lista, '')).rejects.toThrow(/check/)
    await expect(comoUsuario(db, ana, (tx) => tx.query(`insert into saved_views (user_id, list_id, params) values ($1, $2, 'a=1')`, [bia, lista]))).rejects.toThrow(/row-level security/)
    const cli = await criarUsuario(db, { role: 'cliente' })
    await expect(salvar(db, cli, lista, 'visao=kanban')).rejects.toThrow(/row-level security/)
  })

  it('apagar a lista leva a visão junto', async () => {
    const db = await criarBanco()
    const { ana, lista } = await base(db)
    await salvar(db, ana, lista, 'visao=kanban')
    await db.query(`delete from lists where id = $1`, [lista])
    expect((await db.query(`select count(*)::int as n from saved_views`)).rows).toEqual([{ n: 0 }])
  })
})
