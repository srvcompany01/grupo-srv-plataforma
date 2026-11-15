import { describe, expect, it } from 'vitest'
import { prazoDaOcorrencia, type Frequencia, type ModoMensal } from '@/dominio/recorrencia'
import { criarBanco, comoUsuario, ler, type Banco } from '../ajuda/banco'
import { criarCliente, criarLista, criarTarefa, criarUsuario, idEspaco, statusDaLista, adicionarMembro } from '../ajuda/cenario'

async function base(db: Banco) {
  const espaco = await idEspaco(db, 'Conteúdo')
  const cliente = await criarCliente(db, 'Acme')
  const lista = await criarLista(db, { spaceId: espaco, clientId: cliente })
  const ana = await criarUsuario(db, { role: 'membro' })
  const bia = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, espaco, ana, 'membro')
  const modelo = await criarTarefa(db, { listId: lista, responsaveis: [ana, bia], titulo: 'Relatório' })
  return { espaco, cliente, lista, ana, bia, modelo }
}

type Regra = { frequency?: string; every?: number; anchor: string; weekdays?: number[] | null; month_mode?: string; ends_on?: string | null; max_count?: number | null; create_mode?: string; copy_assignees?: boolean; copy_subtasks?: boolean; copy_fields?: boolean }

function regra(db: Banco, tarefa: string, r: Regra) {
  return db.query(
    `insert into task_recurrences (task_id, frequency, every, anchor_date, weekdays, month_mode, ends_on, max_count, create_mode, copy_assignees, copy_subtasks, copy_fields)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [tarefa, r.frequency ?? 'weekly', r.every ?? 1, r.anchor, r.weekdays ?? null, r.month_mode ?? 'day', r.ends_on ?? null, r.max_count ?? null, r.create_mode ?? 'schedule', r.copy_assignees ?? true, r.copy_subtasks ?? true, r.copy_fields ?? true],
  )
}

const copias = (db: Banco, modelo: string) =>
  db.query<{ id: string; due: string; title: string }>(`select id, due_date::text as due, title from tasks where recurrence_source_id = $1 order by due_date`, [modelo]).then((r) => r.rows)

describe('recorrência avançada: datas', () => {
  it('a função SQL e o TypeScript calculam as mesmas datas', async () => {
    const db = await criarBanco()
    const casos: { frequencia: Frequencia; cada: number; ancora: string; dias: number[] | null; modo: ModoMensal }[] = [
      { frequencia: 'daily', cada: 2, ancora: '2026-11-30', dias: null, modo: 'day' },
      { frequencia: 'weekdays', cada: 1, ancora: '2026-11-14', dias: null, modo: 'day' },
      { frequencia: 'weekdays', cada: 1, ancora: '2026-11-18', dias: null, modo: 'day' },
      { frequencia: 'weekly', cada: 1, ancora: '2026-11-24', dias: null, modo: 'day' },
      { frequencia: 'weekly', cada: 2, ancora: '2026-11-24', dias: [1, 4, 7], modo: 'day' },
      { frequencia: 'weekly', cada: 1, ancora: '2026-11-22', dias: [7, 3], modo: 'day' },
      { frequencia: 'monthly', cada: 1, ancora: '2026-01-31', dias: null, modo: 'day' },
      { frequencia: 'monthly', cada: 3, ancora: '2026-11-23', dias: null, modo: 'weekday_position' },
      { frequencia: 'monthly', cada: 1, ancora: '2026-11-30', dias: null, modo: 'weekday_position' },
      { frequencia: 'monthly', cada: 1, ancora: '2026-12-31', dias: null, modo: 'weekday_position' },
      { frequencia: 'monthly', cada: 1, ancora: '2027-02-01', dias: null, modo: 'weekday_position' },
    ]
    for (const c of casos) {
      for (let n = 0; n < 14; n++) {
        const { rows } = await db.query<{ d: string }>(`select prazo_da_recorrencia($1::date, $2, $3, $4, $5::smallint[], $6)::text as d`, [c.ancora, c.frequencia, c.cada, n, c.dias, c.modo])
        const ts = prazoDaOcorrencia({ frequencia: c.frequencia, cada: c.cada, primeiroPrazo: c.ancora, diasSemana: c.dias, modoMensal: c.modo }, n)
        expect({ caso: c, n, d: rows[0].d }).toEqual({ caso: c, n, d: ts })
      }
    }
  })
})

describe('recorrência avançada: geração', () => {
  it('cria as cópias com o vínculo da série e respeita dias úteis', async () => {
    const db = await criarBanco()
    const { modelo } = await base(db)
    await regra(db, modelo, { frequency: 'weekdays', anchor: '2026-11-13' }) // sexta
    expect((await db.query(`select gerar_recorrencias('2026-11-17') as n`)).rows).toEqual([{ n: 3 }])
    expect((await copias(db, modelo)).map((c) => c.due)).toEqual(['2026-11-13', '2026-11-16', '2026-11-17'])
  })

  it('para no fim por data e por quantidade, e não recria', async () => {
    const db = await criarBanco()
    const { modelo } = await base(db)
    await regra(db, modelo, { frequency: 'daily', anchor: '2026-11-01', ends_on: '2026-11-03' })
    expect((await db.query(`select gerar_recorrencias('2026-12-01') as n`)).rows).toEqual([{ n: 3 }])
    expect((await db.query(`select gerar_recorrencias('2026-12-01') as n`)).rows).toEqual([{ n: 0 }])

    const outro = await base(db)
    await regra(db, outro.modelo, { frequency: 'daily', anchor: '2026-11-01', max_count: 2 })
    await db.query(`select gerar_recorrencias('2026-12-01')`)
    expect(await copias(db, outro.modelo)).toHaveLength(2)
  })

  it('copia subtarefas (em vários níveis), etiquetas e campos', async () => {
    const db = await criarBanco()
    const { modelo, lista, ana } = await base(db)
    const sub = await criarTarefa(db, { listId: lista, responsaveis: [ana], titulo: 'Subtarefa', parentId: modelo })
    await criarTarefa(db, { listId: lista, responsaveis: [ana], titulo: 'Neta', parentId: sub })
    await regra(db, modelo, { frequency: 'daily', anchor: '2026-11-02' })
    await db.query(`select gerar_recorrencias('2026-11-02')`)
    const [copia] = await copias(db, modelo)
    const subs = await db.query<{ title: string; pai: string | null; fonte: string | null }>(
      `select title, parent_task_id as pai, recurrence_source_id as fonte from tasks where title in ('Subtarefa', 'Neta') and id not in ($1, $2) order by title`,
      [sub, (await db.query<{ id: string }>(`select id from tasks where title = 'Neta' and parent_task_id = $1`, [sub])).rows[0].id],
    )
    expect(subs.rows).toHaveLength(2)
    expect(subs.rows.map((s) => s.title)).toEqual(['Neta', 'Subtarefa'])
    expect(subs.rows.find((s) => s.title === 'Subtarefa')!.pai).toBe(copia.id)
    expect(subs.rows.every((s) => s.fonte === null)).toBe(true)
  })

  it('sem copiar subtarefas, a cópia vem sem elas; sem copiar responsáveis, fica só um', async () => {
    const db = await criarBanco()
    const { modelo, lista, ana } = await base(db)
    await criarTarefa(db, { listId: lista, responsaveis: [ana], titulo: 'Subtarefa', parentId: modelo })
    await regra(db, modelo, { frequency: 'daily', anchor: '2026-11-02', copy_subtasks: false, copy_assignees: false })
    await db.query(`select gerar_recorrencias('2026-11-02')`)
    const [copia] = await copias(db, modelo)
    expect((await db.query(`select 1 from tasks where parent_task_id = $1`, [copia.id])).rows).toHaveLength(0)
    expect((await db.query(`select 1 from task_assignees where task_id = $1`, [copia.id])).rows).toHaveLength(1)
  })

  it('a regra "ao concluir" não é gerada pelo cron', async () => {
    const db = await criarBanco()
    const { modelo } = await base(db)
    await regra(db, modelo, { frequency: 'daily', anchor: '2026-11-02', create_mode: 'on_complete' })
    expect((await db.query(`select gerar_recorrencias('2026-12-01') as n`)).rows).toEqual([{ n: 0 }])
  })
})

describe('recorrência avançada: criar ao concluir', () => {
  async function concluir(db: Banco, tarefa: string, lista: string) {
    const st = await statusDaLista(db, lista)
    await db.query(`update tasks set status_id = $2 where id = $1`, [tarefa, st.find((s) => s.category === 'done')!.id])
  }

  it('concluir o modelo e depois cada cópia cria a próxima, uma por vez', async () => {
    const db = await criarBanco()
    const { modelo, lista } = await base(db)
    await db.query(`update tasks set due_date = '2026-01-05' where id = $1`, [modelo])
    await regra(db, modelo, { frequency: 'weekly', anchor: '2026-01-05', create_mode: 'on_complete' })
    await concluir(db, modelo, lista)
    const primeira = await copias(db, modelo)
    expect(primeira).toHaveLength(1)
    // As datas passadas são puladas: a próxima é de hoje em diante e depois do prazo concluído.
    expect(primeira[0].due >= new Date().toISOString().slice(0, 10)).toBe(true)

    await concluir(db, primeira[0].id, lista)
    const duas = await copias(db, modelo)
    expect(duas).toHaveLength(2)
    expect(duas[1].due > primeira[0].due).toBe(true)

    // Reconcluir não duplica: já existe cópia aberta.
    await db.query(`update tasks set status_id = (select id from list_statuses where list_id = $2 and category = 'todo' limit 1) where id = $1`, [modelo, lista])
    await concluir(db, modelo, lista)
    expect(await copias(db, modelo)).toHaveLength(2)
  })

  it('pausada ou no fim da contagem, não cria', async () => {
    const db = await criarBanco()
    const { modelo, lista } = await base(db)
    await regra(db, modelo, { frequency: 'weekly', anchor: '2026-01-05', create_mode: 'on_complete', max_count: 1 })
    await db.query(`update task_recurrences set generated = 1`)
    await concluir(db, modelo, lista)
    expect(await copias(db, modelo)).toHaveLength(0)

    const b = await base(db)
    await regra(db, b.modelo, { frequency: 'weekly', anchor: '2026-01-05', create_mode: 'on_complete' })
    await db.query(`update task_recurrences set active = false where task_id = $1`, [b.modelo])
    await concluir(db, b.modelo, b.lista)
    expect(await copias(db, b.modelo)).toHaveLength(0)
  })
})

describe('recorrência avançada: acesso', () => {
  it('quem não lê a tarefa não vê a regra; a equipe define e pausa', async () => {
    const db = await criarBanco()
    const { modelo, ana } = await base(db)
    const intruso = await criarUsuario(db, { role: 'membro' })
    await regra(db, modelo, { frequency: 'weekdays', anchor: '2026-11-02' })
    expect(await ler(db, ana, `select create_mode from task_recurrences`)).toEqual([{ create_mode: 'schedule' }])
    expect(await ler(db, intruso, `select create_mode from task_recurrences`)).toEqual([])
    await comoUsuario(db, ana, (tx) => tx.query(`update task_recurrences set active = false where task_id = $1`, [modelo]))
    expect((await db.query(`select active from task_recurrences`)).rows).toEqual([{ active: false }])
  })

  it('rejeita regra inválida', async () => {
    const db = await criarBanco()
    const { modelo } = await base(db)
    await expect(regra(db, modelo, { frequency: 'weekly', anchor: '2026-11-02', weekdays: [] })).rejects.toThrow()
    await expect(regra(db, modelo, { frequency: 'weekly', anchor: '2026-11-02', weekdays: [8] })).rejects.toThrow()
    await expect(regra(db, modelo, { frequency: 'yearly', anchor: '2026-11-02' })).rejects.toThrow()
  })
})
