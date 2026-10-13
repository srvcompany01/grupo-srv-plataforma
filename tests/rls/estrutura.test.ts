import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarPasta, criarUsuario, idEspaco, statusDaLista, vincularUsuarioCliente } from '../ajuda/cenario'

async function base(db: Banco) {
  const conteudo = await idEspaco(db, 'Conteúdo')
  const comercial = await idEspaco(db, 'Comercial')
  const trafego = await idEspaco(db, 'Tráfego')
  const cliente = await criarCliente(db, 'Padaria X')
  return { conteudo, comercial, trafego, cliente }
}

describe('regras', () => {
  it('lista nova nasce com A fazer, Em andamento, Concluído', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    expect((await statusDaLista(db, lista)).map(({ name, category, color }) => ({ name, category, color }))).toEqual([
      { name: 'A fazer', category: 'todo', color: '#87909e' },
      { name: 'Em andamento', category: 'in_progress', color: '#5b8def' },
      { name: 'Concluído', category: 'done', color: '#2fa36b' },
    ])
  })

  it('pasta de outro espaço é rejeitada', async () => {
    const db = await criarBanco()
    const { conteudo, comercial, cliente } = await base(db)
    const pasta = await criarPasta(db, comercial)
    await expect(criarLista(db, { spaceId: conteudo, clientId: cliente, folderId: pasta })).rejects.toThrow()
  })

  it('mês que não é dia 1 é rejeitado', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    await expect(criarLista(db, { spaceId: conteudo, clientId: cliente, mes: '2026-10-05' })).rejects.toThrow()
    await criarLista(db, { spaceId: conteudo, clientId: cliente, mes: '2026-10-01' })
  })

  it('lista não precisa de cliente', async () => {
    const db = await criarBanco()
    const { conteudo } = await base(db)
    const { rows } = await db.query(`insert into lists (space_id, name, position) values ($1, 'L', 'a0') returning client_id`, [conteudo])
    expect(rows).toEqual([{ client_id: null }])
  })

  it('não apaga o último status concluído', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    const concluido = (await statusDaLista(db, lista)).find((s) => s.category === 'done')!
    await expect(db.query(`delete from list_statuses where id = $1`, [concluido.id])).rejects.toThrow(
      /pelo menos um status/,
    )
    await expect(
      db.query(`update list_statuses set category = 'in_progress' where id = $1`, [concluido.id]),
    ).rejects.toThrow(/pelo menos um status/)
  })

  it('apaga um status concluído quando há outro', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    const concluido = (await statusDaLista(db, lista)).find((s) => s.category === 'done')!
    await db.query(`insert into list_statuses (list_id, name, category, position) values ($1, 'Publicado', 'done', 'b0')`, [lista])
    await db.query(`delete from list_statuses where id = $1`, [concluido.id])
  })

  it('apagar a lista inteira não esbarra na regra dos status', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    await db.query(`delete from lists where id = $1`, [lista])
  })
})

describe('RLS', () => {
  it('gestor de Conteúdo cria lista em Conteúdo; gestor de Tráfego não', async () => {
    const db = await criarBanco()
    const { conteudo, trafego, cliente } = await base(db)
    const gc = await criarUsuario(db, { role: 'gestor' })
    const gt = await criarUsuario(db, { role: 'gestor' })
    await adicionarMembro(db, conteudo, gc, 'gestor')
    await adicionarMembro(db, trafego, gt, 'gestor')
    const sql = `insert into lists (space_id, client_id, name, position) values ($1, $2, 'L', 'a0')`
    expect(await executar(db, gc, sql, [conteudo, cliente])).toBe(1)
    await expect(executar(db, gt, sql, [conteudo, cliente])).rejects.toThrow(/row-level security/)
  })

  it('gestor do espaço edita status da lista', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    const g = await criarUsuario(db, { role: 'gestor' })
    await adicionarMembro(db, conteudo, g, 'gestor')
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    expect(await executar(db, g, `update list_statuses set name = 'Fazer' where list_id = $1 and category = 'todo'`, [lista])).toBe(1)
  })

  it('membro não cria lista nem pasta', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    const m = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, conteudo, m, 'membro')
    await expect(
      executar(db, m, `insert into lists (space_id, client_id, name, position) values ($1, $2, 'L', 'a0')`, [conteudo, cliente]),
    ).rejects.toThrow(/row-level security/)
    await expect(
      executar(db, m, `insert into folders (space_id, name, position) values ($1, 'P', 'a0')`, [conteudo]),
    ).rejects.toThrow(/row-level security/)
  })

  it('membro não altera status da lista', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    const m = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, conteudo, m, 'membro')
    const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    expect(await executar(db, m, `update list_statuses set name = 'X' where list_id = $1`, [lista])).toBe(0)
  })

  it('membro de Conteúdo lê listas e pastas de Conteúdo e não de Comercial', async () => {
    const db = await criarBanco()
    const { conteudo, comercial, cliente } = await base(db)
    const m = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, conteudo, m, 'membro')
    const lc = await criarLista(db, { spaceId: conteudo, clientId: cliente })
    await criarLista(db, { spaceId: comercial, clientId: cliente })
    const pc = await criarPasta(db, conteudo)
    await criarPasta(db, comercial)
    // As listas das áreas fixas (slug) são abertas à equipe e ficam de fora desta conta.
    expect(await ler(db, m, `select id from lists where slug is null`)).toEqual([{ id: lc }])
    expect(await ler(db, m, `select id from folders`)).toEqual([{ id: pc }])
    expect(await ler(db, m, `select id from list_statuses where list_id = '${lc}'`)).toHaveLength(3)
    expect((await ler<{ slug: string }>(db, m, `select slug from lists where slug is not null order by slug`)).map((l) => l.slug)).toEqual(['crm', 'jornada-de-compra', 'playbooks', 'social-conteudo', 'trafego-performance'])
  })

  it('cliente não lê folders, lists nem list_statuses', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    const c = await criarUsuario(db, { role: 'cliente' })
    await vincularUsuarioCliente(db, c, cliente)
    await criarPasta(db, conteudo)
    await criarLista(db, { spaceId: conteudo, clientId: cliente })
    for (const t of ['folders', 'lists', 'list_statuses']) expect(await ler(db, c, `select * from ${t}`), t).toEqual([])
  })

  it('anônimo não lê nada', async () => {
    const db = await criarBanco()
    const { conteudo, cliente } = await base(db)
    await criarPasta(db, conteudo)
    await criarLista(db, { spaceId: conteudo, clientId: cliente })
    for (const t of ['folders', 'lists', 'list_statuses']) expect(await ler(db, null, `select * from ${t}`), t).toEqual([])
  })
})
