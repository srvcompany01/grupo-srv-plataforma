import { describe, expect, it } from 'vitest'
import { criarBanco, executar } from '../ajuda/banco'
import { criarEspaco, criarUsuario } from '../ajuda/cenario'

describe('espaço de projetos', () => {
  it('só o admin marca, e só um espaço pode ser o de projetos', async () => {
    const db = await criarBanco()
    const admin = await criarUsuario(db, { role: 'admin' })
    const gestor = await criarUsuario(db, { role: 'gestor' })
    const a = await criarEspaco(db, 'Projetos')
    const b = await criarEspaco(db, 'Outro')
    expect(await executar(db, gestor, `update spaces set is_projects = true where id = $1`, [a])).toBe(0)
    expect(await executar(db, admin, `update spaces set is_projects = true where id = $1`, [a])).toBe(1)
    await expect(executar(db, admin, `update spaces set is_projects = true where id = $1`, [b])).rejects.toThrow(/duplicate|unique/)
  })
})
