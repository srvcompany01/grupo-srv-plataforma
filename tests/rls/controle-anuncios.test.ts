import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('controle de anúncios', () => {
  it('equipe propõe e registra; só admin ou gestor decide a proposta; cliente não vê nada', async () => {
    const db = await criarBanco()
    const membro = await criarUsuario(db, { role: 'membro' })
    const gestor = await criarUsuario(db, { role: 'gestor' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    const { rows } = await db.query<{ id: string }>(`insert into public.clients (name) values ('Ouro') returning id`)
    const id = rows[0].id
    await executar(db, membro, `insert into ad_proposals (client_id, plataforma, nivel, objeto_id, acao, valor_novo) values ($1, 'meta', 'conjunto', '123', 'orcamento', 60)`, [id])
    await expect(executar(db, membro, `insert into ad_proposals (client_id, plataforma, nivel, objeto_id, acao) values ($1, 'meta', 'conjunto', '123', 'orcamento')`, [id])).rejects.toThrow()
    await expect(executar(db, membro, `insert into ad_proposals (client_id, plataforma, nivel, objeto_id, acao, status) values ($1, 'meta', 'campanha', '1', 'ativar', 'aprovada')`, [id])).rejects.toThrow(/row-level security/)
    expect(await ler(db, membro, `update ad_proposals set status = 'aprovada' returning id`)).toEqual([])
    expect(await ler(db, gestor, `update ad_proposals set status = 'aprovada' returning status`)).toEqual([{ status: 'aprovada' }])
    await executar(db, membro, `insert into ad_changes (client_id, plataforma, nivel, objeto_id, acao) values ($1, 'google', 'campanha', '9', 'pausar')`, [id])
    await executar(db, membro, `insert into ad_creatives (client_id, nome, tipo, chave, mime, tamanho) values ($1, 'Criativo', 'imagem', 'criativos/x.jpg', 'image/jpeg', 10)`, [id])
    for (const t of ['ad_changes', 'ad_proposals', 'ad_creatives']) expect(await ler(db, cli, `select 1 from ${t}`)).toEqual([])
  })
})
