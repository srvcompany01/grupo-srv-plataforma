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
  const operacional = await idEspaco(db, 'Operacional')
  const comercial = await idEspaco(db, 'Comercial')
  const a = await criarCliente(db, 'A')
  const lista = await criarLista(db, { spaceId: conteudo, clientId: a })
  const admin = await criarUsuario(db, { role: 'admin', nome: 'Admin' })
  const ana = await criarUsuario(db, { role: 'membro', nome: 'Ana' })
  const bruno = await criarUsuario(db, { role: 'membro', nome: 'Bruno' })
  const paula = await criarUsuario(db, { role: 'membro', nome: 'Paula' })
  const carla = await criarUsuario(db, { role: 'membro', nome: 'Carla' })
  const estranho = await criarUsuario(db, { role: 'membro', nome: 'Estranho' })
  const inativo = await criarUsuario(db, { role: 'membro', nome: 'Inativo' })
  const cli = await criarUsuario(db, { role: 'cliente', nome: 'Cliente' })
  await adicionarMembro(db, conteudo, ana, 'membro')
  await adicionarMembro(db, conteudo, bruno, 'membro')
  await adicionarMembro(db, operacional, paula, 'membro')
  await adicionarMembro(db, comercial, carla, 'membro')
  await adicionarMembro(db, comercial, estranho, 'membro')
  await adicionarMembro(db, conteudo, inativo, 'membro')
  await db.query(`update profiles set active = false where id = $1`, [inativo])
  await vincularUsuarioCliente(db, cli, a)
  const t = await criarTarefa(db, { listId: lista, responsaveis: [ana, carla], titulo: 'Post' })
  return { conteudo, a, lista, admin, ana, bruno, paula, carla, estranho, inativo, cli, t }
}

const chamar = (db: Banco, u: string, sql: string, params: unknown[] = []) =>
  comoUsuario(db, u, (tx) => tx.query<Record<string, unknown>>(sql, params).then((r) => r.rows))

const anexo = (t: string, n = 1, extra: Record<string, unknown> = {}) => ({
  r2_key: `tarefas/${t}/${n}.png`,
  file_name: `foto${n}.png`,
  mime_type: 'image/png',
  size_bytes: 1000,
  kind: 'arquivo',
  ...extra,
})

const comentar = (db: Banco, u: string, t: string, body: string, mencoes: string[] = [], anexos: unknown[] = []) =>
  chamar(db, u, `select criar_comentario($1, $2, true, $3::uuid[], $4::jsonb) as id`, [
    t,
    body,
    mencoes,
    JSON.stringify(anexos),
  ])

const contar = async (db: Banco, tabela: string) =>
  (await db.query<{ n: number }>(`select count(*)::int as n from ${tabela}`)).rows[0].n

describe('usuario_le_tarefa', () => {
  it('bate com can_read_task para cada perfil', async () => {
    const db = await criarBanco()
    const s = await base(db)
    for (const u of [s.admin, s.ana, s.paula, s.carla, s.estranho, s.inativo, s.cli]) {
      const [{ v: esperado }] = await chamar(db, u, `select can_read_task($1) as v`, [s.t])
      const [{ v }] = await chamar(db, s.admin, `select usuario_le_tarefa($1, $2) as v`, [u, s.t])
      expect({ u, v }).toEqual({ u, v: esperado })
    }
  })
})

describe('menções e avisos', () => {
  it('menção cria aviso para o mencionado e não para o autor', async () => {
    const db = await criarBanco()
    const { ana, bruno, t } = await base(db)
    await comentar(db, ana, t, `oi @[Bruno](${bruno})`, [bruno, ana])
    const avisos = await db.query(`select user_id, actor_id, task_id, kind from notifications`)
    expect(avisos.rows).toEqual([{ user_id: bruno, actor_id: ana, task_id: t, kind: 'mention' }])
  })

  it('menção a quem não lê a tarefa recusa tudo', async () => {
    const db = await criarBanco()
    const { ana, estranho, t } = await base(db)
    await expect(comentar(db, ana, t, 'oi', [estranho], [anexo(t, 1), anexo(t, 2)])).rejects.toThrow(
      /não tem acesso a esta tarefa/,
    )
    expect(await contar(db, 'comments')).toBe(0)
    expect(await contar(db, 'notifications')).toBe(0)
    expect(await contar(db, 'comment_attachments')).toBe(0)
  })

  it('cada um vê e marca só os próprios avisos', async () => {
    const db = await criarBanco()
    const { ana, bruno, carla, t } = await base(db)
    await comentar(db, ana, t, 'oi', [bruno])
    expect(await ler(db, bruno, `select user_id from notifications`)).toEqual([{ user_id: bruno }])
    expect(await ler(db, ana, `select * from notifications`)).toEqual([])
    expect(await executar(db, ana, `update notifications set read_at = now()`)).toBe(0)
    expect(await executar(db, bruno, `update notifications set read_at = now(), user_id = $1`, [carla])).toBe(1)
    expect((await db.query(`select user_id, read_at is not null as lido from notifications`)).rows).toEqual([
      { user_id: bruno, lido: true },
    ])
    await expect(executar(db, ana, `insert into notifications (user_id, kind, task_id, actor_id) values ($1, 'mention', $2, $1)`, [bruno, t])).rejects.toThrow()
  })

  it('pessoas_da_tarefa lista quem lê a tarefa', async () => {
    const db = await criarBanco()
    const s = await base(db)
    const nomes = (await chamar(db, s.ana, `select full_name from pessoas_da_tarefa($1)`, [s.t])).map((r) => r.full_name)
    expect(nomes).toEqual(expect.arrayContaining(['Admin', 'Ana', 'Bruno', 'Carla', 'Paula']))
    expect(nomes).not.toContain('Cliente')
    expect(nomes).not.toContain('Inativo')
    expect(nomes).not.toContain('Estranho')
    expect(await chamar(db, s.estranho, `select * from pessoas_da_tarefa($1)`, [s.t])).toEqual([])
  })
})

describe('anexos', () => {
  it('comentário só com anexo é aceito; vazio sem anexo é recusado', async () => {
    const db = await criarBanco()
    const { ana, t } = await base(db)
    await comentar(db, ana, t, '', [], [anexo(t)])
    expect(await contar(db, 'comment_attachments')).toBe(1)
    await expect(comentar(db, ana, t, '  ')).rejects.toThrow(/Escreva um comentário ou anexe um arquivo/)
    await expect(executar(db, ana, `insert into comments (task_id, body) values ($1, '')`, [t])).rejects.toThrow(
      /Escreva um comentário ou anexe um arquivo/,
    )
  })

  it('anexo fora do prefixo da tarefa é recusado', async () => {
    const db = await criarBanco()
    const { ana, t } = await base(db)
    await expect(
      comentar(db, ana, t, 'x', [], [anexo(t, 1, { r2_key: 'tarefas/00000000-0000-0000-0000-000000000000/x.png' })]),
    ).rejects.toThrow()
  })

  it('limites de tamanho', async () => {
    const db = await criarBanco()
    const { ana, t } = await base(db)
    await expect(comentar(db, ana, t, 'x', [], [anexo(t, 1, { size_bytes: 104857601 })])).rejects.toThrow()
    await comentar(db, ana, t, 'x', [], [anexo(t, 2, { size_bytes: 524288000, kind: 'video', mime_type: 'video/webm' })])
    await expect(
      comentar(db, ana, t, 'x', [], [anexo(t, 3, { size_bytes: 524288001, kind: 'video', mime_type: 'video/webm' })]),
    ).rejects.toThrow()
  })

  it('mais de 10 anexos é recusado', async () => {
    const db = await criarBanco()
    const { ana, t } = await base(db)
    const onze = Array.from({ length: 11 }, (_, i) => anexo(t, i))
    await expect(comentar(db, ana, t, 'x', [], onze)).rejects.toThrow(/Máximo de 10 anexos/)
    expect(await contar(db, 'comments')).toBe(0)
  })

  it('anexos seguem a leitura da tarefa', async () => {
    const db = await criarBanco()
    const { ana, bruno, estranho, cli, t } = await base(db)
    await comentar(db, ana, t, 'x', [], [anexo(t)])
    expect(await ler(db, bruno, `select file_name from comment_attachments`)).toEqual([{ file_name: 'foto1.png' }])
    expect(await ler(db, estranho, `select * from comment_attachments`)).toEqual([])
    expect(await ler(db, cli, `select * from comment_attachments`)).toEqual([])
  })

  it('anexo não pode ser pendurado no comentário de outra pessoa', async () => {
    const db = await criarBanco()
    const { ana, bruno, t } = await base(db)
    const [{ id }] = await comentar(db, ana, t, 'x')
    await expect(
      executar(
        db,
        bruno,
        `insert into comment_attachments (comment_id, task_id, r2_key, file_name, mime_type, size_bytes, kind)
         values ($1, $2, $3, 'a.png', 'image/png', 10, 'arquivo')`,
        [id, t, `tarefas/${t}/z.png`],
      ),
    ).rejects.toThrow()
  })

  it('funciona em lista solta', async () => {
    const db = await criarBanco()
    const { a, ana, bruno } = await base(db)
    const solta = await criarLista(db, { spaceId: null, clientId: a })
    const ts = await criarTarefa(db, { listId: solta, responsaveis: [ana] })
    await comentar(db, ana, ts, `@[Bruno](${bruno})`, [bruno], [anexo(ts)])
    expect(await ler(db, bruno, `select task_id from notifications`)).toEqual([{ task_id: ts }])
  })
})
