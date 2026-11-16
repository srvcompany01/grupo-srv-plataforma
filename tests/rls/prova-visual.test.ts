import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarUsuario, idEspaco, vincularUsuarioCliente } from '../ajuda/cenario'

async function base(db: Banco) {
  const espaco = await idEspaco(db, 'Conteúdo')
  const aurora = await criarCliente(db, 'Aurora')
  const vida = await criarCliente(db, 'Vida')
  const lista = await criarLista(db, { spaceId: espaco, clientId: aurora })
  await db.query(`update lists set kind = 'conteudo' where id = $1`, [lista])
  const ana = await criarUsuario(db, { role: 'membro' })
  const intruso = await criarUsuario(db, { role: 'membro' }) // sem acesso ao espaço
  await adicionarMembro(db, espaco, ana, 'membro')
  const cli = await criarUsuario(db, { role: 'cliente' })
  await vincularUsuarioCliente(db, cli, aurora)
  const outro = await criarUsuario(db, { role: 'cliente' })
  await vincularUsuarioCliente(db, outro, vida)
  const tarefa = await comoUsuario(db, ana, (tx) =>
    tx.query<{ id: string }>(`select criar_post_conteudo($1, $2, 'Post', 'feed', '2026-11-24') as id`, [lista, aurora]).then((r) => r.rows[0].id),
  )
  const versao = (await db.query<{ id: string }>(`select id from content_versions where task_id = $1 and number = 1`, [tarefa])).rows[0].id
  await db.query(`update content_posts set approval = 'aguardando' where task_id = $1`, [tarefa])
  return { ana, intruso, cli, outro, tarefa, versao, aurora, lista }
}

/** Comentário do cliente como o servidor do portal grava (superusuário = chave mestra). */
function comentar(db: Banco, c: { tarefa: string; versao: string }, extra: { body?: string; media?: number | null; x?: number | null; y?: number | null; segundo?: number | null; parent?: string | null; tipo?: string; usuario?: string | null; nome?: string } = {}) {
  return db.query<{ id: string }>(
    `insert into content_review_comments (task_id, version_id, parent_id, author_kind, author_user_id, author_name, body, media_index, x_pct, y_pct, video_second)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id`,
    [c.tarefa, c.versao, extra.parent ?? null, extra.tipo ?? 'cliente', extra.usuario ?? null, extra.nome ?? 'Maria', extra.body ?? 'Trocar a cor do botão', extra.media === undefined ? 0 : extra.media, extra.x === undefined ? 30 : extra.x, extra.y === undefined ? 40 : extra.y, extra.segundo ?? null],
  )
}

describe('prova visual: regras do banco', () => {
  it('o cliente comenta num ponto da imagem e num instante do vídeo', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await comentar(db, c)
    await comentar(db, c, { media: 1, x: null, y: null, segundo: 12.5, body: 'Corte aqui' })
    await comentar(db, c, { media: null, x: null, y: null, body: 'Comentário geral' })
    expect((await db.query(`select count(*)::int as n from content_review_comments`)).rows).toEqual([{ n: 3 }])
  })

  it('rejeita ponto fora da mídia, x sem y, texto vazio e local sem mídia', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await expect(comentar(db, c, { x: 120 })).rejects.toThrow()
    await expect(comentar(db, c, { x: 10, y: null })).rejects.toThrow()
    await expect(comentar(db, c, { body: '   ' })).rejects.toThrow()
    await expect(comentar(db, c, { media: null, x: 10, y: 10 })).rejects.toThrow()
  })

  it('o task_id precisa ser o da versão', async () => {
    const db = await criarBanco()
    const c = await base(db)
    const lista = c.lista
    const outra = await comoUsuario(db, c.ana, (tx) => tx.query<{ id: string }>(`select criar_post_conteudo($1, $2, 'Outro', 'feed', '2026-11-25') as id`, [lista, c.aurora]).then((r) => r.rows[0].id))
    await expect(comentar(db, { tarefa: outra, versao: c.versao })).rejects.toThrow(/task_id/)
  })

  it('depois que o cliente responde, a versão fica só para leitura (aprovado ou ajuste)', async () => {
    for (const decisao of ['aprovado', 'ajuste']) {
      const db = await criarBanco()
      const c = await base(db)
      await comentar(db, c)
      await db.query(`insert into content_responses (version_id, task_id, decision, comment, responder_name) values ($1, $2, $3, 'ok', 'Maria')`, [c.versao, c.tarefa, decisao])
      await db.query(`update content_posts set approval = $2 where task_id = $1`, [c.tarefa, decisao])
      await expect(comentar(db, c)).rejects.toThrow(/somente leitura|só para leitura/)
    }
  })

  it('post em rascunho ou versão antiga não aceita comentário do cliente', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await db.query(`update content_posts set approval = 'rascunho' where task_id = $1`, [c.tarefa])
    await expect(comentar(db, c)).rejects.toThrow()
    await db.query(`update content_posts set approval = 'aguardando' where task_id = $1`, [c.tarefa])
    await db.query(`insert into content_versions (task_id, number) values ($1, 2)`, [c.tarefa])
    await db.query(`update content_posts set current_version = 2 where task_id = $1`, [c.tarefa])
    await expect(comentar(db, c)).rejects.toThrow() // a versão 1 não é mais a atual
  })

  it('resposta é da equipe e depois o cliente pode responder à resposta; marcação nova da equipe não existe', async () => {
    const db = await criarBanco()
    const c = await base(db)
    const [{ id: raiz }] = (await comentar(db, c)).rows
    // O cliente não responde antes da agência.
    await expect(comentar(db, c, { parent: raiz, media: null, x: null, y: null, body: 'oi?' })).rejects.toThrow(/depois que a agência/)
    // Equipe responde (nome vem do perfil).
    const resposta = await comoUsuario(db, c.ana, (tx) =>
      tx
        .query<{ id: string }>(
          `insert into content_review_comments (task_id, version_id, parent_id, author_kind, author_name, body) values ($1, $2, $3, 'equipe', 'x', 'Ajustado') returning id`,
          [c.tarefa, c.versao, raiz],
        )
        .then((r) => r.rows[0].id),
    )
    expect((await db.query(`select author_user_id = $2 as dono, author_name <> 'x' as nome_do_perfil from content_review_comments where id = $1`, [resposta, c.ana])).rows).toEqual([{ dono: true, nome_do_perfil: true }])
    await comentar(db, c, { parent: raiz, media: null, x: null, y: null, body: 'Valeu!' })
    // Equipe não cria marcação raiz.
    await expect(
      comoUsuario(db, c.ana, (tx) =>
        tx.query(`insert into content_review_comments (task_id, version_id, author_kind, author_name, body, media_index, x_pct, y_pct) values ($1, $2, 'equipe', 'Ana', 'marca', 0, 10, 10)`, [c.tarefa, c.versao]),
      ),
    ).rejects.toThrow()
    // Resposta de resposta não existe.
    await expect(comentar(db, c, { parent: resposta, media: null, x: null, y: null })).rejects.toThrow(/mesma versão/)
  })

  it('só a resolução muda: a equipe resolve e reabre, e o texto não se edita', async () => {
    const db = await criarBanco()
    const c = await base(db)
    const [{ id }] = (await comentar(db, c)).rows
    await comoUsuario(db, c.ana, (tx) => tx.query(`update content_review_comments set resolved_at = now() where id = $1`, [id]))
    expect((await db.query(`select resolved_by = $2 as por_ana from content_review_comments where id = $1`, [id, c.ana])).rows).toEqual([{ por_ana: true }])
    await comoUsuario(db, c.ana, (tx) => tx.query(`update content_review_comments set resolved_at = null where id = $1`, [id]))
    expect((await db.query(`select resolved_at, resolved_by from content_review_comments where id = $1`, [id])).rows).toEqual([{ resolved_at: null, resolved_by: null }])
    await expect(comoUsuario(db, c.ana, (tx) => tx.query(`update content_review_comments set body = 'outro' where id = $1`, [id]))).rejects.toThrow(/resolver ou reabrir/)
  })
})

describe('prova visual: RLS', () => {
  it('equipe com acesso à tarefa lê; quem não tem acesso, cliente e visitante não leem nada', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await comentar(db, c)
    expect(await ler(db, c.ana, `select body from content_review_comments`)).toEqual([{ body: 'Trocar a cor do botão' }])
    expect(await ler(db, c.intruso, `select body from content_review_comments`)).toEqual([])
    expect(await ler(db, c.cli, `select body from content_review_comments`)).toEqual([])
    expect(await ler(db, c.outro, `select body from content_review_comments`)).toEqual([])
    expect(await ler(db, null, `select body from content_review_comments`)).toEqual([])
  })

  it('cliente logado não escreve direto (nem como ele mesmo nem em outro cliente)', async () => {
    const db = await criarBanco()
    const c = await base(db)
    for (const u of [c.cli, c.outro]) {
      await expect(
        comoUsuario(db, u, (tx) =>
          tx.query(`insert into content_review_comments (task_id, version_id, author_kind, author_name, body) values ($1, $2, 'cliente', 'Eu', 'oi')`, [c.tarefa, c.versao]),
        ),
      ).rejects.toThrow(/row-level security|permission denied/)
    }
  })

  it('equipe sem acesso à tarefa não responde nem resolve', async () => {
    const db = await criarBanco()
    const c = await base(db)
    const [{ id }] = (await comentar(db, c)).rows
    await expect(
      comoUsuario(db, c.intruso, (tx) =>
        tx.query(`insert into content_review_comments (task_id, version_id, parent_id, author_kind, author_name, body) values ($1, $2, $3, 'equipe', 'x', 'oi')`, [c.tarefa, c.versao, id]),
      ),
    ).rejects.toThrow(/row-level security/)
    const afetadas = await comoUsuario(db, c.intruso, (tx) => tx.query(`update content_review_comments set resolved_at = now() where id = $1`, [id]).then((r) => r.affectedRows ?? 0))
    expect(afetadas).toBe(0)
  })

  it('ninguém apaga comentário pela API', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await comentar(db, c)
    const apagadas = await comoUsuario(db, c.ana, (tx) => tx.query(`delete from content_review_comments`).then((r) => r.affectedRows ?? 0))
    expect(apagadas).toBe(0)
  })
})
