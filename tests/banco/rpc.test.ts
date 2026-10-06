import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarUsuario, idEspaco, statusDaLista } from '../ajuda/cenario'

async function base(db: Banco) {
  const conteudo = await idEspaco(db, 'Conteúdo')
  const cliente = await criarCliente(db, 'A')
  const lista = await criarLista(db, { spaceId: conteudo, clientId: cliente })
  const ana = await criarUsuario(db, { role: 'membro' })
  const bruno = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, conteudo, ana, 'membro')
  await adicionarMembro(db, conteudo, bruno, 'membro')
  return { lista, ana, bruno }
}

const rpc = <T = unknown>(db: Banco, quem: string, sql: string, params: unknown[]) =>
  comoUsuario(db, quem, (tx) => tx.query<{ r: T }>(sql, params).then((x) => x.rows[0]?.r))

const criar = (db: Banco, quem: string, lista: string, responsaveis: string[]) =>
  rpc<string>(db, quem, `select criar_tarefa($1, 'T', $2::uuid[], null, null, 'a5') as r`, [lista, responsaveis])

const responsaveis = async (db: Banco, t: string) =>
  (await db.query<{ user_id: string }>(`select user_id from task_assignees where task_id = $1`, [t])).rows
    .map((r) => r.user_id)
    .sort()

describe('RPCs', () => {
  it('criar_tarefa com dois responsáveis', async () => {
    const db = await criarBanco()
    const { lista, ana, bruno } = await base(db)
    const t = await criar(db, ana, lista, [ana, bruno])
    expect(await responsaveis(db, t)).toEqual([ana, bruno].sort())
    expect((await db.query(`select position, title from tasks where id = $1`, [t])).rows).toEqual([
      { position: 'a5', title: 'T' },
    ])
  })

  it('criar_tarefa sem responsáveis falha', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    await expect(criar(db, ana, lista, [])).rejects.toThrow(/pelo menos um responsável/)
  })

  it('criar_tarefa cria subtarefa', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const mae = await criar(db, ana, lista, [ana])
    const filha = await rpc<string>(db, ana, `select criar_tarefa($1, 'F', $2::uuid[], $3) as r`, [lista, [ana], mae])
    expect((await db.query(`select parent_task_id from tasks where id = $1`, [filha])).rows).toEqual([
      { parent_task_id: mae },
    ])
  })

  it('definir_responsaveis troca A por B', async () => {
    const db = await criarBanco()
    const { lista, ana, bruno } = await base(db)
    const t = await criar(db, ana, lista, [ana])
    await rpc(db, ana, `select definir_responsaveis($1, $2::uuid[])`, [t, [bruno]])
    expect(await responsaveis(db, t)).toEqual([bruno])
  })

  it('definir_responsaveis vazio falha', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const t = await criar(db, ana, lista, [ana])
    await expect(rpc(db, ana, `select definir_responsaveis($1, $2::uuid[])`, [t, []])).rejects.toThrow(
      /pelo menos um responsável/,
    )
  })

  it('membro de fora não consegue criar_tarefa na lista', async () => {
    const db = await criarBanco()
    const { lista } = await base(db)
    const defora = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, await idEspaco(db, 'Comercial'), defora, 'membro')
    await expect(criar(db, defora, lista, [defora])).rejects.toThrow(/row-level security/)
  })

  it('mover_tarefa muda status e posição e registra no histórico', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const t = await criar(db, ana, lista, [ana])
    const emAndamento = (await statusDaLista(db, lista))[1]
    await rpc(db, ana, `select mover_tarefa($1, $2, 'b0')`, [t, emAndamento.id])
    expect((await db.query(`select status_id, position from tasks where id = $1`, [t])).rows).toEqual([
      { status_id: emAndamento.id, position: 'b0' },
    ])
    const h = await ler<{ field: string }>(db, ana, `select field from task_activity where task_id = $1 and action = 'updated'`, [t])
    expect(h).toEqual([{ field: 'status_id' }])
  })

  it('mover_tarefa de tarefa invisível falha', async () => {
    const db = await criarBanco()
    const { lista, ana } = await base(db)
    const t = await criar(db, ana, lista, [ana])
    const defora = await criarUsuario(db, { role: 'membro' })
    const emAndamento = (await statusDaLista(db, lista))[1]
    await expect(rpc(db, defora, `select mover_tarefa($1, $2, 'b0')`, [t, emAndamento.id])).rejects.toThrow(
      /Tarefa não encontrada/,
    )
  })
})
