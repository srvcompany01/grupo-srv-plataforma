import { describe, expect, it } from 'vitest'
import { criarBanco, executar, ler } from '../ajuda/banco'
import {
  adicionarMembro,
  criarCliente,
  criarUsuario,
  idEspaco,
  vincularUsuarioCliente,
} from '../ajuda/cenario'

const nomes = (rows: { name: string }[]) => rows.map((r) => r.name).sort()

describe('dados iniciais', () => {
  it('migração cria departamentos e cliente interno', async () => {
    const db = await criarBanco()
    const { rows } = await db.query<{ name: string; pai: string | null }>(
      `select s.name, p.name as pai from spaces s left join spaces p on p.id = s.parent_id`,
    )
    // Seis espaços da migração inicial + os três fixos da navegação (Administração, Comercial, Operação) + os dois espaços-área antigos (arquivados).
    expect(nomes(rows)).toEqual(['Administração', 'Comercial', 'Comercial', 'Conteúdo', 'Financeiro', 'Onboarding', 'Operacional', 'Operação', 'Social & Conteúdo', 'Tráfego', 'Tráfego & Performance'])
    for (const filho of ['Conteúdo', 'Tráfego', 'Onboarding']) {
      expect(rows.find((r) => r.name === filho)?.pai).toBe('Operacional')
    }
    const internos = await db.query(`select name from clients where is_internal`)
    expect(internos.rows).toEqual([{ name: 'Grupo SRV (Interno)' }])
  })

  it('segundo cliente interno é rejeitado', async () => {
    const db = await criarBanco()
    await expect(db.query(`insert into clients (name, is_internal) values ('Outro', true)`)).rejects.toThrow()
  })

  it('espaço não pode ter avô (um nível só)', async () => {
    const db = await criarBanco()
    const conteudo = await idEspaco(db, 'Conteúdo')
    await expect(
      db.query(`insert into spaces (name, parent_id, position) values ('Neto', $1, 'a0')`, [conteudo]),
    ).rejects.toThrow()
  })
})

describe('profiles', () => {
  it('perfil nasce inativo como cliente', async () => {
    const db = await criarBanco()
    const { rows } = await db.query<{ id: string }>(
      `insert into auth.users (email, raw_user_meta_data) values ('x@y.com', '{"full_name":"Xis"}') returning id`,
    )
    const perfil = await db.query(`select full_name, role, active from profiles where id = $1`, [rows[0].id])
    expect(perfil.rows).toEqual([{ full_name: 'Xis', role: 'cliente', active: false }])
  })

  it('perfil copia o e-mail do login e acompanha a troca', async () => {
    const db = await criarBanco()
    const id = await criarUsuario(db, { role: 'membro', email: 'Ana@X.com' })
    expect((await db.query(`select email from profiles where id = $1`, [id])).rows).toEqual([{ email: 'ana@x.com' }])
    await db.query(`update auth.users set email = 'nova@x.com' where id = $1`, [id])
    expect((await db.query(`select email from profiles where id = $1`, [id])).rows).toEqual([{ email: 'nova@x.com' }])
  })

  it('usuário não altera o próprio e-mail no perfil', async () => {
    const db = await criarBanco()
    const id = await criarUsuario(db, { role: 'membro', email: 'ana@x.com' })
    await executar(db, id, `update profiles set email = 'hack@x.com' where id = $1`, [id])
    expect((await db.query(`select email from profiles where id = $1`, [id])).rows).toEqual([{ email: 'ana@x.com' }])
  })

  it('membro não altera o próprio papel', async () => {
    const db = await criarBanco()
    const m = await criarUsuario(db, { role: 'membro' })
    await expect(executar(db, m, `update profiles set role = 'admin' where id = $1`, [m])).rejects.toThrow(
      /Somente administradores/,
    )
  })

  it('membro altera o próprio nome', async () => {
    const db = await criarBanco()
    const m = await criarUsuario(db, { role: 'membro' })
    expect(await executar(db, m, `update profiles set full_name = 'Novo' where id = $1`, [m])).toBe(1)
  })

  it('membro não altera o nome de outro', async () => {
    const db = await criarBanco()
    const m = await criarUsuario(db, { role: 'membro' })
    const outro = await criarUsuario(db, { role: 'membro' })
    expect(await executar(db, m, `update profiles set full_name = 'X' where id = $1`, [outro])).toBe(0)
  })

  it('admin altera papel de outro', async () => {
    const db = await criarBanco()
    const a = await criarUsuario(db, { role: 'admin' })
    const m = await criarUsuario(db, { role: 'membro' })
    expect(await executar(db, a, `update profiles set role = 'gestor' where id = $1`, [m])).toBe(1)
  })

  it('todo usuário lê o próprio perfil', async () => {
    const db = await criarBanco()
    const c = await criarUsuario(db, { role: 'cliente' })
    const inativo = await criarUsuario(db, { role: 'membro', ativo: false })
    expect(await ler(db, c, `select id from profiles`)).toEqual([{ id: c }])
    expect(await ler(db, inativo, `select id from profiles`)).toEqual([{ id: inativo }])
  })

  it('cliente não lê perfis da equipe nesta fase', async () => {
    const db = await criarBanco()
    await criarUsuario(db, { role: 'admin' })
    const c = await criarUsuario(db, { role: 'cliente' })
    expect(await ler(db, c, `select id from profiles where id <> $1`, [c])).toEqual([])
  })

  it('equipe lê todos os perfis da equipe', async () => {
    const db = await criarBanco()
    const a = await criarUsuario(db, { role: 'admin' })
    const m = await criarUsuario(db, { role: 'membro' })
    const lidos = await ler<{ id: string }>(db, m, `select id from profiles`)
    expect(lidos.map((r) => r.id).sort()).toEqual([a, m].sort())
  })

  it('usuário inativo não lê nada', async () => {
    const db = await criarBanco()
    const m = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, await idEspaco(db, 'Comercial'), m, 'membro')
    expect((await ler(db, m, `select id from spaces`)).length).toBeGreaterThan(0)
    expect((await ler(db, m, `select id from clients`)).length).toBeGreaterThan(0)
    await db.query(`update profiles set active = false where id = $1`, [m])
    expect(await ler(db, m, `select id from spaces`)).toEqual([])
    expect(await ler(db, m, `select id from clients`)).toEqual([])
    expect(await ler(db, m, `select id from profiles`)).toEqual([{ id: m }])
  })
})

describe('spaces e space_members', () => {
  it('membro vê só seus espaços (e o pai)', async () => {
    const db = await criarBanco()
    const m = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, await idEspaco(db, 'Conteúdo'), m, 'membro')
    // Os espaços fixos (team_open) são visíveis a toda a equipe, além dos espaços de que a pessoa é membro.
    expect(nomes(await ler(db, m, `select name from spaces`))).toEqual(['Administração', 'Comercial', 'Conteúdo', 'Operacional', 'Operação'])
  })

  it('membro do espaço-pai vê os filhos', async () => {
    const db = await criarBanco()
    const m = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, await idEspaco(db, 'Operacional'), m, 'membro')
    expect(nomes(await ler(db, m, `select name from spaces`))).toEqual([
      'Administração',
      'Comercial',
      'Conteúdo',
      'Onboarding',
      'Operacional',
      'Operação',
      'Tráfego',
    ])
  })

  it('admin vê todos os espaços', async () => {
    const db = await criarBanco()
    const a = await criarUsuario(db, { role: 'admin' })
    expect(await ler(db, a, `select id from spaces`)).toHaveLength(11)
  })

  it('espaços fixos: equipe acessa sem ser membro, e só gestor (papel) gerencia', async () => {
    const db = await criarBanco()
    const m = await criarUsuario(db, { role: 'membro' })
    const g = await criarUsuario(db, { role: 'gestor' })
    const [{ id: area }] = await ler<{ id: string }>(db, m, `select id from spaces where slug = 'operacao'`)
    expect(await ler(db, m, `select is_space_member('${area}') as ok`)).toEqual([{ ok: true }])
    expect(await ler(db, m, `select is_space_manager('${area}') as ok`)).toEqual([{ ok: false }])
    expect(await ler(db, g, `select is_space_manager('${area}') as ok`)).toEqual([{ ok: true }])
    // Espaço comum continua exigindo ser membro.
    const comum = await idEspaco(db, 'Comercial')
    expect(await ler(db, m, `select is_space_member('${comum}') as ok`)).toEqual([{ ok: false }])
  })

  it('só admin cria espaço', async () => {
    const db = await criarBanco()
    const a = await criarUsuario(db, { role: 'admin' })
    const g = await criarUsuario(db, { role: 'gestor' })
    await adicionarMembro(db, await idEspaco(db, 'Comercial'), g, 'gestor')
    expect(await executar(db, a, `insert into spaces (name, position) values ('Novo', 'a0')`)).toBe(1)
    await expect(executar(db, g, `insert into spaces (name, position) values ('Outro', 'a0')`)).rejects.toThrow(
      /row-level security/,
    )
  })

  it('gestor adiciona membro no seu espaço e não em outro', async () => {
    const db = await criarBanco()
    const g = await criarUsuario(db, { role: 'gestor' })
    const m = await criarUsuario(db, { role: 'membro' })
    const conteudo = await idEspaco(db, 'Conteúdo')
    const comercial = await idEspaco(db, 'Comercial')
    await adicionarMembro(db, conteudo, g, 'gestor')
    const sql = `insert into space_members (space_id, user_id, role) values ($1, $2, 'membro')`
    expect(await executar(db, g, sql, [conteudo, m])).toBe(1)
    await expect(executar(db, g, sql, [comercial, m])).rejects.toThrow(/row-level security/)
  })

  it('gestor remove membro do seu espaço', async () => {
    const db = await criarBanco()
    const g = await criarUsuario(db, { role: 'gestor' })
    const m = await criarUsuario(db, { role: 'membro' })
    const conteudo = await idEspaco(db, 'Conteúdo')
    await adicionarMembro(db, conteudo, g, 'gestor')
    await adicionarMembro(db, conteudo, m, 'membro')
    expect(await executar(db, g, `delete from space_members where user_id = $1`, [m])).toBe(1)
  })

  it('gestor não promove ninguém a gestor', async () => {
    const db = await criarBanco()
    const g = await criarUsuario(db, { role: 'gestor' })
    const m = await criarUsuario(db, { role: 'membro' })
    const conteudo = await idEspaco(db, 'Conteúdo')
    await adicionarMembro(db, conteudo, g, 'gestor')
    await expect(
      executar(db, g, `insert into space_members (space_id, user_id, role) values ($1, $2, 'gestor')`, [conteudo, m]),
    ).rejects.toThrow(/row-level security/)
    await adicionarMembro(db, conteudo, m, 'membro')
    expect(
      await executar(db, g, `update space_members set role = 'gestor' where user_id = $1`, [m]).catch(() => 0),
    ).toBe(0)
  })

  it('membro vê os colegas do seu espaço e não os de outro', async () => {
    const db = await criarBanco()
    const m1 = await criarUsuario(db, { role: 'membro' })
    const m2 = await criarUsuario(db, { role: 'membro' })
    const m3 = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, await idEspaco(db, 'Conteúdo'), m1, 'membro')
    await adicionarMembro(db, await idEspaco(db, 'Conteúdo'), m2, 'membro')
    await adicionarMembro(db, await idEspaco(db, 'Comercial'), m3, 'membro')
    const ids = (await ler<{ user_id: string }>(db, m1, `select user_id from space_members`)).map((r) => r.user_id)
    expect(ids.sort()).toEqual([m1, m2].sort())
  })

  it('cliente não pode ser membro de espaço', async () => {
    const db = await criarBanco()
    const c = await criarUsuario(db, { role: 'cliente' })
    await expect(adicionarMembro(db, await idEspaco(db, 'Conteúdo'), c, 'membro')).rejects.toThrow()
  })
})

describe('clients e client_users', () => {
  it('equipe lê todos os clientes', async () => {
    const db = await criarBanco()
    await criarCliente(db, 'A')
    const m = await criarUsuario(db, { role: 'membro' })
    expect(await ler(db, m, `select id from clients`)).toHaveLength(2)
  })

  it('gestor cria cliente', async () => {
    const db = await criarBanco()
    const g = await criarUsuario(db, { role: 'gestor' })
    expect(await executar(db, g, `insert into clients (name) values ('Novo')`)).toBe(1)
  })

  it('membro não cria cliente', async () => {
    const db = await criarBanco()
    const m = await criarUsuario(db, { role: 'membro' })
    await expect(executar(db, m, `insert into clients (name) values ('Novo')`)).rejects.toThrow(/row-level security/)
  })

  it('cliente lê só o próprio cliente', async () => {
    const db = await criarBanco()
    const a = await criarCliente(db, 'A')
    const b = await criarCliente(db, 'B')
    const ua = await criarUsuario(db, { role: 'cliente' })
    const ub = await criarUsuario(db, { role: 'cliente' })
    await vincularUsuarioCliente(db, ua, a)
    await vincularUsuarioCliente(db, ub, b)
    expect(await ler(db, ua, `select id from clients`)).toEqual([{ id: a }])
    expect(await ler(db, ub, `select id from clients`)).toEqual([{ id: b }])
  })

  it('cliente não altera o próprio cadastro', async () => {
    const db = await criarBanco()
    const a = await criarCliente(db, 'A')
    const ua = await criarUsuario(db, { role: 'cliente' })
    await vincularUsuarioCliente(db, ua, a)
    expect(await executar(db, ua, `update clients set name = 'X'`)).toBe(0)
  })

  it('cliente não lê spaces, space_members nem client_users de outros', async () => {
    const db = await criarBanco()
    const a = await criarCliente(db, 'A')
    const b = await criarCliente(db, 'B')
    const ua = await criarUsuario(db, { role: 'cliente' })
    const ub = await criarUsuario(db, { role: 'cliente' })
    await vincularUsuarioCliente(db, ua, a)
    await vincularUsuarioCliente(db, ub, b)
    const m = await criarUsuario(db, { role: 'membro' })
    await adicionarMembro(db, await idEspaco(db, 'Conteúdo'), m, 'membro')
    expect(await ler(db, ua, `select id from spaces`)).toEqual([])
    expect(await ler(db, ua, `select user_id from space_members`)).toEqual([])
    expect(await ler(db, ua, `select user_id from client_users where user_id <> $1`, [ua])).toEqual([])
  })

  it('membro da equipe não pode ser vinculado a cliente', async () => {
    const db = await criarBanco()
    const a = await criarCliente(db, 'A')
    const m = await criarUsuario(db, { role: 'membro' })
    await expect(vincularUsuarioCliente(db, m, a)).rejects.toThrow()
  })

  it('só admin vincula usuário a cliente', async () => {
    const db = await criarBanco()
    const a = await criarCliente(db, 'A')
    const g = await criarUsuario(db, { role: 'gestor' })
    const c = await criarUsuario(db, { role: 'cliente' })
    await expect(
      executar(db, g, `insert into client_users (user_id, client_id) values ($1, $2)`, [c, a]),
    ).rejects.toThrow(/row-level security/)
  })
})

describe('anônimo', () => {
  it('anônimo não lê nada', async () => {
    const db = await criarBanco()
    for (const t of ['profiles', 'spaces', 'space_members', 'clients', 'client_users']) {
      expect(await ler(db, null, `select * from ${t}`), t).toEqual([])
    }
  })
})
