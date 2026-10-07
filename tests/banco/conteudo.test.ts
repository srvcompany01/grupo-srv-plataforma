import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler, type Banco } from '../ajuda/banco'
import { criarCliente, criarUsuario, vincularUsuarioCliente } from '../ajuda/cenario'

async function base(db: Banco) {
  const cliente = await criarCliente(db, 'Acme')
  const outro = await criarCliente(db, 'Beta')
  const ana = await criarUsuario(db, { role: 'membro' })
  const lista = (await db.query<{ id: string }>(`select id from lists where slug = 'social-conteudo'`)).rows[0].id
  return { cliente, outro, ana, lista }
}

/** Cria um post como `userId` (a função é `security invoker`, então vale a RLS de quem chama). */
const criarPost = (db: Banco, userId: string, lista: string, cliente: string) =>
  comoUsuario(db, userId, async (tx) => {
    const { rows } = await tx.query<{ id: string }>(`select criar_post_conteudo($1, $2, 'Post de teste', 'reels', '2026-11-05') as id`, [lista, cliente])
    return rows[0].id
  })

describe('conteúdo: dados', () => {
  it('criar_post_conteudo cria tarefa, post em rascunho, versão 1 e responsável', async () => {
    const db = await criarBanco()
    const { cliente, ana, lista } = await base(db)
    const id = await criarPost(db, ana, lista, cliente)
    const post = (await db.query(`select format, approval, current_version from content_posts where task_id = $1`, [id])).rows
    expect(post).toEqual([{ format: 'reels', approval: 'rascunho', current_version: 1 }])
    expect((await db.query(`select number from content_versions where task_id = $1`, [id])).rows).toEqual([{ number: 1 }])
    expect((await db.query(`select client_id, due_date::text as due from tasks where id = $1`, [id])).rows).toEqual([{ client_id: cliente, due: '2026-11-05' }])
    expect((await db.query(`select user_id from task_assignees where task_id = $1`, [id])).rows).toEqual([{ user_id: ana }])
  })

  it('lista de conteúdo vem marcada como kind=conteudo; as demais são tarefas', async () => {
    const db = await criarBanco()
    const { lista } = await base(db)
    expect((await db.query(`select kind from lists where id = $1`, [lista])).rows).toEqual([{ kind: 'conteudo' }])
    expect((await db.query(`select count(*)::int as n from lists where kind = 'conteudo'`)).rows).toEqual([{ n: 1 }])
  })

  it('equipe lê o post; usuário cliente não lê nenhuma das tabelas', async () => {
    const db = await criarBanco()
    const { cliente, ana, lista } = await base(db)
    const id = await criarPost(db, ana, lista, cliente)
    const c = await criarUsuario(db, { role: 'cliente' })
    await vincularUsuarioCliente(db, c, cliente)
    expect(await ler(db, ana, `select task_id from content_posts`)).toEqual([{ task_id: id }])
    for (const t of ['content_posts', 'content_versions', 'content_media', 'content_responses']) {
      expect(await ler(db, c, `select * from ${t}`), t).toEqual([])
    }
  })

  it('versão é única por tarefa e número', async () => {
    const db = await criarBanco()
    const { cliente, ana, lista } = await base(db)
    const id = await criarPost(db, ana, lista, cliente)
    await expect(db.query(`insert into content_versions (task_id, number) values ($1, 1)`, [id])).rejects.toThrow(/duplicate|unique/i)
  })

  it('segunda resposta na mesma versão é rejeitada', async () => {
    const db = await criarBanco()
    const { cliente, ana, lista } = await base(db)
    const id = await criarPost(db, ana, lista, cliente)
    const v = (await db.query<{ id: string }>(`select id from content_versions where task_id = $1`, [id])).rows[0].id
    await db.query(`insert into content_responses (version_id, task_id, decision, responder_name) values ($1, $2, 'aprovado', 'Maria')`, [v, id])
    await expect(db.query(`insert into content_responses (version_id, task_id, decision, responder_name) values ($1, $2, 'ajuste', 'Maria')`, [v, id])).rejects.toThrow(/duplicate|unique/i)
  })

  it('versão respondida fica congelada, mas a nova versão continua editável', async () => {
    const db = await criarBanco()
    const { cliente, ana, lista } = await base(db)
    const id = await criarPost(db, ana, lista, cliente)
    const v = (await db.query<{ id: string }>(`select id from content_versions where task_id = $1`, [id])).rows[0].id
    await db.query(`update content_versions set caption = 'antes' where id = $1`, [v])
    await db.query(`insert into content_responses (version_id, task_id, decision, responder_name) values ($1, $2, 'ajuste', 'Maria')`, [v, id])
    await expect(db.query(`update content_versions set caption = 'depois' where id = $1`, [v])).rejects.toThrow(/congelada/)
    await db.query(`insert into content_versions (task_id, number, caption) values ($1, 2, 'v2')`, [id])
    await db.query(`update content_versions set caption = 'v2 editada' where task_id = $1 and number = 2`, [id])
    expect((await db.query(`select caption from content_versions where id = $1`, [v])).rows).toEqual([{ caption: 'antes' }])
  })

  it('mídia e resposta herdam o task_id da versão; task_id divergente é rejeitado', async () => {
    const db = await criarBanco()
    const { cliente, ana, lista } = await base(db)
    const id = await criarPost(db, ana, lista, cliente)
    const outra = await criarPost(db, ana, lista, cliente)
    const v = (await db.query<{ id: string }>(`select id from content_versions where task_id = $1`, [id])).rows[0].id
    await expect(
      db.query(`insert into content_media (version_id, task_id, position, kind, r2_key, original_name, size_bytes) values ($1, $2, 0, 'imagem', 'k', 'a.png', 10)`, [v, outra]),
    ).rejects.toThrow(/tarefa da versão/)
    await expect(db.query(`insert into content_responses (version_id, task_id, decision, responder_name) values ($1, $2, 'aprovado', 'M')`, [v, outra])).rejects.toThrow(/tarefa da versão/)
  })

  it('cliente novo e existente ganham approval_token longo e único', async () => {
    const db = await criarBanco()
    const { cliente, outro } = await base(db)
    const r = (await db.query<{ approval_token: string }>(`select approval_token from clients where id in ($1, $2)`, [cliente, outro])).rows
    expect(r).toHaveLength(2)
    for (const { approval_token } of r) expect(approval_token).toMatch(/^[0-9a-f]{64}$/)
    expect(new Set(r.map((x) => x.approval_token)).size).toBe(2)
  })
})
