import { describe, expect, it } from 'vitest'
import { criarBanco, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarEspaco, criarUsuario } from '../ajuda/cenario'

async function cenario(db: Banco) {
  const espaco = await criarEspaco(db, 'Roteiros')
  const ana = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, espaco, ana, 'gestor')
  const lista = (await db.query<{ id: string }>(`insert into lists (space_id, name, position) values ($1, 'L', 'a0') returning id`, [espaco])).rows[0].id
  const outraLista = (await db.query<{ id: string }>(`insert into lists (space_id, name, position) values ($1, 'Outra', 'a1') returning id`, [espaco])).rows[0].id
  const campo = (await db.query<{ id: string }>(`insert into custom_fields (space_id, name, type, config, position) values ($1, 'Formato', 'dropdown', '{"options":["Reels","Feed"]}', 'a0') returning id`, [espaco])).rows[0].id
  await db.query(`insert into list_custom_fields (list_id, field_id, position) values ($1, $2, 'a0')`, [lista, campo])
  const tarefa = (listaId: string) =>
    db.transaction(async (tx) => {
      const { rows } = await tx.query<{ id: string }>(`insert into tasks (list_id, title, position) values ($1, 'T', 'a0') returning id`, [listaId])
      await tx.query(`insert into task_assignees (task_id, user_id) values ($1, $2)`, [rows[0].id, ana])
      return rows[0].id
    })
  return { lista, outraLista, campo, tarefa }
}

/** O mesmo comando que o servidor envia: um upsert com uma linha por tarefa. */
const gravar = (db: Banco, ids: string[], campo: string, valor: string) =>
  db.query(
    `insert into task_custom_field_values (task_id, field_id, value) select t, $2, to_jsonb($3::text) from unnest($1::uuid[]) as t
     on conflict (task_id, field_id) do update set value = excluded.value`,
    [ids, campo, valor],
  )

describe('campo personalizado em lote', () => {
  it('grava o mesmo valor em várias tarefas e depois troca por outro', async () => {
    const db = await criarBanco()
    const { lista, campo, tarefa } = await cenario(db)
    const a = await tarefa(lista)
    const b = await tarefa(lista)
    await gravar(db, [a, b], campo, 'Reels')
    expect((await db.query(`select text_value from task_custom_field_values order by task_id`)).rows).toEqual([{ text_value: 'Reels' }, { text_value: 'Reels' }])
    await gravar(db, [a, b], campo, 'Feed')
    expect((await db.query(`select distinct text_value from task_custom_field_values`)).rows).toEqual([{ text_value: 'Feed' }])
  })

  it('limpar apaga o valor das selecionadas e só delas', async () => {
    const db = await criarBanco()
    const { lista, campo, tarefa } = await cenario(db)
    const a = await tarefa(lista)
    const b = await tarefa(lista)
    await gravar(db, [a, b], campo, 'Reels')
    await db.query(`delete from task_custom_field_values where task_id = any($1::uuid[]) and field_id = $2`, [[a], campo])
    expect((await db.query(`select task_id from task_custom_field_values`)).rows).toEqual([{ task_id: b }])
  })

  it('valor fora das opções, ou tarefa de lista sem o campo, derruba o lote inteiro', async () => {
    const db = await criarBanco()
    const { lista, outraLista, campo, tarefa } = await cenario(db)
    const a = await tarefa(lista)
    const fora = await tarefa(outraLista)
    await expect(gravar(db, [a], campo, 'Stories')).rejects.toThrow(/Opção inválida/)
    await expect(gravar(db, [a, fora], campo, 'Reels')).rejects.toThrow(/não está disponível/)
    expect((await db.query(`select count(*)::int as n from task_custom_field_values`)).rows).toEqual([{ n: 0 }])
  })
})
