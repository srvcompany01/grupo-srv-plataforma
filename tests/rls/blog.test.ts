import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('blog', () => {
  it('visitante só vê o publicado (agendado e rascunho ficam escondidos); equipe vê tudo', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    await executar(db, ana, `insert into blog_posts (slug, title, status, published_at) values
      ('no-ar', 'No ar', 'publicado', now() - interval '1 day'),
      ('agendado', 'Agendado', 'publicado', now() + interval '1 day'),
      ('rascunho', 'Rascunho', 'rascunho', null)`)
    expect(await ler(db, null, `select slug from blog_posts`)).toEqual([{ slug: 'no-ar' }])
    expect((await ler(db, ana, `select slug from blog_posts`)).length).toBe(3)
    expect((await ler(db, null, `select slug from blog_categories`)).length).toBe(4)
    // visita conta só no publicado
    await ler(db, null, `select blog_contar_visita('no-ar')`)
    await ler(db, null, `select blog_contar_visita('agendado')`)
    expect(await ler(db, ana, `select slug, views from blog_posts where views > 0`)).toEqual([{ slug: 'no-ar', views: 1 }])
  })

  it('cliente e visitante não escrevem; inscritos só a equipe lê', async () => {
    const db = await criarBanco()
    const cli = await criarUsuario(db, { role: 'cliente' })
    const ana = await criarUsuario(db, { role: 'membro' })
    await expect(executar(db, cli, `insert into blog_posts (slug, title) values ('x', 'X')`)).rejects.toThrow(/row-level security/)
    await db.query(`insert into public.blog_subscribers (email) values ('a@b.com')`)
    expect(await ler(db, cli, `select email from blog_subscribers`)).toEqual([])
    expect(await ler(db, null, `select email from blog_subscribers`).catch(() => [])).toEqual([])
    expect(await ler(db, ana, `select email from blog_subscribers`)).toEqual([{ email: 'a@b.com' }])
    await expect(executar(db, ana, `insert into blog_posts (slug, title, status) values ('sem-data', 'X', 'publicado')`)).rejects.toThrow()
  })
})
