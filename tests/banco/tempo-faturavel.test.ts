import { describe, expect, it } from 'vitest'
import { comoAnonimo, comoUsuario, criarBanco, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarTarefa, criarUsuario, idEspaco, vincularUsuarioCliente } from '../ajuda/cenario'

async function base(db: Banco) {
  const espaco = await idEspaco(db, 'Conteúdo')
  const aurora = await criarCliente(db, 'Aurora')
  const vida = await criarCliente(db, 'Vida')
  const listaA = await criarLista(db, { spaceId: espaco, clientId: aurora })
  const listaV = await criarLista(db, { spaceId: espaco, clientId: vida })
  const ana = await criarUsuario(db, { role: 'membro' })
  const bruno = await criarUsuario(db, { role: 'membro' })
  const gil = await criarUsuario(db, { role: 'gestor' })
  const admin = await criarUsuario(db, { role: 'admin' })
  await adicionarMembro(db, espaco, ana, 'membro')
  await adicionarMembro(db, espaco, bruno, 'membro')
  const cli = await criarUsuario(db, { role: 'cliente' })
  await vincularUsuarioCliente(db, cli, aurora)
  const tA = await criarTarefa(db, { listId: listaA, responsaveis: [ana], titulo: 'Roteiro' })
  const tV = await criarTarefa(db, { listId: listaV, responsaveis: [ana], titulo: 'Post' })
  return { espaco, aurora, vida, ana, bruno, gil, admin, cli, tA, tV }
}

/** Registro fechado direto no banco (superusuário), com a data/hora exata e a marca. */
function registro(db: Banco, tarefa: string, usuario: string, inicio: string, segundos: number, faturavel?: boolean) {
  return db
    .query<{ id: string }>(
      `insert into time_entries (task_id, user_id, started_at, duration_seconds, source, billable) values ($1, $2, $3, $4, 'manual', coalesce($5, true)) returning id`,
      [tarefa, usuario, inicio, segundos, faturavel ?? null],
    )
    .then((r) => r.rows[0].id)
}

const chamar = (db: Banco, u: string, sql: string, params: unknown[] = []) =>
  comoUsuario(db, u, (tx) => tx.query<Record<string, unknown>>(sql, params).then((r) => r.rows))

describe('tempo faturável: marca', () => {
  it('padrão é faturável (cronômetro, lançamento e inserção direta)', async () => {
    const db = await criarBanco()
    const { ana, tA } = await base(db)
    await chamar(db, ana, `select lancar_tempo($1, '2026-11-10', 30)`, [tA])
    await chamar(db, ana, `select iniciar_cronometro($1)`, [tA])
    await chamar(db, ana, `select parar_cronometro()`)
    expect((await db.query(`select billable from time_entries`)).rows).toEqual([{ billable: true }, { billable: true }])
  })

  it('lançar como não faturável', async () => {
    const db = await criarBanco()
    const { ana, tA } = await base(db)
    await chamar(db, ana, `select lancar_tempo($1, '2026-11-10', 30, 'reunião', false)`, [tA])
    expect((await db.query(`select billable, note from time_entries`)).rows).toEqual([{ billable: false, note: 'reunião' }])
  })

  it('dono, gestor e admin alteram a marca; outro membro e cliente não', async () => {
    const db = await criarBanco()
    const { ana, bruno, gil, admin, cli, tA } = await base(db)
    const id = await registro(db, tA, ana, '2026-11-10T15:00:00Z', 1800)
    await chamar(db, ana, `select definir_faturavel($1, false)`, [id])
    expect((await db.query(`select billable from time_entries`)).rows).toEqual([{ billable: false }])
    await expect(chamar(db, bruno, `select definir_faturavel($1, true)`, [id])).rejects.toThrow(/Sem permissão/)
    await expect(chamar(db, cli, `select definir_faturavel($1, true)`, [id])).rejects.toThrow()
    await chamar(db, gil, `select definir_faturavel($1, true)`, [id])
    await chamar(db, admin, `select definir_faturavel($1, false)`, [id])
    expect((await db.query(`select billable from time_entries`)).rows).toEqual([{ billable: false }])
    await expect(comoAnonimo(db, (tx) => tx.query(`select definir_faturavel($1, true)`, [id]))).rejects.toThrow(/permission denied/)
  })

  it('a alteração não mexe na duração nem na nota', async () => {
    const db = await criarBanco()
    const { ana, tA } = await base(db)
    const id = await registro(db, tA, ana, '2026-11-10T15:00:00Z', 1800)
    await chamar(db, ana, `select definir_faturavel($1, false)`, [id])
    expect((await db.query(`select duration_seconds from time_entries where id = $1`, [id])).rows).toEqual([{ duration_seconds: 1800 }])
  })
})

describe('tempo faturável: resumo (só admin e gestor)', () => {
  async function cenario(db: Banco) {
    const c = await base(db)
    await registro(db, c.tA, c.ana, '2026-11-10T15:00:00Z', 3600, true) // Aurora, Ana, faturável
    await registro(db, c.tA, c.bruno, '2026-11-11T15:00:00Z', 1800, false) // Aurora, Bruno, não faturável
    await registro(db, c.tV, c.ana, '2026-11-12T15:00:00Z', 7200, true) // Vida, Ana
    await db.query(`insert into time_entries (task_id, user_id, started_at, source) values ($1, $2, '2026-11-12T10:00:00Z', 'timer')`, [c.tA, c.bruno]) // cronômetro aberto: fora
    return c
  }

  it('soma por cliente e pessoa', async () => {
    const db = await criarBanco()
    const { gil } = await cenario(db)
    const r = await chamar(db, gil, `select client_name, user_name, total_seconds, billable_seconds, registros from resumo_tempo('2026-11-01', '2026-11-30') order by client_name, user_name`)
    expect(r.map((x) => [x.client_name, Number(x.total_seconds), Number(x.billable_seconds ?? 0), Number(x.registros)])).toEqual([
      ['Aurora', 3600, 3600, 1],
      ['Aurora', 1800, 0, 1],
      ['Vida', 7200, 7200, 1],
    ])
  })

  it('filtros: cliente, pessoa, faturável e sem cliente', async () => {
    const db = await criarBanco()
    const { admin, aurora, bruno } = await cenario(db)
    const contar = async (sql: string, params: unknown[]) => (await chamar(db, admin, sql, params)).length
    expect(await contar(`select * from registros_tempo('2026-11-01', '2026-11-30', array[$1::uuid])`, [aurora])).toBe(2)
    expect(await contar(`select * from registros_tempo('2026-11-01', '2026-11-30', null, false, array[$1::uuid])`, [bruno])).toBe(1)
    expect(await contar(`select * from registros_tempo('2026-11-01', '2026-11-30', null, false, null, false)`, [])).toBe(1)
    expect(await contar(`select * from registros_tempo('2026-11-01', '2026-11-30', null, true)`, [])).toBe(0)
    await db.query(`update tasks set client_id = null where title = 'Post'`)
    expect(await contar(`select * from registros_tempo('2026-11-01', '2026-11-30', null, true)`, [])).toBe(1)
  })

  it('o período usa a data local de Belém (UTC-3)', async () => {
    const db = await criarBanco()
    const { admin, ana, tA } = await base(db)
    await registro(db, tA, ana, '2026-12-01T02:00:00Z', 600) // 30/11 23:00 em Belém
    const novembro = await chamar(db, admin, `select dia::text from registros_tempo('2026-11-01', '2026-11-30')`)
    const dezembro = await chamar(db, admin, `select dia::text from registros_tempo('2026-12-01', '2026-12-31')`)
    expect(novembro).toEqual([{ dia: '2026-11-30' }])
    expect(dezembro).toEqual([])
  })

  it('membro, cliente e visitante não recebem nada', async () => {
    const db = await criarBanco()
    const { ana, cli } = await cenario(db)
    for (const u of [ana, cli]) {
      await expect(chamar(db, u, `select * from resumo_tempo('2026-11-01', '2026-11-30')`)).rejects.toThrow(/Sem permissão/)
      await expect(chamar(db, u, `select * from registros_tempo('2026-11-01', '2026-11-30')`)).rejects.toThrow(/Sem permissão/)
    }
    await expect(comoAnonimo(db, (tx) => tx.query(`select * from resumo_tempo('2026-11-01', '2026-11-30')`))).rejects.toThrow(/permission denied/)
  })

  it('cliente do portal nunca lê registros de tempo, faturável ou não', async () => {
    const db = await criarBanco()
    const { cli } = await cenario(db)
    expect(await ler(db, cli, `select id from time_entries`)).toEqual([])
    expect(await ler(db, cli, `select billable from time_entries`)).toEqual([])
  })
})
