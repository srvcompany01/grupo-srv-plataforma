import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('agenda: dia cancelado de um fixo', () => {
  it('quem criou (gestora) grava os dias pulados; outra pessoa da equipe não altera', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'gestor' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const { rows } = await db.query<{ id: string }>(`insert into agenda_events (title, starts_at, ends_at, repeat, created_by, visibility) values ('Reunião', '2026-10-06T17:00:00Z', '2026-10-06T18:00:00Z', 'semanal', $1, 'equipe') returning id`, [ana])
    expect(await ler(db, ana, `select skipped_dates from agenda_events`)).toEqual([{ skipped_dates: [] }])
    await executar(db, ana, `update agenda_events set skipped_dates = '{2026-10-13}' where id = $1`, [rows[0].id])
    expect(await executar(db, bia, `update agenda_events set skipped_dates = '{}' where id = $1`, [rows[0].id])).toBe(0)
    expect((await ler<{ skipped_dates: string[] }>(db, ana, `select skipped_dates::text[] as skipped_dates from agenda_events`))[0].skipped_dates).toEqual(['2026-10-13'])
  })
})
