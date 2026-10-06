import type { PGlite } from '@electric-sql/pglite'

export type Papel = 'admin' | 'gestor' | 'membro' | 'cliente'

let seq = 0

/** Cria um usuário no Auth simulado. */
export async function criarUsuario(
  db: PGlite,
  opts: { role: Papel; ativo?: boolean; nome?: string; email?: string },
): Promise<string> {
  const email = opts.email ?? `usuario${++seq}@teste.com`
  const { rows } = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [email, JSON.stringify({ full_name: opts.nome ?? email })],
  )
  return rows[0].id
}
