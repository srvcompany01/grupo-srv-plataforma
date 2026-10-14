import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarEspaco, criarUsuario } from '../ajuda/cenario'

async function gestor(db: Banco) {
  const espaco = await criarEspaco(db, 'Roteiros')
  const ana = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, espaco, ana, 'gestor')
  return { espaco, ana }
}

const novaLista = (db: Banco, espaco: string, cliente: string | null, nome = 'Lista') =>
  db.query<{ id: string }>(`insert into lists (space_id, client_id, name, position) values ($1, $2, $3, 'a0') returning id`, [espaco, cliente, nome]).then((r) => r.rows[0].id)

const novaTarefa = (db: Banco, lista: string, ana: string, cliente?: string) =>
  db.transaction(async (tx) => {
    const { rows } = await tx.query<{ id: string }>(
      `insert into tasks (list_id, client_id, title, position) values ($1, $2, 'T', 'a0') returning id`,
      [lista, cliente ?? null],
    )
    await tx.query(`insert into task_assignees (task_id, user_id) values ($1, $2)`, [rows[0].id, ana])
    return rows[0].id
  })

describe('lista sem cliente', () => {
  it('cria lista e tarefa sem cliente', async () => {
    const db = await criarBanco()
    const { espaco, ana } = await gestor(db)
    const lista = await novaLista(db, espaco, null)
    const tarefa = await novaTarefa(db, lista, ana)
    expect((await db.query(`select client_id from tasks where id = $1`, [tarefa])).rows).toEqual([{ client_id: null }])
  })

  it('tarefa herda o cliente da lista e pode ter outro', async () => {
    const db = await criarBanco()
    const { espaco, ana } = await gestor(db)
    const acme = await criarCliente(db, 'Acme')
    const beta = await criarCliente(db, 'Beta')
    const lista = await novaLista(db, espaco, acme)
    const herdada = await novaTarefa(db, lista, ana)
    const propria = await novaTarefa(db, lista, ana, beta)
    expect((await db.query(`select id, client_id from tasks where id in ($1, $2) order by client_id`, [herdada, propria])).rows).toHaveLength(2)
    expect((await db.query(`select client_id from tasks where id = $1`, [herdada])).rows).toEqual([{ client_id: acme }])
    expect((await db.query(`select client_id from tasks where id = $1`, [propria])).rows).toEqual([{ client_id: beta }])
  })

  it('tarefa sem cliente continua visível para a equipe e escondida do usuário cliente', async () => {
    const db = await criarBanco()
    const { espaco, ana } = await gestor(db)
    const lista = await novaLista(db, espaco, null)
    await novaTarefa(db, lista, ana)
    const acme = await criarCliente(db, 'Acme')
    const cli = await criarUsuario(db, { role: 'cliente' })
    await db.query(`insert into client_users (user_id, client_id) values ($1, $2)`, [cli, acme])
    expect(await ler(db, ana, `select count(*)::int as n from tasks`)).toEqual([{ n: 1 }])
    expect(await ler(db, cli, `select count(*)::int as n from tasks`)).toEqual([{ n: 0 }])
  })
})

describe('duplicar_lista', () => {
  it('copia nome, visual, status e campos, mas não as tarefas', async () => {
    const db = await criarBanco()
    const { espaco, ana } = await gestor(db)
    const lista = await novaLista(db, espaco, null, 'Roteiros')
    await db.query(`update lists set color = '#112233', icon = 'star' where id = $1`, [lista])
    await db.query(`insert into list_statuses (list_id, name, color, category, position) values ($1, 'Revisão', '#ff0000', 'in_progress', 'a15')`, [lista])
    const campo = (await db.query<{ id: string }>(`insert into custom_fields (space_id, name, type, position) values ($1, 'Duração', 'number', 'a0') returning id`, [espaco])).rows[0].id
    await db.query(`insert into list_custom_fields (list_id, field_id, position) values ($1, $2, 'a0')`, [lista, campo])
    await novaTarefa(db, lista, ana)

    const nova = await comoUsuario(db, ana, async (tx) => (await tx.query<{ id: string }>(`select duplicar_lista($1) as id`, [lista])).rows[0].id)

    expect((await db.query(`select name, color, icon, position from lists where id = $1`, [nova])).rows).toEqual([{ name: 'Roteiros (cópia)', color: '#112233', icon: 'star', position: 'a0V' }])
    const status = (await db.query<{ name: string }>(`select name from list_statuses where list_id = $1 order by position`, [nova])).rows.map((s) => s.name)
    expect(status).toEqual(['A fazer', 'Em andamento', 'Revisão', 'Concluído'])
    expect((await db.query(`select field_id from list_custom_fields where list_id = $1`, [nova])).rows).toEqual([{ field_id: campo }])
    expect((await db.query(`select count(*)::int as n from tasks where list_id = $1`, [nova])).rows).toEqual([{ n: 0 }])
  })

  it('quem não gerencia o espaço não duplica', async () => {
    const db = await criarBanco()
    const { espaco } = await gestor(db)
    const lista = await novaLista(db, espaco, null)
    const membro = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, espaco, membro, 'membro')
    await expect(comoUsuario(db, membro, (tx) => tx.query(`select duplicar_lista($1)`, [lista]))).rejects.toThrow(/row-level security/)
  })
})
