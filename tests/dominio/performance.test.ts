import { describe, expect, it } from 'vitest'
import { indicadores, intervaloDoMes, leadsDasAcoes, lerMes, mesesAte } from '@/dominio/performance'

describe('performance', () => {
  it('leads do Meta: formulários (sem dobrar) e conversas', () => {
    expect(leadsDasAcoes([{ action_type: 'lead', value: '10' }, { action_type: 'onsite_conversion.lead_grouped', value: '6' }, { action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '42' }])).toEqual({ formularios: 10, conversas: 42 })
    expect(leadsDasAcoes([{ action_type: 'onsite_conversion.lead_grouped', value: '6' }, { action_type: 'offsite_conversion.fb_pixel_lead', value: '3' }])).toEqual({ formularios: 9, conversas: 0 })
    expect(leadsDasAcoes(undefined)).toEqual({ formularios: 0, conversas: 0 })
  })
  it('meses', () => {
    expect(lerMes('2026-09', '2026-10-24')).toBe('2026-09')
    expect(lerMes('2026-12', '2026-10-24')).toBe('2026-10')
    expect(lerMes('x', '2026-10-24')).toBe('2026-10')
    expect(intervaloDoMes('2026-10', '2026-10-24')).toEqual({ de: '2026-10-01', ate: '2026-10-24' })
    expect(intervaloDoMes('2026-02', '2026-10-24')).toEqual({ de: '2026-02-01', ate: '2026-02-28' })
    expect(mesesAte('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02'])
  })
  it('indicadores', () => {
    expect(indicadores({ investido: 1000, leadsPagos: 50, leadsOrganicos: 10, faturamento: 20000, vendas: 12 })).toMatchObject({ leads: 60, cpl: 20, roas: 20, custoPorVenda: 1000 / 12, ticketMedio: 20000 / 12, conversao: 20 })
    expect(indicadores({ investido: 0, leadsPagos: 0, leadsOrganicos: 0, faturamento: null, vendas: null })).toMatchObject({ cpl: null, roas: null, conversao: null })
  })
})
