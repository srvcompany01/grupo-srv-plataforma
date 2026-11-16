import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarTarefa, criarUsuario, idEspaco, vincularUsuarioCliente } from '../ajuda/cenario'

async function base(db: Banco) {
  const espaco = await idEspaco(db, 'Conteúdo')
  const aurora = await criarCliente(db, 'Aurora')
  const lista = await criarLista(db, { spaceId: espaco, clientId: aurora })
  const ana = await criarUsuario(db, { role: 'membro' })
  const bruno = await criarUsuario(db, { role: 'membro' })
  const gil = await criarUsuario(db, { role: 'gestor' })
  const admin = await criarUsuario(db, { role: 'admin' })
  const cli = await criarUsuario(db, { role: 'cliente' })
  const inativo = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, espaco, ana, 'membro')
  await adicionarMembro(db, espaco, bruno, 'membro')
  await adicionarMembro(db, espaco, inativo, 'membro')
  await adicionarMembro(db, espaco, gil, 'gestor')
  await vincularUsuarioCliente(db, cli, aurora)
  const tarefa = await criarTarefa(db, { listId: lista, responsaveis: [ana, bruno, inativo], titulo: 'Roteiro' })
  // Registros de cada um pelo caminho de verdade (RPC), para o histórico "time_logged" nascer junto.
  const lancar = (u: string, min: number, nota: string) => comoUsuario(db, u, (tx) => tx.query(`select lancar_tempo($1, '2026-11-10', $2, $3)`, [tarefa, min, nota]))
  await lancar(ana, 60, 'da Ana')
  await lancar(bruno, 30, 'do Bruno')
  await lancar(inativo, 10, 'do inativo')
  await db.query(`update profiles set active = false where id = $1`, [inativo])
  return { espaco, aurora, lista, ana, bruno, gil, admin, cli, inativo, tarefa }
}

const notas = (db: Banco, u: string) => ler<{ note: string }>(db, u, `select note from time_entries order by note`).then((r) => r.map((x) => x.note))
const embutido = (db: Banco, u: string) =>
  comoUsuario(db, u, (tx) => tx.query<{ soma: string | null }>(`select (select coalesce(sum(duration_seconds), 0) from time_entries where task_id = t.id)::text as soma from tasks t`).then((r) => r.rows.map((x) => Number(x.soma))))

describe('tempo: cada pessoa lê só o próprio (A2)', () => {
  it('membro lê só os próprios registros; admin e gestor leem os de todos', async () => {
    const db = await criarBanco()
    const { ana, bruno, gil, admin } = await base(db)
    expect(await notas(db, ana)).toEqual(['da Ana'])
    expect(await notas(db, bruno)).toEqual(['do Bruno'])
    expect(await notas(db, gil)).toEqual(['da Ana', 'do Bruno', 'do inativo'])
    expect(await notas(db, admin)).toEqual(['da Ana', 'do Bruno', 'do inativo'])
  })

  it('cliente do portal e usuário desativado não leem nada', async () => {
    const db = await criarBanco()
    const { cli, inativo } = await base(db)
    expect(await notas(db, cli)).toEqual([])
    expect(await notas(db, inativo)).toEqual([])
  })

  it('o total da tarefa (soma pela API) só mostra tudo a admin e gestor', async () => {
    const db = await criarBanco()
    const { ana, gil, admin, cli } = await base(db)
    expect(await embutido(db, ana)).toEqual([3600]) // só o dela
    expect(await embutido(db, gil)).toEqual([6000]) // 3600 + 1800 + 600
    expect(await embutido(db, admin)).toEqual([6000])
    expect(await embutido(db, cli)).toEqual([])
  })

  it('histórico da tarefa: o "registrou" de outra pessoa (com a duração) fica escondido do membro', async () => {
    const db = await criarBanco()
    const { ana, gil, cli, inativo } = await base(db)
    const eventos = (u: string) => ler<{ d: number }>(db, u, `select (new_value ->> 'seconds')::int as d from task_activity where action = 'time_logged' order by 1`).then((r) => r.map((x) => x.d))
    expect(await eventos(ana)).toEqual([3600])
    expect(await eventos(gil)).toEqual([600, 1800, 3600])
    expect(await eventos(cli)).toEqual([])
    expect(await eventos(inativo)).toEqual([])
    // os outros eventos do histórico continuam visíveis ao membro
    expect((await ler<{ n: number }>(db, ana, `select count(*)::int as n from task_activity where action <> 'time_logged'`))[0].n).toBeGreaterThan(0)
  })

  it('o membro continua registrando e vendo o próprio tempo (cronômetro incluso)', async () => {
    const db = await criarBanco()
    const { ana, tarefa } = await base(db)
    await comoUsuario(db, ana, (tx) => tx.query(`select iniciar_cronometro($1)`, [tarefa]))
    await comoUsuario(db, ana, (tx) => tx.query(`select parar_cronometro()`))
    expect((await ler<{ n: number }>(db, ana, `select count(*)::int as n from time_entries`))[0].n).toBe(2)
  })

  it('membro não edita nem apaga hora alheia (0 linhas); o dono sim; o gestor também', async () => {
    const db = await criarBanco()
    const { ana, bruno, gil, tarefa } = await base(db)
    const mexer = (u: string, sql: string) => comoUsuario(db, u, (tx) => tx.query(sql).then((r) => r.affectedRows ?? 0))
    expect(await mexer(bruno, `update time_entries set note = 'invadido' where note = 'da Ana'`)).toBe(0)
    expect(await mexer(bruno, `delete from time_entries where note = 'da Ana'`)).toBe(0)
    expect(await mexer(ana, `update time_entries set note = 'da Ana v2' where note = 'da Ana'`)).toBe(1)
    expect(await mexer(gil, `update time_entries set note = 'do Bruno v2' where note = 'do Bruno'`)).toBe(1)
    expect(tarefa).toBeTruthy()
  })

  it('a marca de faturável de outra pessoa: só o dono, admin e gestor; membro e o gestor do espaço sem papel de gestor não', async () => {
    const db = await criarBanco()
    const { ana, bruno, gil, espaco } = await base(db)
    const idAna = (await db.query<{ id: string }>(`select id from time_entries where note = 'da Ana'`)).rows[0].id
    await expect(comoUsuario(db, bruno, (tx) => tx.query(`select definir_faturavel($1, false)`, [idAna]))).rejects.toThrow(/Sem permissão/)
    await db.query(`update space_members set role = 'gestor' where space_id = $1 and user_id = $2`, [espaco, bruno]) // gestor do espaço, papel membro
    await expect(comoUsuario(db, bruno, (tx) => tx.query(`select definir_faturavel($1, false)`, [idAna]))).rejects.toThrow(/Sem permissão/)
    await comoUsuario(db, ana, (tx) => tx.query(`select definir_faturavel($1, false)`, [idAna]))
    await comoUsuario(db, gil, (tx) => tx.query(`select definir_faturavel($1, true)`, [idAna]))
    expect((await db.query(`select billable from time_entries where id = $1`, [idAna])).rows).toEqual([{ billable: true }])
  })
})
