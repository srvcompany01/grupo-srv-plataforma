import { describe, expect, it } from 'vitest'
import { criarBanco, type Banco } from '../ajuda/banco'
import { criarCliente, criarLista, criarTarefa, criarUsuario, idEspaco, statusDaLista } from '../ajuda/cenario'

async function base(db: Banco) {
  const conteudo = await idEspaco(db, 'Conteúdo')
  const a = await criarCliente(db, 'A')
  const b = await criarCliente(db, 'B')
  const lista = await criarLista(db, { spaceId: conteudo, clientId: a })
  const outra = await criarLista(db, { spaceId: conteudo, clientId: b })
  const ana = await criarUsuario(db, { role: 'membro' })
  return { conteudo, a, b, lista, outra, ana }
}

const tarefa = async (db: Banco, id: string) =>
  (
    await db.query<{ list_id: string; client_id: string; status_id: string; completed_at: string | null }>(
      `select list_id, client_id, status_id, completed_at from tasks where id = $1`,
      [id],
    )
  ).rows[0]

describe('tarefas', () => {
  it('client_id vem da lista', async () => {
    const db = await criarBanco()
    const { a, b, lista, ana } = await base(db)
    const t = await db.transaction(async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into tasks (list_id, client_id, title, position) values ($1, $2, 'T', 'a0') returning id`,
        [lista, b],
      )
      await tx.query(`insert into task_assignees values ($1, $2)`, [rows[0].id, ana])
      return rows[0].id
    })
    expect((await tarefa(db, t)).client_id).toBe(a)
  })

  it('client_id não pode ser editado', async () => {
    const db = await criarBanco()
    const { a, b, lista, ana } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    await db.query(`update tasks set client_id = $2 where id = $1`, [t, b])
    expect((await tarefa(db, t)).client_id).toBe(a)
  })

  it('subtarefa herda lista e cliente da mãe', async () => {
    const db = await criarBanco()
    const { a, lista, outra, ana } = await base(db)
    const mae = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const filha = await criarTarefa(db, { listId: outra, responsaveis: [ana], parentId: mae })
    expect(await tarefa(db, filha)).toMatchObject({ list_id: lista, client_id: a })
  })

  it('subtarefa em três níveis; ciclo é rejeitado', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const t1 = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const t2 = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: t1 })
    const t3 = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: t2 })
    await expect(db.query(`update tasks set parent_task_id = $2 where id = $1`, [t1, t3])).rejects.toThrow(
      /Subtarefa não pode conter a tarefa mãe/,
    )
    await expect(db.query(`update tasks set parent_task_id = id where id = $1`, [t1])).rejects.toThrow()
  })

  it('mover tarefa com subtarefas move a árvore', async () => {
    const db = await criarBanco()
    const { b, lista, outra, ana } = await base(db)
    const emAndamento = (await statusDaLista(db, lista)).find((s) => s.category === 'in_progress')!
    const mae = await criarTarefa(db, { listId: lista, responsaveis: [ana], statusId: emAndamento.id })
    const filha = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: mae, statusId: emAndamento.id })
    const neta = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: filha })
    await db.query(`update tasks set list_id = $2 where id = $1`, [mae, outra])
    const aFazerNova = (await statusDaLista(db, outra)).find((s) => s.category === 'todo')!
    for (const id of [mae, filha, neta]) {
      expect(await tarefa(db, id)).toMatchObject({ list_id: outra, client_id: b, status_id: aFazerNova.id })
    }
  })

  it('subtarefa não muda de lista sozinha', async () => {
    const db = await criarBanco()
    const { lista, outra, ana } = await base(db)
    const mae = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const filha = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: mae })
    await db.query(`update tasks set list_id = $2 where id = $1`, [filha, outra])
    expect((await tarefa(db, filha)).list_id).toBe(lista)
  })

  it('status nulo vira A fazer', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const aFazer = (await statusDaLista(db, lista)).find((s) => s.category === 'todo')!
    expect((await tarefa(db, t)).status_id).toBe(aFazer.id)
  })

  it('status de outra lista é rejeitado', async () => {
    const db = await criarBanco()
    const { lista, outra, ana } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const deOutra = (await statusDaLista(db, outra))[0]
    await expect(db.query(`update tasks set status_id = $2 where id = $1`, [t, deOutra.id])).rejects.toThrow(
      /Status não pertence à lista/,
    )
  })

  it('completed_at acompanha concluído', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const st = await statusDaLista(db, lista)
    await db.query(`update tasks set status_id = $2 where id = $1`, [t, st.find((s) => s.category === 'done')!.id])
    expect((await tarefa(db, t)).completed_at).not.toBeNull()
    await db.query(`update tasks set status_id = $2 where id = $1`, [t, st.find((s) => s.category === 'todo')!.id])
    expect((await tarefa(db, t)).completed_at).toBeNull()
  })
})

describe('responsáveis', () => {
  it('tarefa sem responsável é rejeitada', async () => {
    const db = await criarBanco()
    const { lista } = await base(db)
    await expect(criarTarefa(db, { listId: lista, responsaveis: [] })).rejects.toThrow(/pelo menos um responsável/)
  })

  it('remover o último responsável é rejeitado', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    await expect(db.query(`delete from task_assignees where task_id = $1`, [t])).rejects.toThrow(
      /pelo menos um responsável/,
    )
  })

  it('trocar responsável na mesma transação funciona', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const bruno = await criarUsuario(db, { role: 'membro' })
    const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    await db.transaction(async (tx) => {
      await tx.query(`delete from task_assignees where task_id = $1`, [t])
      await tx.query(`insert into task_assignees values ($1, $2)`, [t, bruno])
    })
    expect((await db.query(`select user_id from task_assignees where task_id = $1`, [t])).rows).toEqual([
      { user_id: bruno },
    ])
  })

  it('cliente não pode ser responsável', async () => {
    const db = await criarBanco()
    const { lista } = await base(db)
    const c = await criarUsuario(db, { role: 'cliente' })
    await expect(criarTarefa(db, { listId: lista, responsaveis: [c] })).rejects.toThrow(/equipe/)
  })
})

describe('etiquetas e listas', () => {
  it('etiqueta de outro espaço é rejeitada', async () => {
    const db = await criarBanco()
    const { lista, ana, conteudo } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const comercial = await idEspaco(db, 'Comercial')
    const operacional = await idEspaco(db, 'Operacional')
    const tag = async (space: string) =>
      (await db.query<{ id: string }>(`insert into tags (space_id, name) values ($1, 'x') returning id`, [space])).rows[0].id
    await expect(db.query(`insert into task_tags values ($1, $2)`, [t, await tag(comercial)])).rejects.toThrow()
    await db.query(`insert into task_tags values ($1, $2)`, [t, await tag(conteudo)])
    await db.query(`insert into task_tags values ($1, $2)`, [t, await tag(operacional)])
  })

  it('trocar a tag de cliente sincroniza mãe e subtarefas', async () => {
    const db = await criarBanco()
    const { lista, ana, b } = await base(db)
    const mae = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const filha = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: mae })
    await db.query(`update lists set client_id = $2 where id = $1`, [lista, b])
    expect((await tarefa(db, mae)).client_id).toBe(b)
    expect((await tarefa(db, filha)).client_id).toBe(b)
  })

  it('troca o cliente de uma lista vazia', async () => {
    const db = await criarBanco()
    const { lista, b } = await base(db)
    await db.query(`update lists set client_id = $2 where id = $1`, [lista, b])
  })

  it('cor da tag exige hexadecimal completo', async () => {
    const db = await criarBanco()
    const cliente = await criarCliente(db, 'Colorido')
    await db.query(`update clients set color = '#3b82f6' where id = $1`, [cliente])
    await expect(db.query(`update clients set color = 'azul' where id = $1`, [cliente])).rejects.toThrow()
  })
})

describe('arquivamento em cascata', () => {
  it('arquivar a mãe arquiva as subtarefas', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const mae = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const filha = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: mae })
    const neta = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: filha })
    await db.query(`update tasks set archived_at = now() where id = $1`, [mae])
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from tasks where archived_at is null and id in ($1, $2)`, [filha, neta])
    expect(rows[0].n).toBe(0)
  })

  it('arquivar pasta arquiva as listas; arquivar espaço arquiva pastas e listas', async () => {
    const db = await criarBanco()
    const { conteudo, a } = await base(db)
    const pasta = (await db.query<{ id: string }>(`insert into folders (space_id, name, position) values ($1, 'P', 'a0') returning id`, [conteudo])).rows[0].id
    const naPasta = await criarLista(db, { spaceId: conteudo, clientId: a, folderId: pasta })
    await db.query(`update folders set archived_at = now() where id = $1`, [pasta])
    expect((await db.query(`select archived_at is not null as arq from lists where id = $1`, [naPasta])).rows).toEqual([{ arq: true }])
    const comercial = await idEspaco(db, 'Comercial')
    const lc = await criarLista(db, { spaceId: comercial, clientId: a })
    await db.query(`update spaces set archived_at = now() where id = $1`, [comercial])
    expect((await db.query(`select archived_at is not null as arq from lists where id = $1`, [lc])).rows).toEqual([{ arq: true }])
  })

  it('desarquivar tarefa sem responsáveis é rejeitado', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    await db.query(`update tasks set archived_at = now() where id = $1`, [t])
    await db.query(`delete from task_assignees where task_id = $1`, [t])
    await expect(db.query(`update tasks set archived_at = null where id = $1`, [t])).rejects.toThrow(/pelo menos um responsável/)
  })
})
