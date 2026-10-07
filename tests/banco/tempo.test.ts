import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, executar, ler, type Banco } from '../ajuda/banco'
import {
  adicionarMembro,
  criarCliente,
  criarLista,
  criarTarefa,
  criarUsuario,
  idEspaco,
  vincularUsuarioCliente,
} from '../ajuda/cenario'

async function base(db: Banco) {
  const conteudo = await idEspaco(db, 'Conteúdo')
  const a = await criarCliente(db, 'A')
  const lista = await criarLista(db, { spaceId: conteudo, clientId: a })
  const ana = await criarUsuario(db, { role: 'membro' })
  const bruno = await criarUsuario(db, { role: 'membro' })
  const gil = await criarUsuario(db, { role: 'gestor' })
  await adicionarMembro(db, conteudo, ana, 'membro')
  await adicionarMembro(db, conteudo, bruno, 'membro')
  await adicionarMembro(db, conteudo, gil, 'gestor')
  const cli = await criarUsuario(db, { role: 'cliente' })
  await vincularUsuarioCliente(db, cli, a)
  const t1 = await criarTarefa(db, { listId: lista, responsaveis: [ana], titulo: 'T1' })
  const t2 = await criarTarefa(db, { listId: lista, responsaveis: [ana], titulo: 'T2' })
  return { conteudo, a, lista, ana, bruno, gil, cli, t1, t2 }
}

const chamar = (db: Banco, u: string, sql: string, params: unknown[] = []) =>
  comoUsuario(db, u, (tx) => tx.query<Record<string, unknown>>(sql, params).then((r) => r.rows))

async function registroFechado(db: Banco, u: string, t: string): Promise<string> {
  const [{ id }] = await chamar(db, u, `select lancar_tempo($1, '2026-10-07', 30) as id`, [t])
  return id as string
}

describe('cronômetro', () => {
  it('iniciar abre cronômetro e parar fecha com duração', async () => {
    const db = await criarBanco()
    const { ana, t1 } = await base(db)
    await chamar(db, ana, `select iniciar_cronometro($1)`, [t1])
    await chamar(db, ana, `select parar_cronometro()`)
    const linhas = await db.query<{ ended_at: string | null; duration_seconds: number | null; source: string }>(
      `select ended_at, duration_seconds, source from time_entries where user_id = $1`,
      [ana],
    )
    expect(linhas.rows).toHaveLength(1)
    expect(linhas.rows[0].ended_at).not.toBeNull()
    expect(linhas.rows[0].duration_seconds).toBeGreaterThanOrEqual(0)
    expect(linhas.rows[0].source).toBe('timer')
  })

  it('parar sem cronômetro ativo devolve nulo', async () => {
    const db = await criarBanco()
    const { ana } = await base(db)
    expect(await chamar(db, ana, `select parar_cronometro() as id`)).toEqual([{ id: null }])
  })

  it('iniciar em outra tarefa para o anterior', async () => {
    const db = await criarBanco()
    const { ana, t1, t2 } = await base(db)
    await chamar(db, ana, `select iniciar_cronometro($1)`, [t1])
    await chamar(db, ana, `select iniciar_cronometro($1)`, [t2])
    const ativos = await db.query(`select task_id from time_entries where user_id = $1 and ended_at is null`, [ana])
    expect(ativos.rows).toEqual([{ task_id: t2 }])
    const deT1 = await db.query(`select ended_at is not null as fechado from time_entries where task_id = $1`, [t1])
    expect(deT1.rows).toEqual([{ fechado: true }])
  })

  it('não existem dois ativos para a mesma pessoa', async () => {
    const db = await criarBanco()
    const { ana, t1, t2 } = await base(db)
    await chamar(db, ana, `select iniciar_cronometro($1)`, [t1])
    await expect(
      chamar(db, ana, `insert into time_entries (task_id, started_at, source) values ($1, now(), 'timer')`, [t2]),
    ).rejects.toMatchObject({ code: '23505' })
  })

  it('lançamento manual aceita 1 a 1440 minutos', async () => {
    const db = await criarBanco()
    const { ana, t1 } = await base(db)
    await chamar(db, ana, `select lancar_tempo($1, '2026-10-07', 90, 'Roteiro')`, [t1])
    const r = await db.query(`select duration_seconds, source, note from time_entries where task_id = $1`, [t1])
    expect(r.rows).toEqual([{ duration_seconds: 5400, source: 'manual', note: 'Roteiro' }])
    await expect(chamar(db, ana, `select lancar_tempo($1, '2026-10-07', 0)`, [t1])).rejects.toThrow(/entre 1 e 1440 minutos/)
    await expect(chamar(db, ana, `select lancar_tempo($1, '2026-10-07', 1441)`, [t1])).rejects.toThrow(/entre 1 e 1440 minutos/)
  })

  it('cliente não lê tempo', async () => {
    const db = await criarBanco()
    const { ana, cli, t1 } = await base(db)
    await db.query(`update tasks set visible_to_client = true where id = $1`, [t1])
    await registroFechado(db, ana, t1)
    expect(await ler(db, cli, `select * from time_entries`)).toEqual([])
    await expect(chamar(db, cli, `select iniciar_cronometro($1)`, [t1])).rejects.toThrow()
  })

  it('membro edita só o próprio registro; gestor edita qualquer um', async () => {
    const db = await criarBanco()
    const { ana, bruno, gil, t1 } = await base(db)
    const id = await registroFechado(db, ana, t1)
    expect(await executar(db, bruno, `update time_entries set note = 'b' where id = $1`, [id])).toBe(0)
    expect(await executar(db, bruno, `delete from time_entries where id = $1`, [id])).toBe(0)
    expect(await executar(db, gil, `update time_entries set note = 'g' where id = $1`, [id])).toBe(1)
    expect(await executar(db, ana, `update time_entries set note = 'a' where id = $1`, [id])).toBe(1)
  })

  it('editar duração recalcula o fim e não troca dono nem tarefa', async () => {
    const db = await criarBanco()
    const { ana, bruno, t1, t2 } = await base(db)
    const id = await registroFechado(db, ana, t1)
    await executar(db, ana, `update time_entries set duration_seconds = 600, user_id = $2, task_id = $3 where id = $1`, [id, bruno, t2])
    const r = await db.query(
      `select extract(epoch from ended_at - started_at)::int as s, user_id, task_id from time_entries where id = $1`,
      [id],
    )
    expect(r.rows).toEqual([{ s: 600, user_id: ana, task_id: t1 }])
  })

  it('não edita a duração de um cronômetro rodando', async () => {
    const db = await criarBanco()
    const { ana, t1 } = await base(db)
    await chamar(db, ana, `select iniciar_cronometro($1)`, [t1])
    await expect(
      executar(db, ana, `update time_entries set duration_seconds = 60 where task_id = $1`, [t1]),
    ).rejects.toThrow()
  })

  it('fechar registro grava histórico time_logged', async () => {
    const db = await criarBanco()
    const { ana, t1 } = await base(db)
    await registroFechado(db, ana, t1)
    await chamar(db, ana, `select iniciar_cronometro($1)`, [t1])
    await chamar(db, ana, `select parar_cronometro()`)
    const h = await db.query<{ actor_id: string; segundos: number }>(
      `select actor_id, (new_value->>'seconds')::int as segundos from task_activity
       where task_id = $1 and action = 'time_logged' order by id`,
      [t1],
    )
    expect(h.rows).toHaveLength(2)
    expect(h.rows[0]).toEqual({ actor_id: ana, segundos: 1800 })
    expect(h.rows[1].actor_id).toBe(ana)
  })

  it('funciona em lista solta e para responsável fora do espaço', async () => {
    const db = await criarBanco()
    const { a, ana } = await base(db)
    const solta = await criarLista(db, { spaceId: null, clientId: a })
    const ts = await criarTarefa(db, { listId: solta, responsaveis: [ana] })
    await chamar(db, ana, `select iniciar_cronometro($1)`, [ts])
    const comercial = await idEspaco(db, 'Comercial')
    const listaCom = await criarLista(db, { spaceId: comercial, clientId: a })
    const tc = await criarTarefa(db, { listId: listaCom, responsaveis: [ana] })
    await chamar(db, ana, `select iniciar_cronometro($1)`, [tc])
    expect(await ler(db, ana, `select task_id from time_entries where ended_at is null`)).toEqual([{ task_id: tc }])
  })

  it('quem não acessa a tarefa não inicia', async () => {
    const db = await criarBanco()
    const { t1 } = await base(db)
    const estranho = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, await idEspaco(db, 'Comercial'), estranho, 'membro')
    await expect(chamar(db, estranho, `select iniciar_cronometro($1)`, [t1])).rejects.toThrow()
    await expect(chamar(db, estranho, `select lancar_tempo($1, '2026-10-07', 10)`, [t1])).rejects.toThrow()
  })
})

describe('cronômetro após perder acesso', () => {
  it('quem perde acesso à tarefa ainda para o cronômetro e inicia outro', async () => {
    const db = await criarBanco()
    const { a, ana, bruno, t2 } = await base(db)
    const comercial = await idEspaco(db, 'Comercial')
    const listaCom = await criarLista(db, { spaceId: comercial, clientId: a })
    const tc = await criarTarefa(db, { listId: listaCom, responsaveis: [ana, bruno] })
    await chamar(db, ana, `select iniciar_cronometro($1)`, [tc])
    await db.query(`delete from task_assignees where task_id = $1 and user_id = $2`, [tc, ana])
    expect(await chamar(db, ana, `select parar_cronometro() is not null as parou`)).toEqual([{ parou: true }])
    await chamar(db, ana, `select iniciar_cronometro($1)`, [tc]).catch(() => null)
    await chamar(db, ana, `select iniciar_cronometro($1)`, [t2])
    expect(await ler(db, ana, `select task_id from time_entries where ended_at is null`)).toEqual([{ task_id: t2 }])
  })
})
