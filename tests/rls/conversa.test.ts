import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarTarefa, criarUsuario, idEspaco } from '../ajuda/cenario'

async function base(db: Banco) {
  const conteudo = await idEspaco(db, 'Conteúdo')
  const cliente = await criarCliente(db, 'A')
  const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
  const ana = await criarUsuario(db, { role: 'membro' })
  const bruno = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, conteudo, ana, 'membro')
  await adicionarMembro(db, conteudo, bruno, 'membro')
  const defora = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, await idEspaco(db, 'Comercial'), defora, 'membro')
  const t = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
  return { ana, bruno, defora, t }
}

const comentar = (db: Banco, quem: string, t: string, texto = 'oi') =>
  executar(db, quem, `insert into comments (task_id, body) values ($1, $2)`, [t, texto])

describe('comentários', () => {
  it('comentário nasce interno e com o autor logado', async () => {
    const db = await criarBanco()
    const { ana, bruno, t } = await base(db)
    await executar(db, ana, `insert into comments (task_id, body, author_id) values ($1, 'x', $2)`, [t, bruno])
    expect((await db.query(`select author_id, is_internal from comments`)).rows).toEqual([
      { author_id: ana, is_internal: true },
    ])
  })

  it('só o autor edita o comentário; editar preenche edited_at', async () => {
    const db = await criarBanco()
    const { ana, bruno, t } = await base(db)
    await comentar(db, ana, t)
    expect(await executar(db, bruno, `update comments set body = 'hack'`)).toBe(0)
    expect(await executar(db, bruno, `delete from comments`)).toBe(0)
    expect(await executar(db, ana, `update comments set body = 'editado'`)).toBe(1)
    expect((await db.query(`select body, edited_at is not null as editado from comments`)).rows).toEqual([
      { body: 'editado', editado: true },
    ])
  })

  it('membro de fora não lê comentários nem histórico, nem comenta', async () => {
    const db = await criarBanco()
    const { ana, defora, t } = await base(db)
    await comentar(db, ana, t)
    expect(await ler(db, defora, `select id from comments`)).toEqual([])
    expect(await ler(db, defora, `select id from task_activity`)).toEqual([])
    await expect(comentar(db, defora, t)).rejects.toThrow(/row-level security/)
  })

  it('membro do espaço lê comentários e histórico', async () => {
    const db = await criarBanco()
    const { ana, bruno, t } = await base(db)
    await comentar(db, ana, t)
    expect(await ler(db, bruno, `select id from comments`)).toHaveLength(1)
    expect((await ler(db, bruno, `select id from task_activity`)).length).toBeGreaterThan(0)
  })

  it('anônimo não lê nada', async () => {
    const db = await criarBanco()
    const { ana, t } = await base(db)
    await comentar(db, ana, t)
    expect(await ler(db, null, `select * from comments`)).toEqual([])
    expect(await ler(db, null, `select * from task_activity`)).toEqual([])
  })
})
