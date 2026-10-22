import { describe, expect, it } from 'vitest'
import { criarBanco } from '../ajuda/banco'
import { criarCliente } from '../ajuda/cenario'

describe('link do cliente', () => {
  it('todo cliente ganha um link com o nome e um código, único', async () => {
    const db = await criarBanco()
    const a = await criarCliente(db, 'Padaria São João!')
    const b = await criarCliente(db, 'Padaria São João!')
    const { rows } = await db.query<{ id: string; portal_slug: string }>(`select id, portal_slug from clients where id in ($1, $2)`, [a, b])
    for (const r of rows) expect(r.portal_slug).toMatch(/^padaria-sao-joao-[0-9a-f]{6}$/)
    expect(rows[0].portal_slug).not.toBe(rows[1].portal_slug)
    await expect(db.query(`update clients set portal_slug = $1 where id = $2`, [rows[0].portal_slug, b])).rejects.toThrow()
  })
})
