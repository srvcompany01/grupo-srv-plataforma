import { Pool, neonConfig } from '@neondatabase/serverless'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from './schema'

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

let instancia: Db | undefined

/** Pool (WebSocket) em vez de HTTP: os serviços precisam de transações interativas. */
export function getDb(): Db {
  if (!instancia) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL não configurada')
    neonConfig.webSocketConstructor = ws
    instancia = drizzle({ client: new Pool({ connectionString: url }), schema })
  }
  return instancia
}
