import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarCliente, criarUsuario } from '../ajuda/cenario'

describe('GMN', () => {
  it('equipe grava varredura e cache; cliente não vê; place id e grade validados', async () => {
    const db = await criarBanco()
    const membro = await criarUsuario(db, { role: 'membro' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    const c = await criarCliente(db, 'Aurum')
    await executar(db, membro, `update clients set google_place_id = 'ChIJN1t_tDeuEmsRUsoyG83frY4' where id = $1`, [c])
    await expect(db.query(`update clients set google_place_id = 'tem espaço' where id = $1`, [c])).rejects.toThrow()
    await executar(db, membro, `insert into google_places (id, nome, nota, avaliacoes) values ('ChIJN1t_tDeuEmsRUsoyG83frY4', 'Aurum', 4.8, 120)`)
    await executar(db, membro, `insert into gmn_scans (client_id, palavra, grade, raio_km, centro_lat, centro_lng, pontos) values ($1, 'joalheria', 5, 3, -1.45, -48.49, '[]')`, [c])
    await expect(executar(db, membro, `insert into gmn_scans (client_id, palavra, grade, raio_km, centro_lat, centro_lng, pontos) values ($1, 'joalheria', 4, 3, -1.45, -48.49, '[]')`, [c])).rejects.toThrow()
    for (const t of ['google_places', 'gmn_scans', 'gmn_snapshots']) expect(await ler(db, cli, `select 1 from ${t}`)).toEqual([])
    await expect(executar(db, membro, `insert into gmn_snapshots (client_id, dia, nota, avaliacoes) values ($1, '2026-10-24', 4.8, 120)`, [c])).rejects.toThrow(/row-level security/)
  })
})

describe('GMN: acompanhamento semanal', () => {
  it('equipe liga e desliga; uma linha por palavra; cliente não vê', async () => {
    const db = await criarBanco()
    const membro = await criarUsuario(db, { role: 'membro' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    const c = await criarCliente(db, 'Aurum')
    await executar(db, membro, `insert into gmn_monitors (client_id, palavra, grade, raio_km) values ($1, 'compro ouro', 5, 3)`, [c])
    await expect(executar(db, membro, `insert into gmn_monitors (client_id, palavra, grade, raio_km) values ($1, 'compro ouro', 9, 3)`, [c])).rejects.toThrow()
    expect(await ler(db, cli, `select 1 from gmn_monitors`)).toEqual([])
    await executar(db, membro, `delete from gmn_monitors where client_id = $1`, [c])
    expect(await ler(db, membro, `select 1 from gmn_monitors`)).toEqual([])
  })
})
