import { Pool, neonConfig } from '@neondatabase/serverless'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from './schema'

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

let instancia: Promise<Db> | undefined

/**
 * Produção: Neon via Pool (WebSocket), porque os serviços usam transações interativas.
 * Desenvolvimento: `DATABASE_URL=pglite:./.dados/banco` usa um Postgres embutido em arquivo.
 */
export function getDb(): Promise<Db> {
  instancia ??= conectar().catch((e) => {
    instancia = undefined
    throw e
  })
  return instancia
}

async function conectar(): Promise<Db> {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não configurada')
  if (url.startsWith('pglite:')) {
    if (process.env.NODE_ENV === 'production') throw new Error('PGlite não é permitido em produção')
    const { conectarPglite } = await import('./pglite-dev')
    return conectarPglite(url.slice('pglite:'.length))
  }
  neonConfig.webSocketConstructor = ws
  return drizzle({ client: new Pool({ connectionString: url }), schema }) as unknown as Db
}
