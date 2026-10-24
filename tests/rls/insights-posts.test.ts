import { describe, expect, it } from 'vitest'
import { criarBanco, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('análise dos posts', () => {
  it('só a equipe lê e grava; nota só bom, mediano ou ruim', async () => {
    const db = await criarBanco()
    const cli = await criarUsuario(db, { role: 'cliente' })
    const membro = await criarUsuario(db, { role: 'membro' })
    expect(await ler(db, membro, `select * from post_insights`)).toEqual([])
    expect(await ler(db, cli, `select * from post_insights`)).toEqual([])
    await expect(db.query(`insert into post_insights (task_id, nota) values (gen_random_uuid(), 'otimo')`)).rejects.toThrow()
  })
})
