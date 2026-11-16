import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { describe, expect, it, vi } from 'vitest'
import type { Supabase } from '@/infra/supabase/servidor'
import { criarServidorMcp } from '@/mcp/servidor'
import { comoUsuario, criarBanco, type Banco } from '../ajuda/banco'
import { adicionarMembro, criarCliente, criarLista, criarTarefa, criarUsuario, idEspaco, vincularUsuarioCliente } from '../ajuda/cenario'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

/** Cliente Supabase mínimo que roda as funções (rpc) no banco de verdade como a pessoa logada, com a RLS valendo. */
function supabaseComo(db: Banco, userId: string): Supabase {
  return {
    rpc: async (nome: string, args: Record<string, unknown> = {}) => {
      const chaves = Object.keys(args).filter((k) => args[k] !== undefined)
      const sql = `select * from ${nome}(${chaves.map((k, i) => `${k} => $${i + 1}`).join(', ')})`
      try {
        const rows = await comoUsuario(db, userId, (tx) => tx.query(sql, chaves.map((k) => args[k])).then((r) => r.rows))
        return { data: rows, error: null }
      } catch (e) {
        return { data: null, error: { message: (e as Error).message } }
      }
    },
  } as unknown as Supabase
}

async function cenario(db: Banco) {
  const espaco = await idEspaco(db, 'Conteúdo')
  const aurora = await criarCliente(db, 'Aurora')
  const lista = await criarLista(db, { spaceId: espaco, clientId: aurora })
  const ana = await criarUsuario(db, { role: 'membro' })
  const gil = await criarUsuario(db, { role: 'gestor' })
  const admin = await criarUsuario(db, { role: 'admin' })
  const cli = await criarUsuario(db, { role: 'cliente' })
  const inativo = await criarUsuario(db, { role: 'membro' })
  for (const u of [ana, inativo]) await adicionarMembro(db, espaco, u, 'membro')
  await adicionarMembro(db, espaco, gil, 'gestor')
  await vincularUsuarioCliente(db, cli, aurora)
  const tarefa = await criarTarefa(db, { listId: lista, responsaveis: [ana, inativo], titulo: 'Roteiro' })
  await comoUsuario(db, ana, (tx) => tx.query(`select lancar_tempo($1, '2026-11-10', 60, 'da Ana')`, [tarefa]))
  await comoUsuario(db, inativo, (tx) => tx.query(`select lancar_tempo($1, '2026-11-10', 30, 'do inativo')`, [tarefa]))
  await db.query(`update profiles set active = false where id = $1`, [inativo])
  return { ana, gil, admin, cli, inativo }
}

async function chamar(db: Banco, userId: string, papel: string, ferramenta: string, args: Record<string, unknown>) {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await criarServidorMcp({ sb: supabaseComo(db, userId), userId, nome: 'Teste', papel, escopo: 'write' }).connect(b)
  const cli = new Client({ name: 't', version: '1' })
  await cli.connect(a)
  return cli.callTool({ name: ferramenta, arguments: args })
}

describe('MCP: horas de outras pessoas (A2)', () => {
  it('resumo_tempo_faturavel só responde a admin e gestor; membro, cliente e desativado recebem erro', async () => {
    const db = await criarBanco()
    const { ana, gil, admin, cli, inativo } = await cenario(db)
    const pedido = { de: '2026-11-01', ate: '2026-11-30', detalhe: true }
    for (const [u, papel] of [[gil, 'gestor'], [admin, 'admin']] as const) {
      const r = await chamar(db, u, papel, 'resumo_tempo_faturavel', pedido)
      expect(r.isError).toBeFalsy()
      const texto = JSON.stringify(r.content)
      expect(texto).toContain('da Ana')
      expect(texto).toContain('do inativo')
    }
    for (const [u, papel] of [[ana, 'membro'], [cli, 'cliente'], [inativo, 'membro']] as const) {
      const r = await chamar(db, u, papel, 'resumo_tempo_faturavel', pedido)
      expect(r.isError).toBe(true)
      expect(JSON.stringify(r.content)).not.toContain('da Ana')
      expect(JSON.stringify(r.content)).not.toContain('do inativo')
    }
  })

  it('definir_tempo_faturavel: o membro não altera o registro de outra pessoa', async () => {
    const db = await criarBanco()
    const { ana, gil, inativo } = await cenario(db)
    const idInativo = (await db.query<{ id: string }>(`select id from time_entries where note = 'do inativo'`)).rows[0].id
    const como = (u: string) => chamar(db, u, 'membro', 'definir_tempo_faturavel', { registroId: idInativo, faturavel: false })
    expect((await como(ana)).isError).toBe(true)
    expect((await como(inativo)).isError).toBe(true) // desativado também não
    expect((await chamar(db, gil, 'gestor', 'definir_tempo_faturavel', { registroId: idInativo, faturavel: false })).isError).toBeFalsy()
  })
})
