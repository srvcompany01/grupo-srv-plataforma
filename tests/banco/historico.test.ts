import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, executar, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarTarefa, criarUsuario, idEspaco, statusDaLista } from '../ajuda/cenario'

type Linha = { action: string; field: string | null; old_value: unknown; new_value: unknown; actor_id: string | null }

async function base(db: Banco) {
  const conteudo = await idEspaco(db, 'Conteúdo')
  const cliente = await criarCliente(db, 'A')
  const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
  const ana = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, conteudo, ana, 'membro')
  const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
  return { conteudo, cliente, lista, ana, t }
}

const historico = async (db: Banco, t: string) =>
  (
    await db.query<Linha>(
      `select action, field, old_value, new_value, actor_id from task_activity where task_id = $1 order by created_at, id`,
      [t],
    )
  ).rows

describe('histórico', () => {
  it('criar tarefa registra created com ator', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const t = await comoUsuario(db, ana, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into tasks (list_id, title, position) values ($1, 'T', 'a0') returning id`,
        [lista],
      )
      await tx.query(`insert into task_assignees values ($1, $2)`, [rows[0].id, ana])
      return rows[0].id
    })
    const h = await historico(db, t)
    expect(h[0]).toMatchObject({ action: 'created', actor_id: ana })
    expect(h[1]).toMatchObject({ action: 'assignee_added', new_value: { user_id: ana } })
  })

  it('mudar título e prioridade registra duas linhas updated com valores antigo e novo', async () => {
    const db = await criarBanco()
    const { ana, t } = await base(db)
    await executar(db, ana, `update tasks set title = 'Novo', priority = 'alta' where id = $1`, [t])
    const h = (await historico(db, t)).filter((l) => l.action === 'updated')
    expect(h).toEqual(
      expect.arrayContaining([
        { action: 'updated', field: 'title', old_value: 'Tarefa', new_value: 'Novo', actor_id: ana },
        { action: 'updated', field: 'priority', old_value: 'normal', new_value: 'alta', actor_id: ana },
      ]),
    )
    expect(h).toHaveLength(2)
  })

  it('mudar status registra updated de status_id', async () => {
    const db = await criarBanco()
    const { ana, t, lista } = await base(db)
    const [aFazer, emAndamento] = await statusDaLista(db, lista)
    await executar(db, ana, `update tasks set status_id = $2 where id = $1`, [t, emAndamento.id])
    expect((await historico(db, t)).filter((l) => l.action === 'updated')).toEqual([
      { action: 'updated', field: 'status_id', old_value: aFazer.id, new_value: emAndamento.id, actor_id: ana },
    ])
  })

  it('mover registra moved só na tarefa movida', async () => {
    const db = await criarBanco()
    const { ana, t, conteudo, cliente, lista } = await base(db)
    const filha = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: t })
    const outra = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    await executar(db, ana, `update tasks set list_id = $2 where id = $1`, [t, outra])
    const h = await historico(db, t)
    expect(h.filter((l) => l.action === 'moved')).toEqual([
      { action: 'moved', field: 'list_id', old_value: lista, new_value: outra, actor_id: ana },
    ])
    expect(h.filter((l) => l.action === 'updated')).toEqual([])
    expect((await historico(db, filha)).filter((l) => !['created', 'assignee_added'].includes(l.action))).toEqual([])
  })

  it('arquivar registra archived', async () => {
    const db = await criarBanco()
    const { t } = await base(db)
    await db.query(`update tasks set archived_at = now() where id = $1`, [t])
    expect((await historico(db, t)).map((l) => l.action)).toContain('archived')
  })

  it('adicionar e remover responsável registra', async () => {
    const db = await criarBanco()
    const { ana, t } = await base(db)
    const bruno = await criarUsuario(db, { role: 'membro' })
    await executar(db, ana, `insert into task_assignees values ($1, $2)`, [t, bruno])
    await executar(db, ana, `delete from task_assignees where task_id = $1 and user_id = $2`, [t, ana])
    const h = await historico(db, t)
    expect(h).toEqual(
      expect.arrayContaining([
        { action: 'assignee_added', field: null, old_value: null, new_value: { user_id: bruno }, actor_id: ana },
        { action: 'assignee_removed', field: null, old_value: { user_id: ana }, new_value: null, actor_id: ana },
      ]),
    )
  })

  it('etiquetas registram', async () => {
    const db = await criarBanco()
    const { ana, t, conteudo } = await base(db)
    const { rows } = await db.query<{ id: string }>(`insert into tags (space_id, name) values ($1, 'x') returning id`, [conteudo])
    await executar(db, ana, `insert into task_tags values ($1, $2)`, [t, rows[0].id])
    await executar(db, ana, `delete from task_tags where task_id = $1`, [t])
    const acoes = (await historico(db, t)).map((l) => l.action)
    expect(acoes).toContain('tag_added')
    expect(acoes).toContain('tag_removed')
  })

  it('ninguém insere em task_activity', async () => {
    const db = await criarBanco()
    const { ana, t } = await base(db)
    await expect(
      executar(db, ana, `insert into task_activity (task_id, action) values ($1, 'created')`, [t]),
    ).rejects.toThrow(/row-level security/)
  })
})

describe('histórico de campos personalizados', () => {
  async function comCampo(db: Banco) {
    const s = await base(db)
    const { rows } = await db.query<{ id: string }>(
      `insert into custom_fields (space_id, name, type, config, position)
       values ($1, 'Gatilho', 'dropdown', '{"options":["Desejo","Medo"]}'::jsonb, 'a0') returning id`,
      [s.conteudo],
    )
    await db.query(`insert into list_custom_fields (list_id, field_id, position) values ($1, $2, 'a0')`, [s.lista, rows[0].id])
    return { ...s, campo: rows[0].id }
  }
  const deCampos = async (db: Banco, t: string) => (await historico(db, t)).filter((l) => l.action === 'field_set')

  it('definir campo grava field_set', async () => {
    const db = await criarBanco()
    const { ana, t, campo } = await comCampo(db)
    await executar(db, ana, `insert into task_custom_field_values (task_id, field_id, value) values ($1, $2, '"Desejo"')`, [t, campo])
    expect(await deCampos(db, t)).toEqual([{ action: 'field_set', field: campo, old_value: null, new_value: 'Desejo', actor_id: ana }])
  })

  it('mesmo valor não gera histórico', async () => {
    const db = await criarBanco()
    const { ana, t, campo } = await comCampo(db)
    await executar(db, ana, `insert into task_custom_field_values (task_id, field_id, value) values ($1, $2, '"Desejo"')`, [t, campo])
    await executar(db, ana, `update task_custom_field_values set value = '"Desejo"' where task_id = $1`, [t])
    expect(await deCampos(db, t)).toHaveLength(1)
  })

  it('limpar campo grava new_value nulo', async () => {
    const db = await criarBanco()
    const { ana, t, campo } = await comCampo(db)
    await executar(db, ana, `insert into task_custom_field_values (task_id, field_id, value) values ($1, $2, '"Desejo"')`, [t, campo])
    await executar(db, ana, `delete from task_custom_field_values where task_id = $1`, [t])
    expect((await deCampos(db, t))[1]).toEqual({ action: 'field_set', field: campo, old_value: 'Desejo', new_value: null, actor_id: ana })
  })
})
