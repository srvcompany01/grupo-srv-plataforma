import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarUsuario } from '../ajuda/cenario'

const TOKEN = 'A'.repeat(32)

async function base(db: Banco) {
  const cliente = await criarCliente(db, 'Acme')
  const lista = (await db.query<{ id: string; space_id: string }>(`select id, space_id from lists where slug = 'social-conteudo'`)).rows[0]
  const campo = (
    await db.query<{ id: string }>(
      `insert into custom_fields (space_id, name, type, position) values ($1, 'Prazo desejado', 'date', 'a0') returning id`,
      [lista.space_id],
    )
  ).rows[0].id
  await db.query(`insert into list_custom_fields (list_id, field_id, position) values ($1, $2, 'a0')`, [lista.id, campo])
  return { cliente, lista: lista.id, espaco: lista.space_id, campo }
}

const criarFormulario = async (db: Banco, lista: string, cliente: string, fields: unknown) => {
  const resp = await criarUsuario(db, { role: 'membro' })
  return db.query<{ id: string }>(
    `insert into forms (list_id, client_id, assignee_id, name, token, fields) values ($1, $2, $3, 'Briefing', $4, $5) returning id`,
    [lista, cliente, resp, TOKEN, JSON.stringify(fields)],
  )
}

describe('formulários', () => {
  it('enviar cria a tarefa com título, descrição e campo personalizado', async () => {
    const db = await criarBanco()
    const { cliente, lista, campo } = await base(db)
    await criarFormulario(db, lista, cliente, [
      { key: 'title', label: 'O que você precisa?', required: true },
      { key: 'description', label: 'Detalhes', required: false },
      { key: campo, label: 'Prazo desejado', required: false },
    ])
    const id = (
      await db.query<{ id: string }>(`select enviar_formulario($1, $2) as id`, [
        TOKEN,
        JSON.stringify({ title: 'Banner novo', description: 'linha 1\nlinha 2', [campo]: '2026-11-20' }),
      ])
    ).rows[0].id
    expect((await db.query(`select title, client_id, list_id from tasks where id = $1`, [id])).rows).toEqual([
      { title: 'Banner novo', client_id: cliente, list_id: lista },
    ])
    const doc = (await db.query<{ description: { content: unknown[] } }>(`select description from tasks where id = $1`, [id])).rows[0].description
    expect(doc.content).toHaveLength(2)
    expect((await db.query(`select date_value::text as d from task_custom_field_values where task_id = $1`, [id])).rows).toEqual([{ d: '2026-11-20' }])
  })

  it('campo obrigatório vazio e formulário inativo são recusados', async () => {
    const db = await criarBanco()
    const { cliente, lista } = await base(db)
    await criarFormulario(db, lista, cliente, [{ key: 'title', label: 'Título', required: true }])
    await expect(db.query(`select enviar_formulario($1, '{"title":"  "}')`, [TOKEN])).rejects.toThrow(/Preencha: Título/)
    await db.query(`update forms set active = false`)
    await expect(db.query(`select enviar_formulario($1, '{"title":"x"}')`, [TOKEN])).rejects.toThrow(/indisponível/)
    await expect(db.query(`select enviar_formulario('B', '{"title":"x"}')`)).rejects.toThrow(/indisponível/)
  })

  it('respostas fora dos campos pedidos são ignoradas', async () => {
    const db = await criarBanco()
    const { cliente, lista, campo } = await base(db)
    await criarFormulario(db, lista, cliente, [{ key: 'title', label: 'Título', required: true }])
    const id = (await db.query<{ id: string }>(`select enviar_formulario($1, $2) as id`, [TOKEN, JSON.stringify({ title: 'a', [campo]: '2026-01-01', description: 'z' })])).rows[0].id
    expect((await db.query(`select count(*)::int as n from task_custom_field_values where task_id = $1`, [id])).rows).toEqual([{ n: 0 }])
    expect((await db.query(`select description from tasks where id = $1`, [id])).rows).toEqual([{ description: null }])
  })

  it('o formulário precisa pedir o título e só aceita campos da lista', async () => {
    const db = await criarBanco()
    const { cliente, lista } = await base(db)
    await expect(criarFormulario(db, lista, cliente, [{ key: 'description', label: 'D', required: false }])).rejects.toThrow(/título/)
    await expect(
      criarFormulario(db, lista, cliente, [
        { key: 'title', label: 'T', required: true },
        { key: '00000000-0000-0000-0000-000000000000', label: 'Fantasma', required: false },
      ]),
    ).rejects.toThrow(/não pertence/)
  })

  it('só gestor do espaço gerencia; membro lê; ninguém logado chama a função', async () => {
    const db = await criarBanco()
    const { cliente, lista, espaco } = await base(db)
    await criarFormulario(db, lista, cliente, [{ key: 'title', label: 'Título', required: true }])
    const gestor = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, espaco, gestor, 'gestor')
    const membro = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, espaco, membro, 'membro')
    expect(await ler(db, membro, `select name from forms`)).toEqual([{ name: 'Briefing' }])
    await comoUsuario(db, membro, (tx) => tx.query(`update forms set name = 'X'`))
    expect((await db.query(`select name from forms`)).rows).toEqual([{ name: 'Briefing' }])
    await comoUsuario(db, gestor, (tx) => tx.query(`update forms set name = 'Novo'`))
    expect((await db.query(`select name from forms`)).rows).toEqual([{ name: 'Novo' }])
    await expect(comoUsuario(db, gestor, (tx) => tx.query(`select enviar_formulario($1, '{"title":"x"}')`, [TOKEN]))).rejects.toThrow(/permission denied/)
  })
})
