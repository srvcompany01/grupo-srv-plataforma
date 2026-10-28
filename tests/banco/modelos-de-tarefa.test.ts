import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('modelos de tarefa', () => {
  it('a equipe vê todos; só quem criou (ou o admin) exclui; cliente não acessa', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    const adm = await criarUsuario(db, { role: 'admin' })
    const cli = await criarUsuario(db, { role: 'cliente' })
    await comoUsuario(db, ana, (tx) => tx.query(`insert into task_templates (name, title, subtasks) values ('Post', 'Post do mês', array['Roteiro','Arte'])`))
    expect(await ler(db, bia, `select name, subtasks from task_templates`)).toEqual([{ name: 'Post', subtasks: ['Roteiro', 'Arte'] }])
    expect(await ler(db, cli, `select name from task_templates`)).toEqual([])
    await comoUsuario(db, bia, (tx) => tx.query(`delete from task_templates`))
    expect(await ler(db, ana, `select name from task_templates`)).toHaveLength(1)
    await comoUsuario(db, adm, (tx) => tx.query(`delete from task_templates`))
    expect(await ler(db, ana, `select name from task_templates`)).toHaveLength(0)
  })

  it('rejeita nome vazio e gravar em nome de outra pessoa', async () => {
    const db = await criarBanco()
    const ana = await criarUsuario(db, { role: 'membro' })
    const bia = await criarUsuario(db, { role: 'membro' })
    await expect(comoUsuario(db, ana, (tx) => tx.query(`insert into task_templates (name, title) values (' ', 'X')`))).rejects.toThrow(/check/)
    await expect(comoUsuario(db, ana, (tx) => tx.query(`insert into task_templates (name, title, created_by) values ('X', 'X', $1)`, [bia]))).rejects.toThrow(/row-level security/)
  })
})
