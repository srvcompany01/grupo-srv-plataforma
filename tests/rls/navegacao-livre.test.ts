import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, executar, ler } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarPasta, criarUsuario, idEspaco } from '../ajuda/cenario'

describe('navegação livre', () => {
  it('administrador cria itens na raiz e toda a equipe pode visualizá-los', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const membro = await criarUsuario(db, { role: 'membro' })
    const cliente = await criarCliente(db, 'Cliente raiz')

    expect(
      await executar(db, admin, `insert into folders (space_id, name, position) values (null, 'Pasta solta', 'a0')`),
    ).toBe(1)
    const [{ id: pasta }] = await ler<{ id: string }>(db, admin, `select id from folders where name = 'Pasta solta'`)
    expect(
      await executar(
        db,
        admin,
        `insert into lists (space_id, folder_id, client_id, name, position) values (null, $1, $2, 'Lista solta', 'a0')`,
        [pasta, cliente],
      ),
    ).toBe(1)
    const [{ id: lista }] = await ler<{ id: string }>(db, admin, `select id from lists where name = 'Lista solta'`)

    expect(await ler<{ id: string }>(db, admin, `select id from folders where id = $1`, [pasta])).toEqual([{ id: pasta }])
    expect(await ler<{ id: string }>(db, membro, `select id from lists where id = $1`, [lista])).toEqual([{ id: lista }])
    expect(await ler<{ permitido: boolean }>(db, membro, `select can_access_space_target(null::uuid) as permitido`)).toEqual([
      { permitido: true },
    ])
    await expect(ler(db, null, `select can_access_space_target(null::uuid)`)).rejects.toThrow(/permission denied/)
    await expect(
      executar(db, membro, `insert into folders (space_id, name, position) values (null, 'Bloqueada', 'a1')`),
    ).rejects.toThrow(/row-level security/)
  })

  it('mover uma pasta também move suas listas entre o espaço e a raiz', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const conteudo = await idEspaco(db, 'Conteúdo')
    const cliente = await criarCliente(db, 'Cliente')
    const pasta = await criarPasta(db, conteudo)
    const lista = await criarLista(db, { spaceId: conteudo, folderId: pasta, clientId: cliente })

    expect(await executar(db, admin, `update folders set space_id = null where id = $1`, [pasta])).toBe(1)
    expect(await ler<{ space_id: string | null }>(db, admin, `select space_id from lists where id = $1`, [lista])).toEqual([
      { space_id: null },
    ])

    expect(await executar(db, admin, `update folders set space_id = $2 where id = $1`, [pasta, conteudo])).toBe(1)
    expect(await ler<{ space_id: string | null }>(db, admin, `select space_id from lists where id = $1`, [lista])).toEqual([
      { space_id: conteudo },
    ])
  })

  it('gestor não consegue retirar uma lista de seu espaço, mas o administrador consegue', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const gestor = await criarUsuario(db, { role: 'gestor' })
    const conteudo = await idEspaco(db, 'Conteúdo')
    const cliente = await criarCliente(db, 'Cliente')
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    await adicionarMembro(db, conteudo, gestor, 'gestor')

    await expect(executar(db, gestor, `update lists set space_id = null where id = $1`, [lista])).rejects.toThrow(
      /row-level security/,
    )
    expect(await executar(db, admin, `update lists set space_id = null where id = $1`, [lista])).toBe(1)
  })

  it('membro cria e acompanha tarefas em uma lista da raiz', async () => {
    const db = await criarBanco()
    const membro = await criarUsuario(db, { role: 'membro' })
    const cliente = await criarCliente(db, 'Cliente')
    const lista = await criarLista(db, { spaceId: null, clientId: cliente })

    const tarefa = await comoUsuario(db, membro, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into tasks (list_id, title, position) values ($1, 'Tarefa solta', 'a0') returning id`,
        [lista],
      )
      await tx.query(`insert into task_assignees (task_id, user_id) values ($1, $2)`, [rows[0].id, membro])
      return rows[0].id
    })

    expect(await ler<{ id: string }>(db, membro, `select id from tasks where id = $1`, [tarefa])).toEqual([{ id: tarefa }])
    expect(await executar(db, membro, `update tasks set title = 'Atualizada' where id = $1`, [tarefa])).toBe(1)
  })
})
