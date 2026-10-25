import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarCliente, criarUsuario } from '../ajuda/cenario'

describe('relatórios para o cliente', () => {
  it('equipe gera e lê; cliente e anônimo não leem pela tabela (a página pública usa a chave mestra pelo token)', async () => {
    const db = await criarBanco()
    const membro = await criarUsuario(db, { role: 'membro' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    const c = await criarCliente(db, 'Aurum')
    const token = 'a'.repeat(32)
    await executar(db, membro, `insert into client_reports (token, client_id, de, ate, dados) values ($1, $2, '2026-10-01', '2026-10-31', '{}')`, [token, c])
    await expect(executar(db, membro, `insert into client_reports (token, client_id, de, ate, dados) values ('curto', $1, '2026-10-01', '2026-10-31', '{}')`, [c])).rejects.toThrow()
    await expect(executar(db, membro, `insert into client_reports (token, client_id, de, ate, dados) values ($1, $2, '2026-10-31', '2026-10-01', '{}')`, ['b'.repeat(32), c])).rejects.toThrow()
    expect(await ler(db, membro, `select token from client_reports`)).toEqual([{ token }])
    expect(await ler(db, cli, `select 1 from client_reports`)).toEqual([])
    expect(await ler(db, null, `select 1 from client_reports`)).toEqual([])
  })
})
