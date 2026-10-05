import { and, asc, eq, sql } from 'drizzle-orm'
import type { Db } from '@/db/conexao'
import { clientes, posts, type Cliente } from '@/db/schema'
import { ErroRegra } from '@/dominio/erros'
import { exigirUuid } from '@/dominio/ids'
import { gerarToken } from '@/dominio/token'

export async function criarCliente(db: Db, nome: string): Promise<Cliente> {
  const limpo = nome.trim()
  if (!limpo) throw new ErroRegra('nome_obrigatorio', 'Informe o nome do cliente.')
  const [c] = await db.insert(clientes).values({ nome: limpo, token: gerarToken() }).returning()
  return c
}

export async function listarClientes(db: Db): Promise<(Cliente & { pendentes: number })[]> {
  return db
    .select({
      id: clientes.id,
      nome: clientes.nome,
      token: clientes.token,
      ativo: clientes.ativo,
      criadoEm: clientes.criadoEm,
      pendentes: sql<number>`count(${posts.id})::int`,
    })
    .from(clientes)
    .leftJoin(posts, and(eq(posts.clienteId, clientes.id), eq(posts.status, 'aguardando')))
    .groupBy(clientes.id)
    .orderBy(asc(clientes.nome))
}

export async function buscarCliente(db: Db, id: string): Promise<Cliente> {
  exigirUuid(id)
  const [c] = await db.select().from(clientes).where(eq(clientes.id, id))
  if (!c) throw new ErroRegra('nao_encontrado', 'Cliente não encontrado.')
  return c
}

/** Null para token inexistente ou cliente inativo — quem chama não distingue. */
export async function buscarClientePorToken(db: Db, token: string): Promise<Cliente | null> {
  if (!token) return null
  const [c] = await db
    .select()
    .from(clientes)
    .where(and(eq(clientes.token, token), eq(clientes.ativo, true)))
  return c ?? null
}

export async function regenerarToken(db: Db, id: string): Promise<string> {
  exigirUuid(id)
  const token = gerarToken()
  const r = await db.update(clientes).set({ token }).where(eq(clientes.id, id)).returning({ id: clientes.id })
  if (r.length === 0) throw new ErroRegra('nao_encontrado', 'Cliente não encontrado.')
  return token
}

export async function definirAtivo(db: Db, id: string, ativo: boolean): Promise<void> {
  await db.update(clientes).set({ ativo }).where(eq(clientes.id, id))
}
