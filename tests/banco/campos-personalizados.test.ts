import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { adicionarMembro, criarLista, criarTarefa, criarUsuario, idEspaco, idInterno } from '../ajuda/cenario'

async function base(db: Awaited<ReturnType<typeof criarBanco>>) {
  const [conteudo, comercial, cliente, admin] = await Promise.all([
    idEspaco(db, 'Conteúdo'),
    idEspaco(db, 'Comercial'),
    idInterno(db),
    criarUsuario(db, { role: 'admin' }),
  ])
  return { conteudo, comercial, cliente, admin }
}

async function criarCampo(db: Awaited<ReturnType<typeof criarBanco>>, espaco: string, tipo: string, config = '{}') {
  const r = await db.query<{ id: string }>(
    `insert into custom_fields (space_id, name, type, config, position) values ($1, 'Campo', $2, $3::jsonb, 'a0') returning id`,
    [espaco, tipo, config],
  )
  return r.rows[0].id
}

describe('campos personalizados', () => {
  it('normaliza dinheiro para agregação e preserva a moeda na configuração', async () => {
    const db = await criarBanco()
    const { conteudo, cliente, admin } = await base(db)
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    const tarefa = await criarTarefa(db, { listId: lista, responsaveis: [admin] })
    const campo = await criarCampo(db, conteudo, 'money', '{"currency":"BRL","decimals":2}')
    await db.query(`insert into list_custom_fields (list_id, field_id, position) values ($1, $2, 'a0')`, [lista, campo])
    await db.query(`insert into task_custom_field_values (task_id, field_id, value) values ($1, $2, '1250.5'::jsonb)`, [tarefa, campo])
    expect(await ler<{ number_value: string }>(db, admin, `select number_value from task_custom_field_values where task_id = $1`, [tarefa])).toEqual([
      { number_value: '1250.5' },
    ])
  })

  it('recusa valor com tipo incompatível', async () => {
    const db = await criarBanco()
    const { conteudo, cliente, admin } = await base(db)
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    const tarefa = await criarTarefa(db, { listId: lista, responsaveis: [admin] })
    const campo = await criarCampo(db, conteudo, 'money')
    await db.query(`insert into list_custom_fields (list_id, field_id, position) values ($1, $2, 'a0')`, [lista, campo])
    await expect(
      db.query(`insert into task_custom_field_values (task_id, field_id, value) values ($1, $2, '"cem"'::jsonb)`, [tarefa, campo]),
    ).rejects.toThrow(/número/i)
  })

  it('não permite vincular campo de outro espaço', async () => {
    const db = await criarBanco()
    const { conteudo, comercial, cliente } = await base(db)
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    const campo = await criarCampo(db, comercial, 'text')
    await expect(db.query(`insert into list_custom_fields (list_id, field_id, position) values ($1, $2, 'a0')`, [lista, campo])).rejects.toThrow(/mesmo espaço/i)
  })

  it('gestor cria campo no seu espaço e membro não', async () => {
    const db = await criarBanco()
    const { conteudo } = await base(db)
    const gestor = await criarUsuario(db, { role: 'gestor' })
    const membro = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, conteudo, gestor, 'gestor')
    await adicionarMembro(db, conteudo, membro, 'membro')
    const sql = `insert into custom_fields (space_id, name, type, position) values ($1, 'Telefone', 'phone', 'a0')`
    expect(await executar(db, gestor, sql, [conteudo])).toBe(1)
    await expect(executar(db, membro, sql, [conteudo])).rejects.toThrow(/row-level security/i)
  })
})
