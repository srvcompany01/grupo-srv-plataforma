import { describe, expect, it } from 'vitest'
import { criarBanco } from '../ajuda/banco'
import { criarCliente, criarLista, criarTarefa, criarUsuario } from '../ajuda/cenario'

describe('lista de conteúdo: toda subtarefa é um post', () => {
  it('subtarefa nova vira post (feed, versão 1); a tarefa-mãe continua tarefa', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'admin' })
    const lista = (await db.query<{ id: string }>(`select id from lists where slug = 'social-conteudo'`)).rows[0].id
    const mae = await criarTarefa(db, { listId: lista, responsaveis: [ana], titulo: 'Campanha de novembro' })
    const sub = await criarTarefa(db, { listId: lista, responsaveis: [ana], titulo: 'Post 1', parentId: mae })
    expect((await db.query(`select task_id, format, approval from content_posts`)).rows).toEqual([{ task_id: sub, format: 'feed', approval: 'rascunho' }])
    expect((await db.query(`select number from content_versions where task_id = $1`, [sub])).rows).toEqual([{ number: 1 }])
  })

  it('lista que vira de conteúdo converte as subtarefas que já existiam; lista comum não', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'admin' })
    const cliente = await criarCliente(db, 'Acme')
    const lista = await criarLista(db, { spaceId: null, clientId: cliente, nome: 'Máquina de Conteúdo' })
    const mae = await criarTarefa(db, { listId: lista, responsaveis: [ana] })
    const sub = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: mae })
    expect((await db.query(`select count(*)::int as n from content_posts`)).rows).toEqual([{ n: 0 }])
    await db.query(`update lists set kind = 'conteudo' where id = $1`, [lista])
    expect((await db.query(`select task_id from content_posts`)).rows).toEqual([{ task_id: sub }])
    expect((await db.query(`select count(*)::int as n from content_versions where task_id = $1`, [sub])).rows).toEqual([{ n: 1 }])
    // nova subtarefa depois disso também vira post
    const sub2 = await criarTarefa(db, { listId: lista, responsaveis: [ana], parentId: mae })
    expect((await db.query(`select count(*)::int as n from content_posts where task_id = $1`, [sub2])).rows).toEqual([{ n: 1 }])
  })
})
