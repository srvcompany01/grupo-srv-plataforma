import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarEspaco, criarUsuario } from '../ajuda/cenario'

async function base(db: Banco) {
  const espaco = await criarEspaco(db, 'Social')
  const ana = await criarUsuario(db, { role: 'membro' })
  const bia = await criarUsuario(db, { role: 'membro' })
  const gestora = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, espaco, ana, 'membro')
  await adicionarMembro(db, espaco, bia, 'membro')
  await adicionarMembro(db, espaco, gestora, 'gestor')
  const lista = (await db.query<{ id: string }>(`insert into lists (space_id, name, position) values ($1, 'L', 'a0') returning id`, [espaco])).rows[0].id
  return { ana, bia, gestora, lista }
}

const criar = (db: Banco, user: string, lista: string, kind: string, nome: string, privada = false) =>
  comoUsuario(db, user, (tx) => tx.query(`insert into list_views (list_id, kind, name, is_private, created_by) values ($1, $2, $3, $4, $5)`, [lista, kind, nome, privada, user]))

describe('visualizações da lista', () => {
  it('permite várias do mesmo tipo; a pública é de todos, a privada só de quem criou', async () => {
    const db = await criarBanco()
    const { ana, bia, lista } = await base(db)
    await criar(db, ana, lista, 'lista', 'Lista de posts')
    await criar(db, ana, lista, 'lista', 'Atrasados')
    await criar(db, ana, lista, 'kanban', 'Só minha', true)
    expect(await ler(db, bia, `select name from list_views order by name`)).toEqual([{ name: 'Atrasados' }, { name: 'Lista de posts' }])
    expect(await ler(db, ana, `select name from list_views order by name`)).toHaveLength(3)
  })

  it('só quem criou ou o gestor da lista edita e exclui', async () => {
    const db = await criarBanco()
    const { ana, bia, gestora, lista } = await base(db)
    await criar(db, ana, lista, 'lista', 'A')
    await comoUsuario(db, bia, (tx) => tx.query(`update list_views set name = 'X'`))
    await comoUsuario(db, bia, (tx) => tx.query(`delete from list_views`))
    expect(await ler(db, ana, `select name from list_views`)).toEqual([{ name: 'A' }])
    await comoUsuario(db, gestora, (tx) => tx.query(`update list_views set name = 'B'`))
    expect(await ler(db, ana, `select name from list_views`)).toEqual([{ name: 'B' }])
    await comoUsuario(db, gestora, (tx) => tx.query(`delete from list_views`))
    expect(await ler(db, ana, `select name from list_views`)).toEqual([])
  })

  it('rejeita tipo inválido, nome vazio, gravar em nome de outra pessoa e cliente', async () => {
    const db = await criarBanco()
    const { ana, bia, lista } = await base(db)
    await expect(criar(db, ana, lista, 'mapa', 'X')).rejects.toThrow(/check/)
    await expect(criar(db, ana, lista, 'lista', ' ')).rejects.toThrow(/check/)
    await expect(comoUsuario(db, ana, (tx) => tx.query(`insert into list_views (list_id, kind, name, created_by) values ($1, 'lista', 'X', $2)`, [lista, bia]))).rejects.toThrow(/row-level security/)
    const cli = await criarUsuario(db, { role: 'cliente' })
    await expect(criar(db, cli, lista, 'lista', 'X')).rejects.toThrow(/row-level security/)
  })

  it('apagar a lista leva as visualizações junto', async () => {
    const db = await criarBanco()
    const { ana, lista } = await base(db)
    await criar(db, ana, lista, 'lista', 'A')
    await db.query(`delete from lists where id = $1`, [lista])
    expect((await db.query(`select count(*)::int as n from list_views`)).rows).toEqual([{ n: 0 }])
  })
})
