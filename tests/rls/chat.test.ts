import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

const CANAL = `insert into chat_channels (name, is_private) values ($1, $2) returning id`
const MSG = `insert into chat_messages (channel_id, body, parent_id) values ($1, $2, $3) returning id`

describe('chat da equipe', () => {
  it('canal público para a equipe toda, privado só para membros; cliente não entra', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    const [geral] = await ler<{ id: string }>(db, ana, `select id from chat_channels where name = 'geral'`)
    expect(await ler(db, ana, MSG, [geral.id, 'Bom dia', null])).toHaveLength(1)
    expect(await ler(db, bia, `select body from chat_messages`)).toEqual([{ body: 'Bom dia' }])
    expect(await ler(db, cli, `select * from chat_messages`)).toEqual([])

    const [priv] = await ler<{ id: string }>(db, ana, CANAL, ['diretoria', true])
    await ler(db, ana, MSG, [priv.id, 'segredo', null])
    expect(await ler(db, bia, `select body from chat_messages where channel_id = $1`, [priv.id])).toEqual([])
    await expect(ler(db, bia, MSG, [priv.id, 'oi', null])).rejects.toThrow(/row-level security/)
    expect(await executar(db, ana, `insert into chat_members (channel_id, user_id) values ($1, $2)`, [priv.id, bia])).toBe(1)
    expect(await ler(db, bia, `select body from chat_messages where channel_id = $1`, [priv.id])).toEqual([{ body: 'segredo' }])
    // nome repetido entre canais ativos é recusado
    await expect(ler(db, bia, CANAL, ['geral', false])).rejects.toThrow()
  })

  it('tópico, edição só do autor, menção vira aviso e não lidas por canal', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const [geral] = await ler<{ id: string }>(db, ana, `select id from chat_channels where name = 'geral'`)
    const [m] = await ler<{ id: string }>(db, ana, MSG, [geral.id, 'Pauta de hoje', null])
    const [resp] = await ler<{ id: string }>(db, bia, MSG, [geral.id, 'Fechado', m.id])
    await expect(ler(db, ana, MSG, [geral.id, 'resposta da resposta', resp.id])).rejects.toThrow(/Resposta inválida/)
    expect(await executar(db, bia, `update chat_messages set body = 'x' where id = $1`, [m.id])).toBe(0)
    expect(await executar(db, ana, `update chat_messages set body = 'Pauta de hoje (atualizada)' where id = $1`, [m.id])).toBe(1)

    expect(await executar(db, ana, `insert into chat_mentions (message_id, user_id) values ($1, $2)`, [m.id, bia])).toBe(1)
    expect(await ler(db, bia, `select kind, chat_message_id from notifications`)).toEqual([{ kind: 'chat_mention', chat_message_id: m.id }])

    expect(await ler(db, ana, `select nao_lidas::int from chat_nao_lidas()`)).toEqual([{ nao_lidas: 1 }]) // a resposta da Bia
    await executar(db, ana, `select marcar_chat_lido($1)`, [geral.id])
    expect(await ler(db, ana, `select * from chat_nao_lidas()`)).toEqual([])
  })

  it('anexo só na pasta do canal e na mensagem do próprio autor', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const [geral] = await ler<{ id: string }>(db, ana, `select id from chat_channels where name = 'geral'`)
    const [m] = await ler<{ id: string }>(db, ana, MSG, [geral.id, '', null])
    const ANEXO = `insert into chat_attachments (message_id, channel_id, r2_key, file_name, mime_type, size_bytes) values ($1, $2, $3, 'a.png', 'image/png', 10)`
    expect(await executar(db, ana, ANEXO, [m.id, geral.id, `chat/${geral.id}/0b8c1f7e-3a2d-4c1b-9e0f-1234567890ab.png`])).toBe(1)
    await expect(executar(db, ana, ANEXO, [m.id, geral.id, `tarefas/x/y.png`])).rejects.toThrow()
    await expect(executar(db, bia, ANEXO, [m.id, geral.id, `chat/${geral.id}/1b8c1f7e-3a2d-4c1b-9e0f-1234567890ab.png`])).rejects.toThrow(/row-level security/)
  })
})
