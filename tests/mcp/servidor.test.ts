import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { expect, it, vi } from 'vitest'
import type { Supabase } from '@/infra/supabase/servidor'
import { FERRAMENTAS, type Contexto } from '@/mcp/ferramentas'
import { criarServidorMcp } from '@/mcp/servidor'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

async function conectar(escopo: Contexto['escopo']) {
  const ctx: Contexto = { sb: {} as Supabase, userId: 'u1', nome: 'Ana', papel: 'membro', escopo }
  const [a, b] = InMemoryTransport.createLinkedPair()
  await criarServidorMcp(ctx).connect(b)
  const cliente = new Client({ name: 'teste', version: '1' })
  await cliente.connect(a)
  return cliente
}

it('nomes das ferramentas são únicos e toda escrita está marcada', () => {
  const nomes = FERRAMENTAS.map((f) => f.nome)
  expect(new Set(nomes).size).toBe(nomes.length)
  for (const f of FERRAMENTAS.filter((x) => /^(criar|atualizar|definir|comentar)/.test(x.nome))) expect(f.escrita, f.nome).toBe(true)
  for (const f of FERRAMENTAS.filter((x) => /^(listar|buscar|descrever)/.test(x.nome))) expect(f.escrita, f.nome).toBe(false)
})

it('token de leitura não enxerga ferramentas de escrita', async () => {
  const leitura = (await (await conectar('read')).listTools()).tools.map((t) => t.name)
  const escrita = (await (await conectar('write')).listTools()).tools.map((t) => t.name)
  expect(leitura).toEqual(FERRAMENTAS.filter((f) => !f.escrita).map((f) => f.nome))
  expect(escrita).toEqual(FERRAMENTAS.map((f) => f.nome))
  expect(leitura).not.toContain('criar_tarefa')
})

it('descrever_plataforma responde com as regras e lista as ferramentas disponíveis', async () => {
  const r = await (await conectar('write')).callTool({ name: 'descrever_plataforma', arguments: {} })
  const texto = (r.content as { text: string }[])[0].text
  const dados = JSON.parse(texto)
  expect(dados.voce).toEqual({ nome: 'Ana', papel: 'membro', permissao: 'leitura e escrita' })
  expect(dados.ferramentas.map((f: { nome: string }) => f.nome)).toContain('criar_tarefas_em_lote')
  expect(dados.tiposDeCampo.length).toBeGreaterThan(10)
})

it('entrada inválida é recusada antes de tocar no banco', async () => {
  const r = await (await conectar('write')).callTool({ name: 'criar_tarefa', arguments: { listaId: 'não-é-uuid', titulo: 'x' } })
  expect(r.isError).toBe(true)
})
