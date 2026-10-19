import { expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

it('leads das landing pages: gestor e admin leem; membro e anônimo não; ninguém grava pela API do usuário', async () => {
  const db = await criarBanco()
  const admin = await criarUsuario(db, { role: 'admin' })
  const gestor = await criarUsuario(db, { role: 'gestor' })
  const membro = await criarUsuario(db, { role: 'membro' })
  await db.query(`insert into landing_leads (id, landing, payload) values ('11111111-1111-4111-8111-111111111111', 'x', '{"a":1}')`)
  expect(await ler(db, admin, `select id from landing_leads`)).toHaveLength(1)
  expect(await ler(db, gestor, `select id from landing_leads`)).toHaveLength(1)
  expect(await ler(db, membro, `select id from landing_leads`)).toEqual([])
  expect(await ler(db, null, `select id from landing_leads`)).toEqual([])
  await expect(executar(db, admin, `insert into landing_leads (id, landing, payload) values ('22222222-2222-4222-8222-222222222222', 'x', '{}')`)).rejects.toThrow(/row-level security/)
})
