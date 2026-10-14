import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

const HASH = 'a'.repeat(64)
const inserir = (tx: { query: (sql: string, p?: unknown[]) => Promise<unknown> }, userId: string, hash = HASH, dias = 30) =>
  tx.query(`insert into api_tokens (user_id, name, token_hash, scope, expires_at) values ($1, 'Codex', $2, 'write', now() + make_interval(days => $3))`, [userId, hash, dias])

describe('tokens da API', () => {
  it('a pessoa cria, lê e revoga só o próprio token', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    await comoUsuario(db, ana, (tx) => inserir(tx, ana))
    expect(await ler(db, ana, `select name, scope from api_tokens`)).toEqual([{ name: 'Codex', scope: 'write' }])
    expect(await ler(db, bia, `select 1 from api_tokens`)).toEqual([])
    await comoUsuario(db, bia, (tx) => tx.query(`update api_tokens set revoked_at = now()`))
    expect((await db.query(`select revoked_at from api_tokens`)).rows).toEqual([{ revoked_at: null }])
    await comoUsuario(db, ana, (tx) => tx.query(`update api_tokens set revoked_at = now()`))
    expect((await db.query<{ r: boolean }>(`select revoked_at is not null as r from api_tokens`)).rows).toEqual([{ r: true }])
  })

  it('não cria token em nome de outra pessoa, para cliente, nem com validade longa demais', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    await expect(comoUsuario(db, ana, (tx) => inserir(tx, bia))).rejects.toThrow(/row-level security/)
    await expect(comoUsuario(db, cli, (tx) => inserir(tx, cli))).rejects.toThrow(/row-level security/)
    await expect(comoUsuario(db, ana, (tx) => inserir(tx, ana, HASH, 400))).rejects.toThrow(/row-level security/)
  })

  it('o dono não consegue trocar hash, escopo ou validade', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    await comoUsuario(db, ana, (tx) => inserir(tx, ana))
    await expect(comoUsuario(db, ana, (tx) => tx.query(`update api_tokens set scope = 'read'`))).rejects.toThrow(/revogar/)
    await expect(comoUsuario(db, ana, (tx) => tx.query(`update api_tokens set expires_at = now() + interval '300 days'`))).rejects.toThrow(/revogar/)
  })
})
