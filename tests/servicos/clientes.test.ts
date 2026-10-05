import { beforeEach, describe, expect, it } from 'vitest'
import { criarDbTeste } from '../ajuda/db'
import type { Db } from '@/db/conexao'
import { posts } from '@/db/schema'
import {
  buscarCliente,
  buscarClientePorToken,
  criarCliente,
  definirAtivo,
  listarClientes,
  regenerarToken,
} from '@/servicos/clientes'
import { ErroRegra } from '@/dominio/erros'

let db: Db
beforeEach(async () => {
  db = await criarDbTeste()
})

describe('clientes', () => {
  it('cria cliente ativo com token de 32 caracteres e nome aparado', async () => {
    const c = await criarCliente(db, '  Aurum Belém ')
    expect(c.nome).toBe('Aurum Belém')
    expect(c.token).toMatch(/^[A-Za-z0-9]{32}$/)
    expect(c.ativo).toBe(true)
  })

  it('recusa nome vazio', async () => {
    await expect(criarCliente(db, '  ')).rejects.toMatchObject({ codigo: 'nome_obrigatorio' })
  })

  it('encontra pelo token exato e mais nada', async () => {
    const c = await criarCliente(db, 'A')
    expect((await buscarClientePorToken(db, c.token))?.id).toBe(c.id)
    expect(await buscarClientePorToken(db, c.token + 'x')).toBeNull()
    const trocado = c.token === c.token.toUpperCase() ? c.token.toLowerCase() : c.token.toUpperCase()
    expect(await buscarClientePorToken(db, trocado)).toBeNull()
    expect(await buscarClientePorToken(db, '')).toBeNull()
  })

  it('cliente inativo não é encontrado pelo token', async () => {
    const c = await criarCliente(db, 'A')
    await definirAtivo(db, c.id, false)
    expect(await buscarClientePorToken(db, c.token)).toBeNull()
    await definirAtivo(db, c.id, true)
    expect(await buscarClientePorToken(db, c.token)).not.toBeNull()
  })

  it('regenerar token invalida o antigo', async () => {
    const c = await criarCliente(db, 'A')
    const novo = await regenerarToken(db, c.id)
    expect(novo).not.toBe(c.token)
    expect(await buscarClientePorToken(db, c.token)).toBeNull()
    expect((await buscarClientePorToken(db, novo))?.id).toBe(c.id)
  })

  it('buscarCliente lança nao_encontrado', async () => {
    const e = await buscarCliente(db, '00000000-0000-0000-0000-000000000000').catch((x) => x)
    expect(e).toBeInstanceOf(ErroRegra)
    expect(e.codigo).toBe('nao_encontrado')
  })

  it('lista por nome contando só posts aguardando', async () => {
    const b = await criarCliente(db, 'Beta')
    const a = await criarCliente(db, 'Alfa')
    const base = { clienteId: b.id, dataPrevista: '2026-10-07', formato: 'feed' as const }
    await db.insert(posts).values([
      { ...base, status: 'aguardando' },
      { ...base, status: 'aguardando' },
      { ...base, status: 'rascunho' },
      { ...base, status: 'aprovado' },
    ])
    const lista = await listarClientes(db)
    expect(lista.map((c) => [c.nome, c.pendentes])).toEqual([
      ['Alfa', 0],
      ['Beta', 2],
    ])
    expect(lista[0].id).toBe(a.id)
  })
})

it('buscarCliente com id malformado lança nao_encontrado, não erro do banco', async () => {
  const db = await criarDbTeste()
  await expect(buscarCliente(db, 'nao-e-uuid')).rejects.toMatchObject({ codigo: 'nao_encontrado' })
})
