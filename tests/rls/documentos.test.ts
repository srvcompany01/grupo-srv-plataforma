import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarEspaco, criarLista, criarUsuario, vincularUsuarioCliente } from '../ajuda/cenario'

async function cenario(db: Banco) {
  const espaco = await criarEspaco(db, 'Docs')
  const dono = await criarUsuario(db, { role: 'membro' })
  const colega = await criarUsuario(db, { role: 'membro' })
  const admin = await criarUsuario(db, { role: 'admin' })
  const cliente = await criarCliente(db, 'Padaria')
  const outroCliente = await criarCliente(db, 'Pizzaria')
  const login = await criarUsuario(db, { role: 'cliente' })
  await vincularUsuarioCliente(db, login, cliente)
  const loginOutro = await criarUsuario(db, { role: 'cliente' })
  await vincularUsuarioCliente(db, loginOutro, outroCliente)
  for (const u of [dono, colega]) await adicionarMembro(db, espaco, u, 'membro')
  const lista = await criarLista(db, { spaceId: espaco, clientId: cliente })
  return { espaco, dono, colega, admin, cliente, outroCliente, login, loginOutro, lista }
}

const criarDoc = async (db: Banco, dono: string, campos: Record<string, unknown> = {}) => {
  const colunas = ['title', 'owner_id', ...Object.keys(campos)]
  const valores = ['D', dono, ...Object.values(campos)]
  const { rows } = await db.query<{ id: string }>(
    `insert into documents (${colunas.join(', ')}) values (${colunas.map((_, i) => `$${i + 1}`).join(', ')}) returning id`,
    valores,
  )
  return rows[0].id
}
const ids = (rows: { id: string }[]) => rows.map((r) => r.id)

describe('documentos: quem vê', () => {
  it('por padrão a equipe toda vê e edita; cliente não', async () => {
    const db = await criarBanco()
    const { dono, colega, login } = await cenario(db)
    const doc = await criarDoc(db, dono)
    expect(ids(await ler(db, colega, `select id from documents`))).toEqual([doc])
    expect(await executar(db, colega, `update documents set title = 'Novo' where id = $1`, [doc])).toBe(1)
    expect(await ler(db, login, `select id from documents`)).toEqual([])
  })

  it('privado: só o dono (nem admin)', async () => {
    const db = await criarBanco()
    const { dono, colega, admin } = await cenario(db)
    const doc = await criarDoc(db, dono, { visibility: 'private' })
    expect(ids(await ler(db, dono, `select id from documents`))).toEqual([doc])
    expect(await ler(db, colega, `select id from documents`)).toEqual([])
    expect(await ler(db, admin, `select id from documents`)).toEqual([])
  })

  it('pessoas escolhidas: só quem foi adicionado, e só edita se puder editar', async () => {
    const db = await criarBanco()
    const { dono, colega } = await cenario(db)
    const outro = await criarUsuario(db, { role: 'membro' })
    const doc = await criarDoc(db, dono, { visibility: 'people' })
    await db.query(`insert into document_members (document_id, user_id, can_edit) values ($1, $2, false)`, [doc, colega])
    expect(ids(await ler(db, colega, `select id from documents`))).toEqual([doc])
    expect(await ler(db, outro, `select id from documents`)).toEqual([])
    expect(await executar(db, colega, `update documents set title = 'X' where id = $1`, [doc])).toBe(0)
    await db.query(`update document_members set can_edit = true where document_id = $1`, [doc])
    expect(await executar(db, colega, `update documents set title = 'X' where id = $1`, [doc])).toBe(1)
  })

  it('só o dono muda a visibilidade; editor não', async () => {
    const db = await criarBanco()
    const { dono, colega } = await cenario(db)
    const doc = await criarDoc(db, dono)
    await expect(executar(db, colega, `update documents set visibility = 'private' where id = $1`, [doc])).rejects.toThrow(/dono/)
    expect(await executar(db, dono, `update documents set visibility = 'private' where id = $1`, [doc])).toBe(1)
  })

  it('cliente vê só se liberado e só do próprio cliente; não vê arquivado nem as pessoas, comentários e alterações', async () => {
    const db = await criarBanco()
    const { dono, cliente, login, loginOutro } = await cenario(db)
    const fechado = await criarDoc(db, dono, { client_id: cliente })
    const aberto = await criarDoc(db, dono, { client_id: cliente })
    await db.query(`update documents set client_visible = true where id = $1`, [aberto])
    expect(fechado).not.toBe(aberto)
    expect(ids(await ler(db, login, `select id from documents`))).toEqual([aberto])
    expect(await ler(db, loginOutro, `select id from documents`)).toEqual([])
    const pagina = (await db.query<{ id: string }>(`insert into document_pages (document_id, title) values ($1, 'P') returning id`, [aberto])).rows[0].id
    expect(ids(await ler(db, login, `select id from document_pages`))).toEqual([pagina])
    await db.query(`insert into document_updates (page_id, data) values ($1, 'AAAA')`, [pagina])
    expect(await ler(db, login, `select id from document_updates`)).toEqual([])
    await db.query(`update documents set archived_at = now() where id = $1`, [aberto])
    expect(await ler(db, login, `select id from documents`)).toEqual([])
  })

  it('liberar para o cliente exige escolher o cliente', async () => {
    const db = await criarBanco()
    const { dono } = await cenario(db)
    await expect(criarDoc(db, dono, { client_visible: true })).rejects.toThrow()
  })

  it('cliente não cria nem edita', async () => {
    const db = await criarBanco()
    const { dono, cliente, login } = await cenario(db)
    const doc = await criarDoc(db, dono, { client_id: cliente })
    await db.query(`update documents set client_visible = true where id = $1`, [doc])
    await expect(executar(db, login, `insert into documents (title, owner_id) values ('X', $1)`, [login])).rejects.toThrow(/row-level security/)
    expect(await executar(db, login, `update documents set title = 'X' where id = $1`, [doc])).toBe(0)
  })
})

describe('documentos: páginas, listas e favoritos', () => {
  it('página-mãe precisa ser do mesmo documento', async () => {
    const db = await criarBanco()
    const { dono } = await cenario(db)
    const a = await criarDoc(db, dono)
    const b = await criarDoc(db, dono)
    const pa = (await db.query<{ id: string }>(`insert into document_pages (document_id) values ($1) returning id`, [a])).rows[0].id
    await expect(db.query(`insert into document_pages (document_id, parent_id) values ($1, $2)`, [b, pa])).rejects.toThrow(/mesmo documento/)
    await db.query(`insert into document_pages (document_id, parent_id) values ($1, $2)`, [a, pa])
  })

  it('vincula a listas (várias) e desvincular não apaga o documento', async () => {
    const db = await criarBanco()
    const { dono, colega, lista, cliente, espaco } = await cenario(db)
    const outraLista = await criarLista(db, { spaceId: espaco, clientId: cliente })
    const doc = await criarDoc(db, dono)
    expect(await executar(db, colega, `insert into document_lists (document_id, list_id) values ($1, $2)`, [doc, lista])).toBe(1)
    await executar(db, colega, `insert into document_lists (document_id, list_id) values ($1, $2)`, [doc, outraLista])
    expect(await ler(db, dono, `select list_id from document_lists where document_id = '${doc}'`)).toHaveLength(2)
    await executar(db, dono, `delete from document_lists where document_id = $1 and list_id = $2`, [doc, lista])
    expect(ids(await ler(db, dono, `select id from documents`))).toEqual([doc])
  })

  it('favoritos e visualizações são de cada pessoa', async () => {
    const db = await criarBanco()
    const { dono, colega } = await cenario(db)
    const doc = await criarDoc(db, dono)
    await executar(db, dono, `insert into document_favorites (document_id) values ($1)`, [doc])
    expect(await ler(db, colega, `select * from document_favorites`)).toEqual([])
    await expect(executar(db, colega, `insert into document_favorites (user_id, document_id) values ($1, $2)`, [dono, doc])).rejects.toThrow(/row-level security/)
  })

  it('alterações: só edita quem pode editar; limpeza só das antigas (>2 min)', async () => {
    const db = await criarBanco()
    const { dono, colega } = await cenario(db)
    const doc = await criarDoc(db, dono, { visibility: 'people' })
    await db.query(`insert into document_members (document_id, user_id) values ($1, $2)`, [doc, colega])
    const pagina = (await db.query<{ id: string }>(`insert into document_pages (document_id) values ($1) returning id`, [doc])).rows[0].id
    await expect(executar(db, colega, `insert into document_updates (page_id, data) values ($1, 'AAAA')`, [pagina])).rejects.toThrow(/row-level security/)
    await executar(db, dono, `insert into document_updates (page_id, data) values ($1, 'AAAA')`, [pagina])
    expect(await executar(db, dono, `delete from document_updates where page_id = $1`, [pagina])).toBe(0)
    await db.query(`update document_updates set created_at = now() - interval '5 minutes'`)
    expect(await executar(db, dono, `delete from document_updates where page_id = $1`, [pagina])).toBe(1)
  })
})
