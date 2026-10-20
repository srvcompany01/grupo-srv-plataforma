import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

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
