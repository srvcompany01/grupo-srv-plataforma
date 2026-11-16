import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler } from '../ajuda/banco'
import { criarCliente, criarUsuario } from '../ajuda/cenario'

describe('caixa de entrada e ficha de conteúdo', () => {
  it('a equipe grava e lê; cliente do portal não acessa', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    const cliente = await criarCliente(db, 'Aurum')
    await comoUsuario(db, ana, (tx) => tx.query(`insert into content_inbox (client_id, name, source, r2_key, mime) values ($1, 'a.mp4', 'upload', 'caixa/x/a.mp4', 'video/mp4')`, [cliente]))
    await comoUsuario(db, ana, (tx) => tx.query(`insert into client_content_profiles (client_id, hashtags) values ($1, '#aurum')`, [cliente]))
    expect(await ler(db, ana, `select name, status, kind from content_inbox`)).toEqual([{ name: 'a.mp4', status: 'aguardando_envio', kind: 'indefinido' }])
    expect(await ler(db, cli, `select name from content_inbox`)).toEqual([])
    expect(await ler(db, cli, `select hashtags from client_content_profiles`)).toEqual([])
  })

  it('o mesmo arquivo do Drive não entra duas vezes (exceto se a tentativa anterior falhou)', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const cliente = await criarCliente(db, 'Aurum')
    const inserir = (status: string) => comoUsuario(db, ana, (tx) => tx.query(`insert into content_inbox (client_id, name, source, drive_file_id, r2_key, mime, status) values ($1, 'v.mp4', 'drive', 'ARQ1', 'caixa/x/' || gen_random_uuid() || '.mp4', 'video/mp4', $2)`, [cliente, status]))
    await inserir('erro')
    await inserir('importando')
    await expect(inserir('pronto')).rejects.toThrow(/duplicate|unique/)
  })

  it('rejeita tipo de arquivo, origem e status inválidos', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const cliente = await criarCliente(db, 'Aurum')
    const ins = (mime: string, source: string, status: string) => comoUsuario(db, ana, (tx) => tx.query(`insert into content_inbox (client_id, name, source, r2_key, mime, status) values ($1, 'x', $2, 'k', $3, $4)`, [cliente, source, mime, status]))
    await expect(ins('application/pdf', 'upload', 'pronto')).rejects.toThrow(/check/)
    await expect(ins('video/mp4', 'email', 'pronto')).rejects.toThrow(/check/)
    await expect(ins('video/mp4', 'upload', 'lixo')).rejects.toThrow(/check/)
  })
})
