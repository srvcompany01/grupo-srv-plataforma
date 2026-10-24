import { describe, expect, it } from 'vitest'
import { criarBanco, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('oauth do MCP', () => {
  it('tabelas fechadas: ninguém logado lê clientes, códigos ou renovações', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    await db.query(`insert into oauth_clients (client_id, redirect_uris) values ('mcp_${'a'.repeat(32)}', array['https://claude.ai/api/mcp/auth_callback'])`)
    for (const t of ['oauth_clients', 'oauth_codes', 'oauth_refresh_tokens']) expect(await ler(db, admin, `select * from ${t}`)).toEqual([])
    await expect(db.query(`insert into oauth_clients (client_id, redirect_uris) values ('qualquer', array['https://x.com'])`)).rejects.toThrow()
  })
})
