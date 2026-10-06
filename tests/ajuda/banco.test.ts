import { describe, expect, it } from 'vitest'
import { comoAnonimo, comoUsuario, criarBanco } from './banco'
import { criarUsuario } from './cenario'

describe('banco de testes', () => {
  it('aplica migrações e isola papéis', async () => {
    const db = await criarBanco()
    await db.exec(`create table public.t (id int, dono uuid); alter table public.t enable row level security;
      create policy p on public.t for select to authenticated using (dono = auth.uid());`)
    const a = await criarUsuario(db, { role: 'membro' })
    await db.query('insert into public.t values (1, $1), (2, gen_random_uuid())', [a])
    expect(await comoUsuario(db, a, (tx) => tx.query('select id from public.t').then((r) => r.rows))).toEqual([{ id: 1 }])
    expect(await comoAnonimo(db, (tx) => tx.query('select id from public.t').then((r) => r.rows))).toEqual([])
  })
})
