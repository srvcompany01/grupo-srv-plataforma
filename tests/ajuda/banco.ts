import { PGlite, type PGliteInterface, type Transaction } from '@electric-sql/pglite'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const PASTA_MIGRACOES = path.resolve(__dirname, '../../supabase/migrations')

export type Banco = PGliteInterface

let modelo: Promise<PGlite> | undefined

/** PGlite com o shim do Supabase e todas as migrações. A conexão é superusuário (como o service_role). */
export async function criarBanco(): Promise<Banco> {
  modelo ??= montarModelo()
  return (await modelo).clone()
}

async function montarModelo(): Promise<PGlite> {
  const db = new PGlite()
  await db.exec(await readFile(path.resolve(__dirname, 'supabase-shim.sql'), 'utf8'))
  const arquivos = (await readdir(PASTA_MIGRACOES)).filter((a) => a.endsWith('.sql')).sort()
  for (const arquivo of arquivos) {
    try {
      await db.exec(await readFile(path.join(PASTA_MIGRACOES, arquivo), 'utf8'))
    } catch (e) {
      throw new Error(`Migração ${arquivo} falhou: ${(e as Error).message}`)
    }
  }
  return db
}

/** Executa `fn` como o usuário logado `userId` (papel authenticated), dentro de uma transação. */
export function comoUsuario<T>(db: Banco, userId: string, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated')
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: userId, role: 'authenticated' }),
    ])
    return fn(tx)
  })
}

/** Executa `fn` como visitante sem login (papel anon). */
export function comoAnonimo<T>(db: Banco, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec('set local role anon')
    await tx.query(`select set_config('request.jwt.claims', '', true)`)
    return fn(tx)
  })
}

type Params = unknown[]

/** Linhas que `userId` (ou visitante, se null) enxerga com a consulta. */
export function ler<T = Record<string, unknown>>(db: Banco, userId: string | null, sql: string, params: Params = []): Promise<T[]> {
  const fn = (tx: Transaction) => tx.query<T>(sql, params).then((r) => r.rows)
  return userId ? comoUsuario(db, userId, fn) : comoAnonimo(db, fn)
}

/** Executa como `userId`; devolve o número de linhas afetadas. */
export function executar(db: Banco, userId: string, sql: string, params: Params = []): Promise<number> {
  return comoUsuario(db, userId, (tx) => tx.query(sql, params).then((r) => r.affectedRows ?? 0))
}
