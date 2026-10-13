import { describe, expect, it } from 'vitest'
import { criarBanco, ler, comoUsuario, type Banco } from '../ajuda/banco'
import { criarCliente, criarUsuario } from '../ajuda/cenario'

async function modelo(db: Banco, regra: { frequency: string; every?: number; anchor: string; lead?: number }) {
  const cliente = await criarCliente(db, 'Acme')
  const ana = await criarUsuario(db, { role: 'membro' })
  const lista = (await db.query<{ id: string }>(`select id from lists where slug = 'social-conteudo'`)).rows[0].id
  // A regra "toda tarefa tem responsável" é conferida no fim da transação.
  const id = await db.transaction(async (tx) => {
    const { rows } = await tx.query<{ id: string }>(
      `insert into tasks (list_id, client_id, title, priority, estimate_minutes, position) values ($1, $2, 'Relatório semanal', 'alta', 60, 'a0') returning id`,
      [lista, cliente],
    )
    await tx.query(`insert into task_assignees (task_id, user_id) values ($1, $2)`, [rows[0].id, ana])
    return rows[0].id
  })
  await db.query(
    `insert into task_recurrences (task_id, frequency, every, anchor_date, lead_days) values ($1, $2, $3, $4, $5)`,
    [id, regra.frequency, regra.every ?? 1, regra.anchor, regra.lead ?? 0],
  )
  return { id, ana }
}

const copias = (db: Banco) =>
  db.query(`select title, priority, estimate_minutes, due_date::text as due from tasks where title = 'Relatório semanal' and due_date is not null order by due_date`)

describe('recorrências', () => {
  it('cria a cópia só quando o prazo chega e não duplica', async () => {
    const db = await criarBanco()
    const { id, ana } = await modelo(db, { frequency: 'weekly', anchor: '2026-11-02' })
    expect((await db.query(`select gerar_recorrencias('2026-11-01') as n`)).rows).toEqual([{ n: 0 }])
    expect((await db.query(`select gerar_recorrencias('2026-11-02') as n`)).rows).toEqual([{ n: 1 }])
    expect((await db.query(`select gerar_recorrencias('2026-11-02') as n`)).rows).toEqual([{ n: 0 }])
    expect((await copias(db)).rows).toEqual([{ title: 'Relatório semanal', priority: 'alta', estimate_minutes: 60, due: '2026-11-02' }])
    const nova = (await db.query<{ id: string }>(`select id from tasks where due_date is not null`)).rows[0].id
    expect(nova).not.toBe(id)
    expect((await db.query(`select user_id from task_assignees where task_id = $1`, [nova])).rows).toEqual([{ user_id: ana }])
    expect((await db.query(`select 1 from task_recurrences where task_id = $1`, [nova])).rows).toEqual([])
  })

  it('recupera períodos perdidos, respeita a antecedência e o fim do mês', async () => {
    const db = await criarBanco()
    await modelo(db, { frequency: 'monthly', anchor: '2026-01-31', lead: 3 })
    expect((await db.query(`select gerar_recorrencias('2026-03-29') as n`)).rows).toEqual([{ n: 3 }])
    expect((await copias(db)).rows.map((r) => (r as { due: string }).due)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
  })

  it('regra pausada ou modelo arquivado não geram', async () => {
    const db = await criarBanco()
    const { id } = await modelo(db, { frequency: 'daily', anchor: '2026-11-02' })
    await db.query(`update task_recurrences set active = false`)
    expect((await db.query(`select gerar_recorrencias('2026-12-01') as n`)).rows).toEqual([{ n: 0 }])
    await db.query(`update task_recurrences set active = true`)
    await db.query(`update tasks set archived_at = now() where id = $1`, [id])
    expect((await db.query(`select gerar_recorrencias('2026-12-01') as n`)).rows).toEqual([{ n: 0 }])
  })

  it('equipe lê a regra; cliente não; ninguém logado dispara a geração', async () => {
    const db = await criarBanco()
    const { ana } = await modelo(db, { frequency: 'daily', anchor: '2026-11-02' })
    expect(await ler(db, ana, `select frequency from task_recurrences`)).toEqual([{ frequency: 'daily' }])
    await expect(comoUsuario(db, ana, (tx) => tx.query(`select gerar_recorrencias('2026-11-02')`))).rejects.toThrow(/permission denied/)
  })
})
