import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import path from 'node:path'
import * as schema from '@/db/schema'
import type { Db } from '@/db/conexao'

/** `consultas`, se passado, recebe o SQL de cada query (para checar travas que o PGlite não exercita). */
export async function criarDbTeste(consultas?: string[]): Promise<Db> {
  const logger = consultas && { logQuery: (q: string) => void consultas.push(q) }
  const db = drizzle({ client: new PGlite(), schema, logger })
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') })
  return db as unknown as Db
}
