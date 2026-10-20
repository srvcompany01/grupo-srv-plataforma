import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarCliente, criarUsuario } from '../ajuda/cenario'

const NOVO = `insert into agenda_events (title, starts_at, ends_at, visibility) values ($1, '2026-10-20 10:00-03', '2026-10-20 11:00-03', $2) returning id`

describe('agenda', () => {
  it('privado só para quem criou, equipe para todos, selecionados para quem foi escolhido', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const [privado] = await ler<{ id: string }>(db, ana, NOVO, ['Dentista', 'privado'])
    await ler(db, admin, NOVO, ['Reunião geral', 'equipe'])
    const [sel] = await ler<{ id: string }>(db, admin, NOVO, ['Gravação', 'selecionados'])
    expect(await executar(db, admin, `insert into agenda_event_people (event_id, user_id) values ($1, $2)`, [sel.id, bia])).toBe(1)

    const titulos = async (u: string) => (await ler<{ title: string }>(db, u, `select title from agenda_events order by title`)).map((e) => e.title)
    expect(await titulos(ana)).toEqual(['Dentista', 'Reunião geral'])
    expect(await titulos(bia)).toEqual(['Gravação', 'Reunião geral'])
    expect(await titulos(admin)).toEqual(['Gravação', 'Reunião geral'])
    // ninguém além da dona mexe no privado
    expect(await executar(db, bia, `delete from agenda_events where id = $1`, [privado.id])).toBe(0)
    // a escolhida vê mas não edita nem se tira da lista
    expect(await executar(db, bia, `update agenda_events set title = 'x' where id = $1`, [sel.id])).toBe(0)
    expect(await executar(db, bia, `delete from agenda_event_people where event_id = $1`, [sel.id])).toBe(0)
  })

  it('tags da equipe e cliente no compromisso', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const cliente = await criarCliente(db, 'Padaria')
    const [tag] = await ler<{ id: string }>(db, ana, `insert into agenda_tags (name, color) values ('Gravação', '#ef4444') returning id`)
    await expect(ler(db, bia, `insert into agenda_tags (name) values (' gravação ')`)).rejects.toThrow() // nome repetido
    expect(await ler(db, bia, `select name from agenda_tags`)).toEqual([{ name: 'Gravação' }])
    expect(await executar(db, bia, `delete from agenda_tags where id = $1`, [tag.id])).toBe(0)

    const [ev] = await ler<{ id: string }>(db, ana, NOVO, ['Dentista', 'privado'])
    expect(await executar(db, ana, `update agenda_events set client_id = $2 where id = $1`, [ev.id, cliente])).toBe(1)
    expect(await executar(db, ana, `insert into agenda_event_tags (event_id, tag_id) values ($1, $2)`, [ev.id, tag.id])).toBe(1)
    // quem não vê o compromisso não vê nem coloca tag nele
    expect(await ler(db, bia, `select * from agenda_event_tags`)).toEqual([])
    await expect(executar(db, bia, `insert into agenda_event_tags (event_id, tag_id) values ($1, $2)`, [ev.id, tag.id])).rejects.toThrow(/row-level security/)
    // apagar a tag tira dos compromissos
    expect(await executar(db, admin, `delete from agenda_tags where id = $1`, [tag.id])).toBe(1)
    expect(await ler(db, ana, `select * from agenda_event_tags`)).toEqual([])
  })

  it('categorias: equipe vê, quem criou apaga, compromisso fica sem categoria', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const [cat] = await ler<{ id: string }>(db, ana, `insert into agenda_categories (name, color) values ('Reuniões', '#3b82f6') returning id`)
    expect(await ler(db, bia, `select name from agenda_categories`)).toEqual([{ name: 'Reuniões' }])
    const [ev] = await ler<{ id: string }>(db, ana, NOVO, ['Pauta', 'privado'])
    expect(await executar(db, ana, `update agenda_events set category_id = $2 where id = $1`, [ev.id, cat.id])).toBe(1)
    expect(await executar(db, bia, `delete from agenda_categories where id = $1`, [cat.id])).toBe(0)
    expect(await executar(db, ana, `delete from agenda_categories where id = $1`, [cat.id])).toBe(1)
    expect(await ler(db, ana, `select category_id from agenda_events`)).toEqual([{ category_id: null }])
  })

  it('membro só cria compromisso privado; vínculo com o Google fica fechado', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const gestor = await criarUsuario(db, { role: 'gestor' })
    await expect(ler(db, ana, NOVO, ['Para todos', 'equipe'])).rejects.toThrow(/row-level security/)
    expect(await ler(db, gestor, NOVO, ['Para todos', 'equipe'])).toHaveLength(1)
    const cliente = await criarUsuario(db, { role: 'cliente' })
    expect(await ler(db, cliente, `select * from agenda_events`)).toEqual([])
    expect(await ler(db, ana, `select * from google_calendar_links`)).toEqual([])
  })
})
