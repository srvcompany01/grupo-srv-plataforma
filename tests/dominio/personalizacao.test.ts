import { describe, expect, it } from 'vitest'
import { calcularFormula, formatarValorCampo, type DefinicaoCampo } from '@/dominio/personalizacao'
import type { Json } from '@/infra/supabase/tipos'

const campo = (tipo: DefinicaoCampo['tipo'], configuracao: DefinicaoCampo['configuracao'] = {}): DefinicaoCampo => ({
  id: 'campo',
  espacoId: 'espaco',
  nome: 'Campo',
  tipo,
  configuracao,
  cor: '#6647f0',
  icone: 'type',
})

describe('personalização de campos', () => {
  it('formata dinheiro na moeda configurada', () => {
    expect(formatarValorCampo(campo('money', { currency: 'BRL', locale: 'pt-BR', decimals: 2 }), 1234.5)).toContain('1.234,50')
    expect(formatarValorCampo(campo('money', { currency: 'USD', locale: 'en-US', decimals: 2 }), 1234.5)).toBe('$1,234.50')
  })

  it('calcula soma, média, diferença e produto usando campos numéricos', () => {
    const valores = new Map<string, Json | null>([['a', 10], ['b', 2], ['texto', 'ignorado']])
    const base = { sourceFields: ['a', 'b', 'texto'] }
    expect(calcularFormula({ ...base, operation: 'sum' }, valores)).toBe(12)
    expect(calcularFormula({ ...base, operation: 'average' }, valores)).toBe(6)
    expect(calcularFormula({ ...base, operation: 'difference' }, valores)).toBe(8)
    expect(calcularFormula({ ...base, operation: 'product' }, valores)).toBe(20)
  })

  it('retorna vazio quando a fórmula não encontra números', () => {
    expect(calcularFormula({ operation: 'sum', sourceFields: ['x'] }, new Map())).toBeNull()
  })
})
