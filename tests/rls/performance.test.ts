import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('performance', () => {
  it('clique na bio é público e conta por dia; resultados e leads só para a equipe', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    const { rows } = await db.query<{ id: string }>(`insert into public.clients (name, whatsapp, whatsapp_atendimento, bio_slug) values ('Ouro', '5591988887777', '5591999999999', 'ouro') returning id`)
    const id = rows[0].id
    // A função antiga entregava o WhatsApp direto ao anônimo e furava o quiz: foi removida.
    await expect(ler(db, null, `select * from registrar_clique_bio('ouro')`)).rejects.toThrow()
    // Página da bio: dados públicos sem contar; visita por origem; toque por botão (WhatsApp ou link extra).
    await db.query(`insert into bio_links (client_id, rotulo, url, position) values ($1, 'Site', 'https://aurum.com.br', 0)`, [id])
    const pagina = await ler<{ nome: string; whatsapp: string; links: { id: string; rotulo: string }[] }>(db, null, `select nome, whatsapp, links from bio_pagina('ouro')`)
    expect(pagina[0]).toMatchObject({ nome: 'Ouro', whatsapp: '5591999999999', links: [{ rotulo: 'Site' }] })
    expect(await ler(db, null, `select * from bio_pagina('nao-existe')`)).toEqual([])
    await ler(db, null, `select bio_visita('ouro', 'story')`)
    await ler(db, null, `select bio_visita('ouro', 'Inválida!')`)
    expect(await ler(db, ana, `select origem, clicks from bio_clicks order by origem`)).toEqual([{ origem: 'bio', clicks: 1 }, { origem: 'story', clicks: 1 }])
    expect(await ler(db, cli, `select clicks from bio_clicks`)).toEqual([])
    // O toque no WhatsApp só conta: o número não sai daqui (só do quiz concluído, em bio_lead).
    expect(await ler(db, null, `select * from bio_botao('ouro', 'whatsapp', true)`)).toEqual([])
    expect(await ler(db, null, `select * from bio_botao('ouro', $$${pagina[0].links[0].id}$$, true)`)).toEqual([{ url: 'https://aurum.com.br', whatsapp: null, mensagem: null }])
    expect(await ler(db, null, `select * from bio_botao('ouro', 'inexistente', true)`)).toEqual([])
    await ler(db, null, `select * from bio_botao('ouro', 'whatsapp', false)`)
    expect(await ler(db, ana, `select botao, clicks from bio_botao_clicks order by botao`)).toHaveLength(2)
    expect(await ler(db, ana, `select clicks from bio_botao_clicks where botao = 'whatsapp'`)).toEqual([{ clicks: 1 }])
    // O nome do botão fica gravado: depois de removido, o histórico continua legível.
    expect(await ler(db, ana, `select botao, rotulo from bio_botao_clicks order by botao`)).toEqual([{ botao: pagina[0].links[0].id, rotulo: 'Site' }, { botao: 'whatsapp', rotulo: 'WhatsApp' }])
    expect(await ler(db, cli, `select * from bio_botao_clicks`)).toEqual([])
    await expect(executar(db, ana, `insert into bio_links (client_id, rotulo, url) values ($1, 'X', 'https://a.com')`, [id])).rejects.toThrow(/row-level security/)
    // Quiz: perguntas públicas (vazio = padrão do app); lead = quiz concluído, uma vez por pessoa por dia, e só então sai o WhatsApp.
    expect(await ler(db, null, `select bio_quiz_pagina('ouro') as q`)).toEqual([{ q: expect.objectContaining({ perguntas: [], titulo: null }) }])
    await db.query(`insert into bio_perguntas (client_id, position, pergunta, opcoes) values ($1, 0, 'O que procura?', array['Anel', 'Colar'])`, [id])
    expect(await ler(db, null, `select bio_quiz_pagina('ouro') as q`)).toEqual([{ q: expect.objectContaining({ perguntas: [{ pergunta: 'O que procura?', opcoes: ['Anel', 'Colar'] }] }) }])
    await db.query(`update clients set bio_botao_texto = 'Fale conosco', bio_botao_fundo = '#25D366', bio_botao_letra = '#ffffff', bio_quiz_titulo = 'Antes de falar' where id = $1`, [id])
    expect(await ler(db, null, `select bio_quiz_pagina('ouro') as q`)).toEqual([{ q: expect.objectContaining({ titulo: 'Antes de falar', botaoTexto: 'Fale conosco', botaoFundo: '#25D366', botaoLetra: '#ffffff', descricao: null }) }])
    await expect(db.query(`update clients set bio_botao_fundo = 'verde' where id = $1`, [id])).rejects.toThrow()
    const resp = `'[{"p":"O que procura?","o":"Anel"}]'::jsonb`
    expect(await ler(db, null, `select * from bio_lead('ouro', 'story', 'ccccccccccccccccccccccccccccccc1', ${resp})`)).toEqual([{ whatsapp: '5591999999999', mensagem: 'Olá! Vim pelo Instagram 😊' }])
    await ler(db, null, `select * from bio_lead('ouro', 'story', 'ccccccccccccccccccccccccccccccc1', ${resp})`)
    await ler(db, null, `select * from bio_lead('ouro', 'Inválida!', 'ccccccccccccccccccccccccccccccc2', ${resp})`)
    expect(await ler(db, null, `select * from bio_lead('nao-existe', 'bio', 'x', '[]'::jsonb)`)).toEqual([])
    expect(await ler(db, ana, `select origem from bio_leads order by origem`)).toEqual([{ origem: 'bio' }, { origem: 'story' }])
    expect(await ler(db, cli, `select * from bio_leads`)).toEqual([])
    expect(await ler(db, cli, `select * from bio_perguntas`)).toEqual([])
    await expect(executar(db, ana, `insert into bio_perguntas (client_id, pergunta, opcoes) values ($1, 'X', array['a','b'])`, [id])).rejects.toThrow(/row-level security/)
    await expect(db.query(`insert into bio_perguntas (client_id, pergunta, opcoes) values ($1, 'X', array['a'])`, [id])).rejects.toThrow()
    // Visualização (a página abriu): conta toda vez; pessoa distinta = hash diário, uma vez por dia.
    await ler(db, null, `select bio_visualizacao('ouro', 'story', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')`)
    await ler(db, null, `select bio_visualizacao('ouro', 'story', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')`)
    await ler(db, null, `select bio_visualizacao('ouro', 'story', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')`)
    await ler(db, null, `select bio_visualizacao('nao-existe', 'bio', 'cccccccccccccccccccccccccccccccc')`)
    expect(await ler(db, ana, `select origem, views, visitantes from bio_visualizacoes`)).toEqual([{ origem: 'story', views: 3, visitantes: 2 }])
    expect(await ler(db, cli, `select * from bio_visualizacoes`)).toEqual([])
    await expect(ler(db, ana, `select * from bio_visitantes`)).resolves.toEqual([])
    await executar(db, ana, `insert into lead_confirmations (client_id, observacao) values ($1, 'Maria')`, [id])
    await executar(db, ana, `insert into client_monthly_results (client_id, month, revenue, sales) values ($1, '2026-10-01', 50000, 12)`, [id])
    expect(await ler(db, cli, `select * from client_monthly_results`)).toEqual([])
    await expect(executar(db, ana, `insert into client_monthly_results (client_id, month) values ($1, '2026-10-15')`, [id])).rejects.toThrow()
    await expect(executar(db, cli, `insert into lead_confirmations (client_id) values ($1)`, [id])).rejects.toThrow(/row-level security/)
  })
})
