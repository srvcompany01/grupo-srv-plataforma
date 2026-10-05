import { date, integer, pgTable, text, timestamp, uniqueIndex, uuid, boolean, bigint, index } from 'drizzle-orm/pg-core'
import type { Decisao, Formato, Status, TipoMidia } from '@/dominio/tipos'

const criadoEm = () => timestamp('criado_em', { withTimezone: true }).notNull().defaultNow()

export const clientes = pgTable(
  'clientes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nome: text('nome').notNull(),
    token: text('token').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex('clientes_token_idx').on(t.token)],
)

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clienteId: uuid('cliente_id').notNull().references(() => clientes.id),
    dataPrevista: date('data_prevista', { mode: 'string' }).notNull(),
    formato: text('formato').$type<Formato>().notNull(),
    status: text('status').$type<Status>().notNull().default('rascunho'),
    criadoEm: criadoEm(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('posts_cliente_idx').on(t.clienteId)],
)

export const versoes = pgTable(
  'versoes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').notNull().references(() => posts.id),
    numero: integer('numero').notNull(),
    ideia: text('ideia').notNull().default(''),
    objetivo: text('objetivo').notNull().default(''),
    legenda: text('legenda').notNull().default(''),
    criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('versoes_post_numero_idx').on(t.postId, t.numero)],
)

export const midias = pgTable(
  'midias',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    versaoId: uuid('versao_id').notNull().references(() => versoes.id),
    ordem: integer('ordem').notNull(),
    tipo: text('tipo').$type<TipoMidia>().notNull(),
    chaveR2: text('chave_r2').notNull(),
    nomeOriginal: text('nome_original').notNull(),
    tamanhoBytes: bigint('tamanho_bytes', { mode: 'number' }).notNull(),
  },
  (t) => [index('midias_versao_idx').on(t.versaoId)],
)

export const respostas = pgTable(
  'respostas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    versaoId: uuid('versao_id').notNull().references(() => versoes.id),
    decisao: text('decisao').$type<Decisao>().notNull(),
    comentario: text('comentario').notNull().default(''),
    nomeRespondente: text('nome_respondente').notNull(),
    criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('respostas_versao_idx').on(t.versaoId)],
)

export type Cliente = typeof clientes.$inferSelect
export type Post = typeof posts.$inferSelect
export type Versao = typeof versoes.$inferSelect
export type Midia = typeof midias.$inferSelect
export type Resposta = typeof respostas.$inferSelect
