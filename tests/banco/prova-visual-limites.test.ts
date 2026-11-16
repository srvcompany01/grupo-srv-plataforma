import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarUsuario, idEspaco } from '../ajuda/cenario'

async function base(db: Banco) {
  const espaco = await idEspaco(db, 'Conteúdo')
  const aurora = await criarCliente(db, 'Aurora')
  const lista = await criarLista(db, { spaceId: espaco, clientId: aurora })
  await db.query(`update lists set kind = 'conteudo' where id = $1`, [lista])
  const ana = await criarUsuario(db, { role: 'membro' })
  await adicionarMembro(db, espaco, ana, 'membro')
  const tarefa = await comoUsuario(db, ana, (tx) => tx.query<{ id: string }>(`select criar_post_conteudo($1, $2, 'Post', 'feed', '2026-11-24') as id`, [lista, aurora]).then((r) => r.rows[0].id))
  const versao = (await db.query<{ id: string }>(`select id from content_versions where task_id = $1`, [tarefa])).rows[0].id
  await db.query(`update content_posts set approval = 'aguardando' where task_id = $1`, [tarefa])
  return { ana, tarefa, versao }
}
const comentar = (db: Banco, c: { tarefa: string; versao: string }, extra: { pai?: string; tipo?: string; usuario?: string } = {}) =>
  db.query<{ id: string }>(
    `insert into content_review_comments (task_id, version_id, parent_id, author_kind, author_user_id, author_name, body) values ($1, $2, $3, $4, $5, 'Maria', 'texto') returning id`,
    [c.tarefa, c.versao, extra.pai ?? null, extra.tipo ?? 'cliente', extra.usuario ?? null],
  )

describe('M1: limite compartilhado no banco', () => {
  it('conta por chave e janela: passa até o máximo, recusa depois, e cada chave tem o seu contador', async () => {
    const db = await criarBanco()
    const usar = (chave: string) => db.query<{ ok: boolean }>(`select consumir_limite($1, 3, 600) as ok`, [chave]).then((r) => r.rows[0].ok)
    expect([await usar('a'), await usar('a'), await usar('a'), await usar('a'), await usar('a')]).toEqual([true, true, true, false, false])
    expect(await usar('b')).toBe(true) // outra chave (outro IP ou outro post) não é afetada
  })

  it('a janela recomeça depois de passar o tempo', async () => {
    const db = await criarBanco()
    for (let i = 0; i < 4; i++) await db.query(`select consumir_limite('c', 2, 600)`)
    expect((await db.query<{ ok: boolean }>(`select consumir_limite('c', 2, 600) as ok`)).rows[0].ok).toBe(false)
    await db.query(`update portal_limites set janela_inicio = now() - interval '11 minutes' where chave = 'c'`)
    expect((await db.query<{ ok: boolean }>(`select consumir_limite('c', 2, 600) as ok`)).rows[0].ok).toBe(true)
    expect((await db.query(`select n from portal_limites where chave = 'c'`)).rows).toEqual([{ n: 1 }])
  })

  it('rejeita parâmetros inválidos e só o service_role executa; a tabela não é lida pela API', async () => {
    const db = await criarBanco()
    await expect(db.query(`select consumir_limite(null, 3, 600)`)).rejects.toThrow(/Limite inválido/)
    await expect(db.query(`select consumir_limite('x', 0, 600)`)).rejects.toThrow(/Limite inválido/)
    const ana = await criarUsuario(db, { role: 'membro' })
    await expect(comoUsuario(db, ana, (tx) => tx.query(`select consumir_limite('x', 3, 600)`))).rejects.toThrow(/permission denied/)
    expect(await comoUsuario(db, ana, (tx) => tx.query(`select * from portal_limites`).then((r) => r.rows))).toEqual([])
  })
})

describe('M1: quota por versão', () => {
  it('no máximo 100 marcações do cliente por versão; a agência ainda responde', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await db.query(
      `insert into content_review_comments (task_id, version_id, author_kind, author_name, body) select $1, $2, 'cliente', 'Maria', 'm' || g from generate_series(1, 100) g`,
      [c.tarefa, c.versao],
    )
    await expect(comentar(db, c)).rejects.toThrow(/máximo de 100 comentários/)
    const raiz = (await db.query<{ id: string }>(`select id from content_review_comments limit 1`)).rows[0].id
    await comoUsuario(db, c.ana, (tx) => tx.query(`insert into content_review_comments (task_id, version_id, parent_id, author_kind, author_name, body) values ($1, $2, $3, 'equipe', 'x', 'ok')`, [c.tarefa, c.versao, raiz]))
  })

  it('no máximo 20 respostas do cliente por comentário', async () => {
    const db = await criarBanco()
    const c = await base(db)
    const [{ id: raiz }] = (await comentar(db, c)).rows
    await comoUsuario(db, c.ana, (tx) => tx.query(`insert into content_review_comments (task_id, version_id, parent_id, author_kind, author_name, body) values ($1, $2, $3, 'equipe', 'x', 'ok')`, [c.tarefa, c.versao, raiz]))
    for (let i = 0; i < 20; i++) await comentar(db, c, { pai: raiz })
    await expect(comentar(db, c, { pai: raiz })).rejects.toThrow(/máximo de respostas/)
  })
})

describe('R2: contagens agregadas no banco', () => {
  it('resumo_prova_visual: totais por versão, abertos e resolvidos só nos pontos do cliente', async () => {
    const db = await criarBanco()
    const c = await base(db)
    const raiz = (await comentar(db, c)).rows[0].id
    const resolvido = (await comentar(db, c)).rows[0].id
    await comoUsuario(db, c.ana, (tx) => tx.query(`insert into content_review_comments (task_id, version_id, parent_id, author_kind, author_name, body) values ($1, $2, $3, 'equipe', 'x', 'ok')`, [c.tarefa, c.versao, raiz]))
    await db.query(`update content_review_comments set resolved_at = now() where id = $1`, [resolvido])
    const linhas = await comoUsuario(db, c.ana, (tx) => tx.query(`select version_number, total::int, abertos::int, resolvidos::int from resumo_prova_visual($1)`, [c.tarefa]).then((r) => r.rows))
    expect(linhas).toEqual([{ version_number: 1, total: 3, abertos: 1, resolvidos: 1 }]) // 3 comentários (a resposta conta no total); só as raízes entram em abertos/resolvidos
  })

  it('abertos_por_tarefa conta tudo no banco, também acima do limite de 1000 linhas da API', async () => {
    const db = await criarBanco()
    const c = await base(db)
    // 1200 pontos abertos (a quota do gatilho é do cliente pelo portal; aqui o carregamento em massa a ignora de propósito).
    await db.exec(`set session_replication_role = replica`)
    await db.query(`insert into content_review_comments (task_id, version_id, author_kind, author_name, body) select $1, $2, 'cliente', 'Maria', 'm' || g from generate_series(1, 1200) g`, [c.tarefa, c.versao])
    await db.exec(`set session_replication_role = origin`)
    const r = await comoUsuario(db, c.ana, (tx) => tx.query(`select task_id, abertos::int as abertos from abertos_por_tarefa(array[$1::uuid])`, [c.tarefa]).then((x) => x.rows))
    expect(r).toEqual([{ task_id: c.tarefa, abertos: 1200 }])
  })

  it('quem não lê a tarefa recebe zero (a RLS vale nas duas funções)', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await comentar(db, c)
    const fora = await criarUsuario(db, { role: 'membro' })
    expect(await comoUsuario(db, fora, (tx) => tx.query(`select * from abertos_por_tarefa(array[$1::uuid])`, [c.tarefa]).then((r) => r.rows))).toEqual([])
    const resumoFora = await comoUsuario(db, fora, (tx) => tx.query<{ total: number }>(`select total::int from resumo_prova_visual($1)`, [c.tarefa]).then((r) => r.rows))
    expect(resumoFora.every((l) => l.total === 0)).toBe(true) // se a versão aparece, o total dos comentários que a RLS esconde é 0
  })
})
