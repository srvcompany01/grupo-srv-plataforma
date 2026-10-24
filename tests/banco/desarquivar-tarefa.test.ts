import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco } from '../ajuda/banco'
import { criarCliente, criarEspaco, criarLista, criarTarefa, criarUsuario } from '../ajuda/cenario'

describe('P2-4: desarquivar tarefa', () => {
  it('traz de volta a tarefa e as subtarefas arquivadas junto, não as arquivadas antes', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'admin' })
    const lista = await criarLista(db, { spaceId: await criarEspaco(db, 'Teste'), clientId: await criarCliente(db, 'Aurum') })
    const mae = await criarTarefa(db, { listId: lista, responsaveis: [ana], titulo: 'Mãe' })
    const filha = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: mae })
    const neta = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: filha })
    const antiga = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: mae })
    await db.query(`update tasks set archived_at = now() - interval '1 day' where id = $1`, [antiga])
    await db.query(`update tasks set archived_at = now() where id = $1`, [mae])
    const n = await comoUsuario(db, ana, async (tx) => (await tx.query<{ n: number }>(`select desarquivar_tarefa($1) as n`, [mae])).rows[0].n)
    expect(n).toBe(3)
    const ativas = (await db.query<{ id: string }>(`select id from tasks where archived_at is null and id = any($1)`, [[mae, filha, neta, antiga]])).rows.map((r) => r.id)
    expect(ativas.sort()).toEqual([mae, filha, neta].sort())
    await expect(comoUsuario(db, ana, (tx) => tx.query(`select desarquivar_tarefa($1)`, [mae]))).rejects.toThrow(/não está arquivada/)
  })
})
