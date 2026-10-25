import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('performance', () => {
  it('clique na bio é público e conta por dia; resultados e leads só para a equipe', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    const { rows } = await db.query<{ id: string }>(`insert into public.clients (name, whatsapp, bio_slug) values ('Ouro', '5591999999999', 'ouro') returning id`)
    const id = rows[0].id
    expect(await ler(db, null, `select * from registrar_clique_bio('ouro')`)).toEqual([{ whatsapp: '5591999999999', mensagem: 'Olá! Vim pelo Instagram 😊' }])
    await ler(db, null, `select * from registrar_clique_bio('ouro')`)
    expect(await ler(db, null, `select * from registrar_clique_bio('nao-existe')`)).toEqual([])
    expect(await ler(db, ana, `select clicks from bio_clicks`)).toEqual([{ clicks: 2 }])
    expect(await ler(db, cli, `select clicks from bio_clicks`)).toEqual([])
    // Página da bio: dados públicos sem contar; visita por origem; toque por botão (WhatsApp ou link extra).
    await db.query(`insert into bio_links (client_id, rotulo, url, position) values ($1, 'Site', 'https://aurum.com.br', 0)`, [id])
    const pagina = await ler<{ nome: string; whatsapp: string; links: { id: string; rotulo: string }[] }>(db, null, `select nome, whatsapp, links from bio_pagina('ouro')`)
    expect(pagina[0]).toMatchObject({ nome: 'Ouro', whatsapp: '5591999999999', links: [{ rotulo: 'Site' }] })
    expect(await ler(db, null, `select * from bio_pagina('nao-existe')`)).toEqual([])
    await ler(db, null, `select bio_visita('ouro', 'story')`)
    await ler(db, null, `select bio_visita('ouro', 'Inválida!')`)
    expect(await ler(db, ana, `select origem, clicks from bio_clicks order by origem`)).toEqual([{ origem: 'bio', clicks: 3 }, { origem: 'story', clicks: 1 }])
    expect(await ler(db, null, `select * from bio_botao('ouro', 'whatsapp', true)`)).toEqual([{ url: null, whatsapp: '5591999999999', mensagem: 'Olá! Vim pelo Instagram 😊' }])
    expect(await ler(db, null, `select * from bio_botao('ouro', $$${pagina[0].links[0].id}$$, true)`)).toEqual([{ url: 'https://aurum.com.br', whatsapp: null, mensagem: null }])
    expect(await ler(db, null, `select * from bio_botao('ouro', 'inexistente', true)`)).toEqual([])
    await ler(db, null, `select * from bio_botao('ouro', 'whatsapp', false)`)
    expect(await ler(db, ana, `select botao, clicks from bio_botao_clicks order by botao`)).toHaveLength(2)
    expect(await ler(db, ana, `select clicks from bio_botao_clicks where botao = 'whatsapp'`)).toEqual([{ clicks: 1 }])
    expect(await ler(db, cli, `select * from bio_botao_clicks`)).toEqual([])
    await expect(executar(db, ana, `insert into bio_links (client_id, rotulo, url) values ($1, 'X', 'https://a.com')`, [id])).rejects.toThrow(/row-level security/)
    await executar(db, ana, `insert into lead_confirmations (client_id, observacao) values ($1, 'Maria')`, [id])
    await executar(db, ana, `insert into client_monthly_results (client_id, month, revenue, sales) values ($1, '2026-10-01', 50000, 12)`, [id])
    expect(await ler(db, cli, `select * from client_monthly_results`)).toEqual([])
    await expect(executar(db, ana, `insert into client_monthly_results (client_id, month) values ($1, '2026-10-15')`, [id])).rejects.toThrow()
    await expect(executar(db, cli, `insert into lead_confirmations (client_id) values ($1)`, [id])).rejects.toThrow(/row-level security/)
  })
})
