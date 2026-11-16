import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarEspaco, criarLista, criarTarefa, criarUsuario, statusDaLista } from '../ajuda/cenario'

/** Dois espaços fechados: o atacante (A) só está no primeiro; o dono (B) é o único no segundo, onde mora o modelo restrito. */
async function cenario(db: Banco) {
  const clienteA = await criarCliente(db, 'A')
  const clienteB = await criarCliente(db, 'B')
  const espA = await criarEspaco(db, 'Acessível')
  const espB = await criarEspaco(db, 'Restrita')
  const listaA = await criarLista(db, { spaceId: espA, clientId: clienteA })
  const listaB = await criarLista(db, { spaceId: espB, clientId: clienteB })
  const atacante = await criarUsuario(db, { role: 'membro' })
  const dono = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, espA, atacante, 'membro')
  await adicionarMembro(db, espB, dono, 'membro')
  const propria = await criarTarefa(db, { listId: listaA, responsaveis: [atacante], titulo: 'Minha' })
  const modelo = await criarTarefa(db, { listId: listaB, responsaveis: [dono], titulo: 'Modelo restrito' })
  return { atacante, dono, espA, espB, listaA, listaB, propria, modelo, clienteA, clienteB }
}

const regraComoUsuario = (db: Banco, u: string, tarefa: string, modo = 'on_complete') =>
  comoUsuario(db, u, (tx) => tx.query(`insert into task_recurrences (task_id, frequency, anchor_date, create_mode) values ($1, 'daily', '2026-01-01', $2)`, [tarefa, modo]))

const concluir = async (db: Banco, usuario: string, tarefa: string, lista: string) => {
  const feito = (await statusDaLista(db, lista)).find((s) => s.category === 'done')!.id
  return comoUsuario(db, usuario, (tx) => tx.query(`update tasks set status_id = $2 where id = $1`, [tarefa, feito]))
}
const copiasDe = (db: Banco, modelo: string) => db.query<{ id: string }>(`select id from tasks where recurrence_source_id = $1`, [modelo]).then((r) => r.rows)

describe('A1: o vínculo da série é só do sistema', () => {
  it('UPDATE forjando o vínculo (a reprodução do Vigilante) é recusado e nada é criado na lista restrita', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    await db.query(`insert into task_recurrences (task_id, frequency, anchor_date, create_mode) values ($1, 'daily', current_date, 'on_complete')`, [c.modelo])
    await expect(comoUsuario(db, c.atacante, (tx) => tx.query(`update tasks set recurrence_source_id = $2 where id = $1`, [c.propria, c.modelo]))).rejects.toThrow(/só pelo sistema/)
    await expect(concluir(db, c.atacante, c.propria, c.listaA)).resolves.toBeTruthy()
    expect(await copiasDe(db, c.modelo)).toEqual([])
    expect((await db.query(`select count(*)::int as n from tasks where list_id = $1`, [c.listaB])).rows).toEqual([{ n: 1 }]) // só o modelo
  })

  it('INSERT com vínculo fabricado também é recusado (usuário logado e visitante)', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    await expect(
      comoUsuario(db, c.atacante, (tx) => tx.query(`insert into tasks (list_id, title, position, recurrence_source_id) values ($1, 'Forjada', 'a0', $2)`, [c.listaA, c.modelo])),
    ).rejects.toThrow(/só pelo sistema/)
  })

  it('apagar ou trocar o vínculo de uma cópia legítima também não é permitido ao usuário', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    await db.query(`insert into task_recurrences (task_id, frequency, anchor_date, create_mode) values ($1, 'daily', '2026-01-01', 'schedule')`, [c.modelo])
    await db.query(`select gerar_recorrencias('2026-01-01')`)
    const [copia] = await copiasDe(db, c.modelo)
    await expect(comoUsuario(db, c.dono, (tx) => tx.query(`update tasks set recurrence_source_id = null where id = $1`, [copia.id]))).rejects.toThrow(/só pelo sistema/)
    // outros campos da cópia continuam editáveis
    await comoUsuario(db, c.dono, (tx) => tx.query(`update tasks set title = 'Renomeada' where id = $1`, [copia.id]))
  })

  it('a geração interna continua gravando o vínculo', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    await db.query(`insert into task_recurrences (task_id, frequency, anchor_date, create_mode) values ($1, 'daily', '2026-01-01', 'schedule')`, [c.modelo])
    expect(await db.query(`select gerar_recorrencias('2026-01-02') as n`).then((r) => r.rows)).toEqual([{ n: 2 }])
    expect(await copiasDe(db, c.modelo)).toHaveLength(2)
  })
})

describe('A1: autor da regra revalidado ao gerar', () => {
  it('o banco registra quem criou e quem editou a regra; o contador não troca o autor', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    await regraComoUsuario(db, c.dono, c.modelo, 'schedule')
    expect((await db.query(`select author_id = $2 as ok from task_recurrences where task_id = $1`, [c.modelo, c.dono])).rows).toEqual([{ ok: true }])
    await db.query(`select gerar_recorrencias('2026-01-03')`) // service role: não mexe no autor
    expect((await db.query(`select author_id = $2 as ok, generated from task_recurrences where task_id = $1`, [c.modelo, c.dono])).rows).toEqual([{ ok: true, generated: 3 }])
    const outro = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, c.espB, outro, 'membro')
    await comoUsuario(db, outro, (tx) => tx.query(`update task_recurrences set every = 2 where task_id = $1`, [c.modelo]))
    expect((await db.query(`select author_id = $2 as ok from task_recurrences where task_id = $1`, [c.modelo, outro])).rows).toEqual([{ ok: true }])
  })

  it('cron: autor desativado ou sem acesso ao modelo, a série para; com acesso, segue', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    await regraComoUsuario(db, c.dono, c.modelo, 'schedule')
    await db.query(`update profiles set active = false where id = $1`, [c.dono])
    expect(await db.query(`select gerar_recorrencias('2026-01-05') as n`).then((r) => r.rows)).toEqual([{ n: 0 }])
    await db.query(`update profiles set active = true where id = $1`, [c.dono])
    await db.query(`delete from space_members where space_id = $1 and user_id = $2`, [c.espB, c.dono]) // perdeu o espaço; ainda é responsável do modelo
    expect(await db.query(`select gerar_recorrencias('2026-01-05') as n`).then((r) => r.rows)).toEqual([{ n: 5 }])
    // Sem espaço e sem ser responsável: perde o acesso ao modelo (outra pessoa assume a tarefa para o banco aceitar).
    const outro = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, c.espB, outro, 'membro')
    await db.transaction(async (tx) => {
      await tx.query(`insert into task_assignees (task_id, user_id) values ($1, $2)`, [c.modelo, outro])
      await tx.query(`delete from task_assignees where task_id = $1 and user_id = $2`, [c.modelo, c.dono])
    })
    const antes = (await copiasDe(db, c.modelo)).length
    expect(await db.query(`select gerar_recorrencias('2026-01-20') as n`).then((r) => r.rows)).toEqual([{ n: 0 }])
    expect((await copiasDe(db, c.modelo)).length).toBe(antes)
    // Quando o novo responsável edita a regra, ele passa a responder por ela e a série volta.
    await comoUsuario(db, outro, (tx) => tx.query(`update task_recurrences set lead_days = 1 where task_id = $1`, [c.modelo]))
    expect((await db.query(`select gerar_recorrencias('2026-01-20') as n`)).rows[0]).toMatchObject({ n: expect.any(Number) })
    expect((await copiasDe(db, c.modelo)).length).toBeGreaterThan(antes)
  })

  it('conclusão depois que o autor perdeu o acesso: não cria nada', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    const membro = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, c.espB, membro, 'membro')
    await db.query(`insert into task_assignees (task_id, user_id) values ($1, $2)`, [c.modelo, membro]) // outro responsável: o modelo continua com alguém
    await regraComoUsuario(db, c.dono, c.modelo)
    await db.query(`delete from space_members where space_id = $1 and user_id = $2`, [c.espB, c.dono])
    await db.query(`delete from task_assignees where task_id = $1 and user_id = $2`, [c.modelo, c.dono])
    await concluir(db, membro, c.modelo, c.listaB)
    expect(await copiasDe(db, c.modelo)).toEqual([]) // o autor (dono) não tem mais acesso, quem concluiu não conta
  })

  it('conclusão normal com o autor com acesso ainda cria a próxima', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    await regraComoUsuario(db, c.dono, c.modelo)
    await concluir(db, c.dono, c.modelo, c.listaB)
    expect(await copiasDe(db, c.modelo)).toHaveLength(1)
  })

  it('cópia que mudou de lista ou de cliente não continua a série ao ser concluída', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    await regraComoUsuario(db, c.dono, c.modelo)
    await concluir(db, c.dono, c.modelo, c.listaB)
    const [copia] = await copiasDe(db, c.modelo)
    const outraLista = await criarLista(db, { spaceId: c.espB, clientId: c.clienteA })
    await db.query(`update tasks set list_id = $2 where id = $1`, [copia.id, outraLista])
    await concluir(db, c.dono, copia.id, outraLista)
    expect(await copiasDe(db, c.modelo)).toHaveLength(1) // continua só a primeira cópia
    expect((await db.query(`select count(*)::int as n from tasks where list_id = $1`, [c.listaB])).rows[0]).toEqual({ n: 1 }) // só o modelo: nada voltou para a lista dele
  })
})

describe('R3: lista na raiz é aberta à equipe', () => {
  it('autor ativo que não é responsável continua gerando a série numa lista na raiz (cron e ao concluir)', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    const raiz = await criarLista(db, { spaceId: null, clientId: c.clienteA })
    const modelo = await criarTarefa(db, { listId: raiz, responsaveis: [c.dono], titulo: 'Modelo na raiz' })
    // O atacante do cenário é um membro comum de outro espaço: na raiz ele lê o modelo, mas não é responsável.
    expect((await comoUsuario(db, c.atacante, (tx) => tx.query<{ ok: boolean }>(`select can_read_task($1) as ok`, [modelo]))).rows).toEqual([{ ok: true }])
    await regraComoUsuario(db, c.atacante, modelo, 'schedule')
    expect((await db.query(`select autor_pode_gerar(author_id, task_id) as ok from task_recurrences where task_id = $1`, [modelo])).rows).toEqual([{ ok: true }])
    expect(await db.query(`select gerar_recorrencias('2026-01-02') as n`).then((r) => r.rows)).toEqual([{ n: 2 }])

    // "Ao concluir": outro modelo na raiz, com o mesmo autor não responsável.
    const outro = await criarTarefa(db, { listId: raiz, responsaveis: [c.dono], titulo: 'Outro modelo na raiz' })
    await regraComoUsuario(db, c.atacante, outro)
    await concluir(db, c.dono, outro, raiz)
    expect((await copiasDe(db, outro)).length).toBe(1)
  })

  it('na raiz, autor desativado ou fora da equipe continua sem gerar', async () => {
    const db = await criarBanco()
    const c = await cenario(db)
    const raiz = await criarLista(db, { spaceId: null, clientId: c.clienteA })
    const modelo = await criarTarefa(db, { listId: raiz, responsaveis: [c.dono], titulo: 'Modelo na raiz' })
    await regraComoUsuario(db, c.atacante, modelo, 'schedule')
    await db.query(`update profiles set active = false where id = $1`, [c.atacante])
    expect(await db.query(`select gerar_recorrencias('2026-01-02') as n`).then((r) => r.rows)).toEqual([{ n: 0 }])
  })
})

