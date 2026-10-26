import { afterEach, expect, it, vi } from 'vitest'
import { campanhaMetaRelatorio } from '@/dominio/relatorio-compartilhado'
import { campanhasDoPeriodoMeta, resumoMetaPorTipo } from '@/servicos/meta-anuncios'

vi.mock('server-only', () => ({}))

const linha = (campanha: string, nome: string, adset: string, spend: number, acoes: Record<string, number>) => ({
  date_start: '2026-10-18', campaign_id: campanha, campaign_name: nome, adset_id: adset, adset_name: 'P', spend: String(spend), impressions: '1000', clicks: '10', inline_link_clicks: String(acoes.link_click ?? 0),
  actions: Object.entries(acoes).map(([action_type, value]) => ({ action_type, value: String(value) })),
})

const DETALHES = {
  s1: { id: 's1', destination_type: 'WHATSAPP', campaign: { effective_status: 'ACTIVE', objective: 'OUTCOME_ENGAGEMENT' } },
  s2: { id: 's2', destination_type: 'INSTAGRAM_PROFILE', campaign: { effective_status: 'ACTIVE', objective: 'OUTCOME_TRAFFIC' } },
  s3: { id: 's3', destination_type: 'WEBSITE', campaign: { effective_status: 'PAUSED', objective: 'OUTCOME_LEADS' } },
}

afterEach(() => vi.unstubAllGlobals())

it('C1/C2: status e objetivo vêm da campanha pelos ids dos conjuntos; marca é avaliada por clique, não por conversa', async () => {
  process.env.META_ACCESS_TOKEN = 't'
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(url)
    const corpo = u.pathname.endsWith('/insights')
      ? { data: [
        linha('c1', 'CBO-TESTE / ENGJ - WHATS', 's1', 1310.17, { 'onsite_conversion.messaging_conversation_started_7d': 120, 'onsite_conversion.lead_grouped': 119, lead: 119 }),
        linha('c2', 'CBO-ESCALA / CONTEÚDO / TRAF-INSTA', 's2', 700, { link_click: 2301, 'onsite_conversion.messaging_conversation_started_7d': 1 }),
        linha('c3', 'LEADS - SITE', 's3', 300, { 'offsite_conversion.fb_pixel_lead': 30, 'onsite_conversion.messaging_conversation_started_7d': 4 }),
      ] }
      : u.pathname.endsWith('/campaigns') ? { data: [{ id: 'c1', name: 'CBO-TESTE / ENGJ - WHATS' }, { id: 'c4', name: 'Sem entrega' }] }
      : u.searchParams.get('ids') ? Object.fromEntries(u.searchParams.get('ids')!.split(',').map((id) => [id, DETALHES[id as keyof typeof DETALHES]]))
      : { error: { message: 'inesperado' } }
    return new Response(JSON.stringify(corpo), { status: 'error' in corpo ? 400 : 200 })
  }))
  const r = await campanhasDoPeriodoMeta('1', { de: '2026-10-18', ate: '2026-10-24' })
  if ('erro' in r) throw new Error(r.erro)
  const [teste, insta, site] = r.campanhas
  expect([teste.status, insta.status, site.status]).toEqual(['ACTIVE', 'ACTIVE', 'PAUSED'])
  expect(teste.leads).toEqual({ formularios: 0, conversas: 120, site: 0 })
  expect(site.leads).toEqual({ formularios: 0, conversas: 0, site: 30 })
  expect(r.ativasSemGasto).toEqual(['Sem entrega'])
  expect(campanhaMetaRelatorio(insta, true)).toMatchObject({ ativa: true, papel: 'marca', resultado: 2301, rotuloResultado: 'cliques no link', custoPorResultado: 0.3 })
})

it('C6: separa captação de reconhecimento antes de calcular CPL, incluindo conversa, formulário e site', async () => {
  process.env.META_ACCESS_TOKEN = 't'
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(url)
    const corpo = u.pathname.endsWith('/insights') && u.searchParams.get('fields')?.includes('results')
      ? { data: [{ date_start: '2026-10-18', adset_id: 's2', results: [{ indicator: 'profile_visit_view', values: [{ value: '1800' }] }] }] }
      : u.pathname.endsWith('/insights')
      ? { data: [
        linha('c1', 'WHATS', 's1', 1200, { 'onsite_conversion.messaging_conversation_started_7d': 120 }),
        linha('c2', 'PERFIL', 's2', 700, { link_click: 2301 }),
        linha('c3', 'SITE', 's3', 300, { 'offsite_conversion.fb_pixel_lead': 30 }),
      ] }
      : u.searchParams.get('ids') ? Object.fromEntries(u.searchParams.get('ids')!.split(',').map((id) => [id, DETALHES[id as keyof typeof DETALHES]]))
      : { error: { message: 'inesperado' } }
    return new Response(JSON.stringify(corpo), { status: 'error' in corpo ? 400 : 200 })
  }))
  const r = await resumoMetaPorTipo('1', { de: '2026-10-18', ate: '2026-10-24' })
  if ('erro' in r) throw new Error(r.erro)
  expect(r.captacao).toMatchObject({ gasto: 1500, conversas: 120, formularios: 0, site: 30, leads: 150, custoPorLead: 10, campanhas: 2 })
  expect(r.reconhecimento).toMatchObject({ gasto: 700, cliquesLink: 2301, visitasPerfil: 1800, custoPorVisitaPerfil: expect.closeTo(700 / 1800), custoPorClique: expect.closeTo(700 / 2301), campanhas: 1 })
  expect(r.total).toMatchObject({ gasto: 2200, conversas: 120, site: 30 })
})
