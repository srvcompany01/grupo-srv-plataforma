import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, executar, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarTarefa, criarUsuario, idEspaco, vincularUsuarioCliente } from '../ajuda/cenario'

async function base(db: Banco) {
  const conteudo = await idEspaco(db, 'Conteúdo')
  const comercial = await idEspaco(db, 'Comercial')
  const cliente = await criarCliente(db, 'A')
  const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
  const listaComercial = await criarLista(db, { spaceId: comercial, clientId: cliente })
  const membro = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, conteudo, membro, 'membro')
  const gestor = await criarUsuario(db, { role: 'gestor' })
  await adicionarMembro(db, conteudo, gestor, 'gestor')
  const defora = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, comercial, defora, 'membro')
  return { conteudo, comercial, cliente, lista, listaComercial, membro, gestor, defora }
}

/** Cria tarefa + responsável como `quem`, em dois comandos na mesma transação (como fará a RPC). */
const criarComo = (db: Banco, quem: string, lista: string) =>
  comoUsuario(db, quem, async (tx) => {
    const { rows } = await tx.query<{ id: string }>(
      `insert into tasks (list_id, title, position) values ($1, 'T', 'a0') returning id`,
      [lista],
    )
    await tx.query(`insert into task_assignees values ($1, $2)`, [rows[0].id, quem])
    return rows[0].id
  })

describe('RLS de tarefas', () => {
  it('membro do espaço lê, cria e edita tarefa', async () => {
    const db = await criarBanco()
    const { lista, membro, gestor } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [gestor] })
    expect(await ler(db, membro, `select id from tasks`)).toEqual([{ id: t }])
    expect(await criarComo(db, membro, lista)).toBeTruthy()
    expect(await executar(db, membro, `update tasks set title = 'Novo' where id = $1`, [t])).toBe(1)
    expect(await executar(db, membro, `insert into task_assignees values ($1, $2)`, [t, membro])).toBe(1)
  })

  it('membro de fora não lê a tarefa nem cria na lista', async () => {
    const db = await criarBanco()
    const { lista, membro, defora } = await base(db)
    await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    expect(await ler(db, defora, `select id from tasks`)).toEqual([])
    await expect(criarComo(db, defora, lista)).rejects.toThrow(/row-level security/)
  })

  it('membro de fora que é responsável lê e edita a tarefa e lê a lista, mas não as outras tarefas da lista', async () => {
    const db = await criarBanco()
    const { lista, membro, defora } = await base(db)
    const dele = await criarTarefa(db, { listId: lista, responsaveis: [defora] })
    await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    expect(await ler(db, defora, `select id from tasks where list_id = $1`, [lista])).toEqual([{ id: dele }])
    expect(await ler(db, defora, `select id from lists where id = $1`, [lista])).toEqual([{ id: lista }])
    expect(await ler(db, defora, `select id from list_statuses where list_id = $1`, [lista])).toHaveLength(3)
    expect(await executar(db, defora, `update tasks set title = 'X' where id = $1`, [dele])).toBe(1)
  })

  it('membro não arquiva; gestor do espaço arquiva', async () => {
    const db = await criarBanco()
    const { lista, membro, gestor } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    await expect(executar(db, membro, `update tasks set archived_at = now() where id = $1`, [t])).rejects.toThrow(
      /Só gestores arquivam tarefas/,
    )
    expect(await executar(db, gestor, `update tasks set archived_at = now() where id = $1`, [t])).toBe(1)
  })

  it('ninguém apaga tarefa', async () => {
    const db = await criarBanco()
    const { lista, membro } = await base(db)
    const admin = await criarUsuario(db, { role: 'admin' })
    const t = await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    expect(await executar(db, admin, `delete from tasks where id = $1`, [t])).toBe(0)
  })

  it('gestor de Tráfego não lê tarefas do Comercial', async () => {
    const db = await criarBanco()
    const { listaComercial, defora } = await base(db)
    const gt = await criarUsuario(db, { role: 'gestor' })
    await adicionarMembro(db, await idEspaco(db, 'Tráfego'), gt, 'gestor')
    await criarTarefa(db, { listId: listaComercial, responsaveis: [defora] })
    expect(await ler(db, gt, `select id from tasks`)).toEqual([])
  })

  it('cliente não lê tarefas nesta fase', async () => {
    const db = await criarBanco()
    const { lista, cliente, membro } = await base(db)
    const c = await criarUsuario(db, { role: 'cliente' })
    await vincularUsuarioCliente(db, c, cliente)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    await db.query(`update tasks set visible_to_client = true where id = $1`, [t])
    for (const tb of ['tasks', 'task_assignees', 'task_tags', 'tags']) expect(await ler(db, c, `select * from ${tb}`), tb).toEqual([])
  })

  it('responsáveis e etiquetas seguem a tarefa', async () => {
    const db = await criarBanco()
    const { lista, conteudo, membro, defora } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    const { rows } = await db.query<{ id: string }>(`insert into tags (space_id, name) values ($1, 'x') returning id`, [conteudo])
    await db.query(`insert into task_tags values ($1, $2)`, [t, rows[0].id])
    expect(await ler(db, membro, `select task_id from task_assignees`)).toHaveLength(1)
    expect(await ler(db, membro, `select task_id from task_tags`)).toHaveLength(1)
    expect(await ler(db, defora, `select task_id from task_assignees`)).toEqual([])
    expect(await ler(db, defora, `select task_id from task_tags`)).toEqual([])
    expect(await ler(db, defora, `select id from tags`)).toEqual([])
  })

  it('membro não cria etiqueta; gestor cria', async () => {
    const db = await criarBanco()
    const { conteudo, membro, gestor } = await base(db)
    const sql = `insert into tags (space_id, name) values ($1, 'x')`
    await expect(executar(db, membro, sql, [conteudo])).rejects.toThrow(/row-level security/)
    expect(await executar(db, gestor, sql, [conteudo])).toBe(1)
  })

  it('anônimo não lê nada', async () => {
    const db = await criarBanco()
    const { lista, membro } = await base(db)
    await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    for (const tb of ['tasks', 'task_assignees', 'task_tags', 'tags']) expect(await ler(db, null, `select * from ${tb}`), tb).toEqual([])
  })
})

describe('mover tarefa (revisão final)', () => {
  it('responsável de fora não move a tarefa para lista de outro departamento', async () => {
    const db = await criarBanco()
    const { lista, listaComercial, defora } = await base(db)
    const m = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, await idEspaco(db, 'Tráfego'), m, 'membro')
    const t = await criarTarefa(db, { listId: lista, responsaveis: [m] })
    await expect(executar(db, m, `update tasks set list_id = $2 where id = $1`, [t, listaComercial])).rejects.toThrow(
      /não tem acesso à lista de destino/,
    )
    expect(defora).toBeTruthy()
  })

  it('membro do espaço não move tarefa para lista de espaço alheio', async () => {
    const db = await criarBanco()
    const { lista, listaComercial, membro } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    await expect(executar(db, membro, `update tasks set list_id = $2 where id = $1`, [t, listaComercial])).rejects.toThrow(
      /não tem acesso à lista de destino/,
    )
  })

  it('não pendura tarefa sob tarefa que não enxerga', async () => {
    const db = await criarBanco()
    const { lista, listaComercial, membro, defora } = await base(db)
    const t = await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    const alheia = await criarTarefa(db, { listId: listaComercial, responsaveis: [defora] })
    await expect(executar(db, membro, `update tasks set parent_task_id = $2 where id = $1`, [t, alheia])).rejects.toThrow(
      /não tem acesso/,
    )
  })

  it('membro move tarefa entre listas do próprio espaço', async () => {
    const db = await criarBanco()
    const { lista, membro, conteudo } = await base(db)
    const outra = await criarLista(db, { spaceId: conteudo, clientId: await criarCliente(db, 'B') })
    const t = await criarTarefa(db, { listId: lista, responsaveis: [membro] })
    expect(await executar(db, membro, `update tasks set list_id = $2 where id = $1`, [t, outra])).toBe(1)
  })
})

describe('anônimo e funções', () => {
  it('anônimo não executa funções auxiliares', async () => {
    const db = await criarBanco()
    const { lista } = await base(db)
    await expect(ler(db, null, `select list_space($1)`, [lista])).rejects.toThrow(/permission denied/)
    await expect(ler(db, null, `select primeiro_status_a_fazer($1)`, [lista])).rejects.toThrow(/permission denied/)
    await expect(ler(db, null, `select is_admin()`)).rejects.toThrow(/permission denied/)
  })

  it('usuário logado continua executando as funções usadas pelo app', async () => {
    const db = await criarBanco()
    const { membro, conteudo } = await base(db)
    expect(await ler(db, membro, `select is_space_manager($1) as r`, [conteudo])).toEqual([{ r: false }])
  })
})
