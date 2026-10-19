import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('financeiro: só o admin', () => {
  it('admin lê e grava; gestor, membro e anônimo não veem nem gravam', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const gestor = await criarUsuario(db, { role: 'gestor' })
    const membro = await criarUsuario(db, { role: 'membro' })
    const insert = `insert into finance_entries (kind, category, amount_cents, occurred_on) values ('saida', 'Equipe', 150000, '2026-10-05')`
    expect(await executar(db, admin, insert)).toBe(1)
    expect(await ler(db, admin, `select id from finance_entries`)).toHaveLength(1)
    for (const u of [gestor, membro, null]) expect(await ler(db, u, `select id from finance_entries`)).toEqual([])
    await expect(executar(db, gestor, insert)).rejects.toThrow(/row-level security/)
    expect(await executar(db, gestor, `delete from finance_entries`)).toBe(0)
  })

  it('valores inválidos são recusados pelo banco', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const base = (kind: string, cents: number) => `insert into finance_entries (kind, category, amount_cents, occurred_on) values ('${kind}', 'X', ${cents}, '2026-10-05')`
    await expect(executar(db, admin, base('saida', 0))).rejects.toThrow()
    await expect(executar(db, admin, base('saida', -5))).rejects.toThrow()
    await expect(executar(db, admin, base('outro', 5))).rejects.toThrow()
  })
})

describe('quadros e funis (canvases)', () => {
  it('a equipe vê e edita; cliente e anônimo não; só o dono (ou admin) exclui', async () => {
    const db = await criarBanco()
    const dono = await criarUsuario(db, { role: 'membro' })
    const colega = await criarUsuario(db, { role: 'membro' })
    const admin = await criarUsuario(db, { role: 'admin' })
    const cliente = await criarUsuario(db, { role: 'cliente' })
    const criado = await ler<{ id: string }>(db, dono, `insert into canvases (kind, title, created_by) values ('quadro', 'Ideias', $1) returning id`, [dono])
    const id = criado[0].id
    expect(await ler(db, colega, `select id from canvases`)).toHaveLength(1)
    expect(await ler(db, cliente, `select id from canvases`)).toEqual([])
    expect(await ler(db, null, `select id from canvases`)).toEqual([])
    expect(await executar(db, colega, `update canvases set data = '{"a":1}' where id = $1`, [id])).toBe(1)
    expect(await executar(db, colega, `delete from canvases where id = $1`, [id])).toBe(0)
    expect(await executar(db, admin, `delete from canvases where id = $1`, [id])).toBe(1)
  })

  it('não cria em nome de outra pessoa nem com tipo ou dados inválidos; updated_at acompanha a edição', async () => {
    const db = await criarBanco()
    const a = await criarUsuario(db, { role: 'membro' })
    const b = await criarUsuario(db, { role: 'membro' })
    await expect(executar(db, a, `insert into canvases (kind, created_by) values ('quadro', $1)`, [b])).rejects.toThrow(/row-level security/)
    await expect(executar(db, a, `insert into canvases (kind, created_by) values ('mural', $1)`, [a])).rejects.toThrow()
    await expect(executar(db, a, `insert into canvases (kind, data, created_by) values ('funil', '[]', $1)`, [a])).rejects.toThrow()
    const [{ id }] = await ler<{ id: string }>(db, a, `insert into canvases (kind, created_by) values ('funil', $1) returning id`, [a])
    await db.query(`update canvases set updated_at = now() - interval '1 day' where id = $1`, [id])
    await executar(db, a, `update canvases set title = 'Novo' where id = $1`, [id])
    const [{ atual }] = await ler<{ atual: boolean }>(db, a, `select updated_at > now() - interval '1 minute' as atual from canvases where id = $1`, [id])
    expect(atual).toBe(true)
  })
})
