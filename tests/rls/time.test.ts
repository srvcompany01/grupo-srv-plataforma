import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('time: presença, status e minutos ativos', () => {
  it('conta um minuto ativo por vez (sem dobrar), e só a própria pessoa', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    await ler(db, ana, `select registrar_presenca(true)`)
    await ler(db, ana, `select registrar_presenca(true)`) // segunda aba no mesmo minuto: não conta
    await ler(db, ana, `select registrar_presenca(false)`)
    const gestor = await criarUsuario(db, { role: 'gestor' })
    expect(await ler(db, gestor, `select active_minutes from team_activity where user_id = $1`, [ana])).toEqual([{ active_minutes: 1 }])
    expect(await ler(db, ana, `select active_minutes from team_activity`)).toEqual([{ active_minutes: 1 }])
    expect(await ler(db, bia, `select active_minutes from team_activity`)).toEqual([]) // membro não vê o tempo dos outros
    expect((await ler<{ n: number }>(db, bia, `select count(*)::int as n from team_presence where last_seen_at is not null`))[0].n).toBe(1)
    // ninguém grava direto nas tabelas
    expect(await executar(db, bia, `update team_activity set active_minutes = 999`)).toBe(0)
    await expect(executar(db, bia, `insert into team_presence (user_id) values ($1)`, [bia])).rejects.toThrow(/row-level security/)
  })

  it('status escolhido e volta a disponível depois do prazo; cliente não vê', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    await ler(db, ana, `select definir_status('intervalo', 'almoço', now() - interval '1 minute')`)
    expect(await ler(db, ana, `select status, status_text from team_presence`)).toEqual([{ status: 'intervalo', status_text: 'almoço' }])
    await ler(db, ana, `select registrar_presenca(true)`)
    expect(await ler(db, ana, `select status from team_presence`)).toEqual([{ status: 'disponivel' }])
    await expect(ler(db, ana, `select definir_status('dormindo', '', null)`)).rejects.toThrow()
    const cli = await criarUsuario(db, { role: 'cliente' })
    expect(await ler(db, cli, `select * from team_presence`)).toEqual([])
  })
})
