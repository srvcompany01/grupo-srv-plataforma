import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import * as schema from './schema'
import type { Db } from './conexao'

/** Só para desenvolvimento local, sem Neon. */
export async function conectarPglite(pasta: string): Promise<Db> {
  await mkdir(path.dirname(path.resolve(pasta)), { recursive: true })
  const db = drizzle({ client: new PGlite(pasta), schema })
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') })
  return db as unknown as Db
}
