import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('google da agência', () => {
  it('ninguém lê nem grava o token pela API (nem o admin)', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    await db.query(`insert into public.google_agency_link (refresh_token) values ('segredo')`)
    expect(await ler(db, admin, `select * from google_agency_link`)).toEqual([])
    expect(await executar(db, admin, `update google_agency_link set email = 'x'`)).toBe(0)
  })
  it('post pode ir para o Google; conta do Google Ads com 10 dígitos', async () => {
    const db = await criarBanco()
    await expect(db.query(`insert into public.clients (name, google_ads_customer_id) values ('X', '123')`)).rejects.toThrow()
    await db.query(`insert into public.clients (name, google_ads_customer_id, google_location) values ('Y', '1234567890', 'accounts/1/locations/2')`)
  })
})
