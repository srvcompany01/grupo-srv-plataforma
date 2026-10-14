import type { Banco } from './banco'

export type Papel = 'admin' | 'gestor' | 'membro' | 'cliente'

let seq = 0

/** Cria um usuário no Auth simulado e define papel/ativo no perfil (como faria o admin ao convidar). */
export async function criarUsuario(
  db: Banco,
  opts: { role: Papel; ativo?: boolean; nome?: string; email?: string },
): Promise<string> {
  const email = opts.email ?? `usuario${++seq}@teste.com`
  const nome = opts.nome ?? email
  const { rows } = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [email, JSON.stringify({ full_name: nome })],
  )
  const id = rows[0].id
  await db.query(`update public.profiles set role = $2, active = $3, full_name = $4 where id = $1`, [
    id,
    opts.role,
    opts.ativo ?? true,
    nome,
  ])
  return id
}

async function inserir(db: Banco, sql: string, params: unknown[]): Promise<string> {
  const { rows } = await db.query<{ id: string }>(sql, params)
  return rows[0].id
}

export function criarEspaco(db: Banco, nome: string, parentId?: string): Promise<string> {
  return inserir(db, `insert into public.spaces (name, parent_id, position) values ($1, $2, 'a0') returning id`, [
    nome,
    parentId ?? null,
  ])
}

export async function adicionarMembro(db: Banco, spaceId: string, userId: string, role: 'gestor' | 'membro') {
  await db.query(`insert into public.space_members (space_id, user_id, role) values ($1, $2, $3)`, [spaceId, userId, role])
}

export function criarCliente(db: Banco, nome: string): Promise<string> {
  return inserir(db, `insert into public.clients (name) values ($1) returning id`, [nome])
}

export async function vincularUsuarioCliente(db: Banco, userId: string, clientId: string) {
  await db.query(`insert into public.client_users (user_id, client_id) values ($1, $2)`, [userId, clientId])
}

/** Id de um espaço da migração inicial (ex.: 'Conteúdo'). Os espaços fixos de navegação (com slug) têm função própria. */
export function idEspaco(db: Banco, nome: string): Promise<string> {
  return inserir(db, `select id from public.spaces where name = $1 and slug is null`, [nome])
}

/** Id de um espaço fixo da navegação (Administração, Comercial, Operação) pelo slug. */
export function idEspacoFixo(db: Banco, slug: string): Promise<string> {
  return inserir(db, `select id from public.spaces where slug = $1`, [slug])
}

export function idInterno(db: Banco): Promise<string> {
  return inserir(db, `select id from public.clients where is_internal`, [])
}

export function criarPasta(db: Banco, spaceId: string | null, nome = 'Pasta'): Promise<string> {
  return inserir(db, `insert into public.folders (space_id, name, position) values ($1, $2, 'a0') returning id`, [
    spaceId,
    nome,
  ])
}

export function criarLista(
  db: Banco,
  opts: { spaceId: string | null; clientId: string; folderId?: string; nome?: string; mes?: string },
): Promise<string> {
  return inserir(
    db,
    `insert into public.lists (space_id, client_id, folder_id, name, reference_month, position)
     values ($1, $2, $3, $4, $5, 'a0') returning id`,
    [opts.spaceId, opts.clientId, opts.folderId ?? null, opts.nome ?? 'Lista', opts.mes ?? null],
  )
}

export async function statusDaLista(
  db: Banco,
  listId: string,
): Promise<{ id: string; name: string; category: string; color: string }[]> {
  const { rows } = await db.query<{ id: string; name: string; category: string; color: string }>(
    `select id, name, category, color from public.list_statuses where list_id = $1 order by position`,
    [listId],
  )
  return rows
}

/** Tarefa + responsáveis na mesma transação (o banco exige ao menos um responsável no commit). */
export function criarTarefa(
  db: Banco,
  opts: { listId: string; responsaveis: string[]; titulo?: string; parentId?: string; statusId?: string },
): Promise<string> {
  return db.transaction(async (tx) => {
    const { rows } = await tx.query<{ id: string }>(
      `insert into public.tasks (list_id, title, parent_task_id, status_id, position)
       values ($1, $2, $3, $4, 'a0') returning id`,
      [opts.listId, opts.titulo ?? 'Tarefa', opts.parentId ?? null, opts.statusId ?? null],
    )
    for (const u of opts.responsaveis) {
      await tx.query(`insert into public.task_assignees (task_id, user_id) values ($1, $2)`, [rows[0].id, u])
    }
    return rows[0].id
  })
}
