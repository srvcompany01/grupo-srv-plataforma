import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('comentários das redes', () => {
  it('equipe lê e marca; cliente não vê; aviso do sistema com link', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    const { rows } = await db.query<{ id: string }>(`insert into public.clients (name) values ('X') returning id`)
    await db.query(`insert into public.social_comments (plataforma, id, client_id, post_id, texto, criado_em, tom) values ('instagram', '1', $1, 'p1', 'péssimo', now(), 'negativo')`, [rows[0].id])
    expect((await ler(db, ana, `select id from social_comments`)).length).toBe(1)
    expect(await ler(db, cli, `select id from social_comments`)).toEqual([])
    expect(await executar(db, ana, `update social_comments set resolvido_em = now()`)).toBe(1)
    await expect(executar(db, ana, `insert into social_comments (plataforma, id, client_id, post_id, criado_em) values ('instagram', '2', $1, 'p', now())`, [rows[0].id])).rejects.toThrow(/row-level security/)
    await db.query(`insert into public.notifications (user_id, kind, message, link) values ($1, 'alerta', 'Comentário agressivo', '/insights')`, [ana])
    expect(await ler(db, ana, `select kind, message, link from notifications`)).toEqual([{ kind: 'alerta', message: 'Comentário agressivo', link: '/insights' }])
  })
})
