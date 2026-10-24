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

it('schema publicado: estrutura_anuncios_cliente declara campanhaId (texto), status e pagina; ids de anúncio são sempre texto', async () => {
  const { tools } = await (await conectar('write')).listTools()
  const props = (nome: string) => (tools.find((t) => t.name === nome)?.inputSchema.properties ?? {}) as Record<string, { type?: string; enum?: string[]; pattern?: string }>
  const e = props('estrutura_anuncios_cliente')
  expect(e.campanhaId).toMatchObject({ type: 'string', pattern: '^\\d{1,25}$' })
  expect(e.status).toMatchObject({ type: 'string', enum: ['ativos', 'pausados', 'todos'] })
  expect(e.pagina).toMatchObject({ type: 'integer' })
  for (const [ferramenta, campo] of [['pausar_anuncio', 'objetoId'], ['propor_alteracao_anuncio', 'objetoId'], ['adicionar_anuncio_meta', 'conjuntoId'], ['criar_campanha_meta', 'formularioId']] as const) {
    expect(props(ferramenta)[campo]?.type, `${ferramenta}.${campo}`).toBe('string')
  }
})

it('contrato: toda ferramenta publica exatamente os parâmetros e a descrição da definição usada pelo handler', async () => {
  const { tools } = await (await conectar('write')).listTools()
  for (const f of FERRAMENTAS) {
    const t = tools.find((x) => x.name === f.nome)!
    expect(Object.keys(t.inputSchema.properties ?? {}).sort(), f.nome).toEqual(Object.keys(f.entrada).sort())
    expect(t.description, f.nome).toBe(f.descricao)
  }
})

it('contrato: todo id de campanha, conjunto, anúncio, formulário ou post da Meta/Google é texto', async () => {
  const { tools } = await (await conectar('write')).listTools()
  for (const t of tools) {
    for (const [campo, def] of Object.entries((t.inputSchema.properties ?? {}) as Record<string, { type?: string }>)) {
      if (/^(campanhaId|conjuntoId|objetoId|formularioId|comentarioId|anuncioId)$/.test(campo)) expect(def.type, `${t.name}.${campo}`).toBe('string')
    }
  }
})

it('P2-2: atualizar_lancamento converte reais em centavos e só manda o que mudou', async () => {
  const chamadas: Record<string, unknown>[] = []
  const sb = { from: () => ({ update: (c: Record<string, unknown>) => { chamadas.push(c); return { eq: () => ({ select: async () => ({ data: [{ id: 'x' }], error: null }) }) } } }) } as unknown as Supabase
  const [a, b] = InMemoryTransport.createLinkedPair()
  await criarServidorMcp({ sb, userId: 'u1', nome: 'Ana', papel: 'admin', escopo: 'write' }).connect(b)
  const cli = new Client({ name: 't', version: '1' })
  await cli.connect(a)
  const r = await cli.callTool({ name: 'atualizar_lancamento', arguments: { lancamentoId: '00000000-0000-4000-8000-000000000001', pago: true, valor: 1500.5 } })
  expect(r.isError).toBeFalsy()
  expect(chamadas).toEqual([{ paid: true, amount_cents: 150050 }])
  const vazio = await cli.callTool({ name: 'atualizar_lancamento', arguments: { lancamentoId: '00000000-0000-4000-8000-000000000001' } })
  expect(vazio.isError).toBe(true)
})
