import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { expect, it, vi } from 'vitest'
import type { Supabase } from '@/infra/supabase/servidor'
import { criarServidorMcp } from '@/mcp/servidor'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/servicos/meta-anuncios', () => ({
  anunciosAtivos: async () => ({ anuncios: [{ id: 'a', nome: 'Ativo', campanha: 'C', conjunto: 'J', objetivo: 'OUTCOME_ENGAGEMENT', titulo: '', texto: '', imagem: null, video: false, link: null, impressoes: 10000, alcance: 0, cliques: 100, cliquesLink: 80, ctr: 1, cpm: 0, cpc: 0, gasto: 381.98, frequencia: 1, visualizacoesVideo: 0, resultados: 20, custoPorResultado: 19.1, qualidade: null, engajamento: null, conversao: null, papel: 'lead', desempenho: 'medio', motivos: [] }] }),
  resumoMetaPorTipo: async () => ({ captacao: { gasto: 774.46, leads: 40 }, reconhecimento: { gasto: 0, visitasPerfil: 0 } }),
  totaisDoPeriodoMeta: async () => ({ gasto: 774.46, cliques: 300, cliquesLink: 250, impressoes: 40000, formularios: 0, conversas: 40, site: 0 }),
}))

const CLIENTE = { id: 'b056f24c-b59f-4b53-853c-c1a034f16bba', name: 'Clínica do Sono', color: '#000', legal_name: null, document: null, email: null, phone: null, status: 'ativo', is_internal: false, gallery_position: null, meta_page_id: null, meta_ad_account_id: '123', google_ads_customer_id: null, google_location: null, google_location_title: null, whatsapp: null, google_place_id: null }

it('R0-3: anuncios_meta_cliente traz o gasto da conta inteira (com as campanhas pausadas no período) além dos ativos', async () => {
  const consulta = { select: () => consulta, order: () => consulta, then: (ok: (r: unknown) => unknown) => ok({ data: [CLIENTE], error: null }) }
  const sb = { from: () => consulta } as unknown as Supabase
  const [a, b] = InMemoryTransport.createLinkedPair()
  await criarServidorMcp({ sb, userId: 'u', nome: 'Ana', papel: 'admin', escopo: 'read' }).connect(b)
  const cli = new Client({ name: 't', version: '1' })
  await cli.connect(a)
  const r = await cli.callTool({ name: 'anuncios_meta_cliente', arguments: { clienteId: CLIENTE.id, de: '2026-10-17', ate: '2026-10-23' } })
  const j = JSON.parse((r.content as { text: string }[])[0].text)
  expect(j.totaisAtivos.gasto).toBeCloseTo(381.98)
  expect(j.totaisConta).toMatchObject({ gasto: 774.46, leads: 40, custoPorLead: 19.36 })
  expect(j.origemDosTotais).toMatch(/pausadas/)
})
