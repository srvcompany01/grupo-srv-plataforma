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

/** O que o servidor do portal faz a cada marcação: grava o comentário e chama a função do aviso (como service_role, aqui o superusuário). */
async function marcar(db: Banco, c: { tarefa: string; versao: string }, texto: string, nome = 'Maria') {
  await db.query(`insert into content_review_comments (task_id, version_id, author_kind, author_name, body) values ($1, $2, 'cliente', $3, $4)`, [c.tarefa, c.versao, nome, texto])
  await db.query(`select registrar_aviso_prova($1, $2, $3, $4)`, [c.tarefa, c.versao, nome, texto])
}
const avisos = (db: Banco, tarefa: string) => db.query<{ body: string; system_key: string | null }>(`select body, system_key from comments where task_id = $1 and system_key is not null order by created_at`, [tarefa]).then((r) => r.rows)

describe('R1: aviso agrupado com identificador estruturado', () => {
  it('a primeira marcação cria o aviso; as seguintes na mesma janela atualizam o mesmo (contando)', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await marcar(db, c, 'Trocar a cor do botão')
    expect(await avisos(db, c.tarefa)).toEqual([{ body: '💬 O cliente (Maria) comentou na prova visual: Trocar a cor do botão', system_key: expect.stringMatching(new RegExp(`^prova:${c.versao}:\\d+$`)) }])
    await marcar(db, c, 'Logo cortado')
    await marcar(db, c, 'Texto pequeno')
    const lista = await avisos(db, c.tarefa)
    expect(lista).toHaveLength(1) // era aqui que o LIKE falhava: um aviso por marcação
    expect(lista[0].body).toBe('💬 O cliente (Maria) fez 3 comentários na prova visual. Último: Texto pequeno')
  })

  it('versões diferentes têm avisos diferentes; a janela seguinte (30 min depois) abre um aviso novo', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await marcar(db, c, 'primeira')
    // Versão 2 do post (a 1 foi respondida e o post voltou a aguardar).
    await db.query(`update content_posts set approval = 'ajuste' where task_id = $1`, [c.tarefa])
    await db.query(`insert into content_responses (version_id, task_id, decision, comment, responder_name) values ($1, $2, 'ajuste', 'x', 'Maria')`, [c.versao, c.tarefa])
    const v2 = (await db.query<{ id: string }>(`insert into content_versions (task_id, number) values ($1, 2) returning id`, [c.tarefa])).rows[0].id
    await db.query(`update content_posts set current_version = 2, approval = 'aguardando' where task_id = $1`, [c.tarefa])
    await marcar(db, { tarefa: c.tarefa, versao: v2 }, 'segunda versão')
    expect(await avisos(db, c.tarefa)).toHaveLength(2)
    // Simula a janela anterior: move a chave do aviso da versão 2 para a janela passada; a próxima marcação cria outro.
    await db.query(`update comments set system_key = 'prova:' || $2 || ':1' where task_id = $1 and system_key like $3`, [c.tarefa, v2, `prova:${v2}:%`])
    await marcar(db, { tarefa: c.tarefa, versao: v2 }, 'depois da janela')
    expect(await avisos(db, c.tarefa)).toHaveLength(3)
  })

  it('duas marcações simultâneas continuam dando um aviso só (índice único)', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await Promise.all([marcar(db, c, 'a'), marcar(db, c, 'b'), marcar(db, c, 'c')])
    expect(await avisos(db, c.tarefa)).toHaveLength(1)
  })

  it('a chave é única por tarefa; a função só roda para o servidor e ignora tarefa sem autor', async () => {
    const db = await criarBanco()
    const c = await base(db)
    await marcar(db, c, 'a')
    const [{ system_key }] = await avisos(db, c.tarefa)
    await expect(db.query(`insert into comments (task_id, author_id, body, system_key) values ($1, $2, 'x', $3)`, [c.tarefa, c.ana, system_key])).rejects.toThrow(/unique|duplicate/)
    await expect(comoUsuario(db, c.ana, (tx) => tx.query(`select registrar_aviso_prova($1, $2, 'x', 'y')`, [c.tarefa, c.versao]))).rejects.toThrow(/permission denied/)
    await db.query(`select registrar_aviso_prova('00000000-0000-4000-8000-000000000000', $1, 'x', 'y')`, [c.versao]) // tarefa inexistente: não faz nada
  })
})
