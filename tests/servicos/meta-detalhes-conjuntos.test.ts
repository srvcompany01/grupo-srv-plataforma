import { afterEach, expect, it, vi } from 'vitest'
import { resumoMetaPorTipo } from '@/servicos/meta-anuncios'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('consulta os conjuntos individualmente sem o parâmetro ids retirado pela Meta', async () => {
  vi.stubEnv('META_ACCESS_TOKEN', 'token-de-teste')
  const consultas: URL[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(url)
    consultas.push(u)
    if (u.pathname.endsWith('/conjunto-a')) return Response.json({ id: 'conjunto-a', destination_type: 'WHATSAPP', campaign: { effective_status: 'ACTIVE', objective: 'OUTCOME_LEADS' } })
    if (u.searchParams.get('fields')?.startsWith('campaign_id')) return Response.json({ data: [{ date_start: '2026-11-01', campaign_id: 'campanha-a', campaign_name: 'Captação', adset_id: 'conjunto-a', adset_name: 'WhatsApp', spend: '50', actions: [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '5' }] }] })
    return Response.json({ data: [] })
  }))
  const r = await resumoMetaPorTipo('123', { de: '2026-11-01', ate: '2026-11-02' })
  expect(r).toMatchObject({ captacao: { leads: 5, gasto: 50, custoPorLead: 10 } })
  expect(consultas.some(u => u.pathname.endsWith('/conjunto-a'))).toBe(true)
  expect(consultas.every(u => !u.searchParams.has('ids'))).toBe(true)
})
