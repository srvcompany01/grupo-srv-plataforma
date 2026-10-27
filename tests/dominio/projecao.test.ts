import { describe, expect, it } from 'vitest'
import { analisarProjecao, baseDaProjecao, lerAjustes, projetar, type MesDaBase } from '@/dominio/projecao'

const mes = (o: Partial<MesDaBase> = {}): MesDaBase => ({ investidoMeta: 3000, investidoGoogle: 1000, leadsMeta: 80, leadsGoogle: 20, leadsOrganicos: 20, faturamento: 30000, vendas: 12, ...o })

describe('projeção de 3 meses', () => {
  it('a base é a média mensal dos meses com faturamento e vendas lançados; sem nenhum, não projeta', () => {
    const b = baseDaProjecao([mes(), mes({ investidoMeta: 5000, faturamento: 50000, vendas: 20 }), mes({ faturamento: null, vendas: null })])!
    expect(b.meses).toBe(2)
    expect(b.investimento).toBe(5000) // (4000 + 6000) / 2
    expect(b).toMatchObject({ vendas: 16, faturamento: 40000, vendasNoPeriodo: 32 })
    expect(b.ticket).toBe(2500)
    expect(b.conversao).toBeCloseTo((16 / 120) * 100)
    expect(b.cpa).toBe(5000 / 16)
    expect(b.roas).toBe(8)
    expect(baseDaProjecao([mes({ faturamento: null })])).toBeNull()
  })

  it('manter o ritmo repete a base nos 3 meses', () => {
    const b = baseDaProjecao([mes()])!
    const manter = projetar(b)[0]
    expect(manter.meses.map((m) => Math.round(m.vendas))).toEqual([12, 12, 12])
    expect(manter.total.faturamento).toBeCloseTo(90000)
    expect(manter.total.roas).toBeCloseTo(7.5)
  })

  it('conversão melhor só muda as vendas (mesmo investimento e leads), com a melhoria entrando aos poucos', () => {
    const b = baseDaProjecao([mes()])!
    const c = projetar(b, { investimento: 30, organico: 50, conversao: 20 }).find((x) => x.id === 'conversao')!
    expect(c.meses.every((m) => m.investimento === 4000 && m.leads === 120)).toBe(true)
    expect(c.meses.map((m) => +m.vendas.toFixed(2))).toEqual([12.8, 13.6, 14.4]) // +6,67%, +13,33%, +20% de 12
    expect(c.total.faturamento).toBeCloseTo(40.8 * 2500)
  })

  it('investir mais rende menos que proporcional (rendimento decrescente) e não custa de graça', () => {
    const b = baseDaProjecao([mes()])!
    const manter = projetar(b)[0]
    const inv = projetar(b, { investimento: 100, organico: 0, conversao: 0 }).find((x) => x.id === 'investir')!
    const ultimo = inv.meses[2]
    expect(ultimo.investimento).toBeCloseTo(8000)
    expect(ultimo.leads).toBeGreaterThan(manter.meses[2].leads)
    expect(ultimo.leads).toBeLessThan(20 + 100 * 2) // dobrar a verba não dobra os leads pagos
    expect(inv.total.roas!).toBeLessThan(manter.total.roas!)
  })

  it('o cenário "tudo junto" supera cada alavanca sozinha e a conversão nunca passa de 100%', () => {
    const b = baseDaProjecao([mes()])!
    const c = projetar(b)
    const fat = (id: string) => c.find((x) => x.id === id)!.total.faturamento
    expect(fat('combinado')).toBeGreaterThan(Math.max(fat('investir'), fat('organico'), fat('conversao')))
    const alta = baseDaProjecao([mes({ vendas: 119 })])!
    expect(projetar(alta, { investimento: 0, organico: 0, conversao: 100 })[3].meses[2].vendas).toBeLessThanOrEqual(120)
  })

  it('ajustes digitados: limites e valor inválido volta ao padrão', () => {
    expect(lerAjustes({ inv: '50', org: '10', conv: '5' })).toEqual({ investimento: 50, organico: 10, conversao: 5 })
    expect(lerAjustes({ inv: 'abc', org: '-3', conv: '999' })).toEqual({ investimento: 30, organico: 50, conversao: 20 })
    expect(lerAjustes({})).toEqual({ investimento: 30, organico: 50, conversao: 20 })
  })

  it('leitura: pouca amostra avisa, CPA alto alerta, canal mais barato sugere mover verba, pouco orgânico sugere o Biolytics', () => {
    const b = baseDaProjecao([mes({ investidoMeta: 1000, investidoGoogle: 3000, leadsMeta: 100, leadsGoogle: 10, leadsOrganicos: 5, faturamento: 4000, vendas: 4 })])!
    const a = analisarProjecao(b, projetar(b))
    const dest = a.destaques.map((d) => d.texto).join(' ')
    const rec = a.recomendacoes.map((d) => d.texto).join(' ')
    expect(dest).toMatch(/apenas 4 vendas/)
    expect(dest).toMatch(/Mantendo o ritmo/)
    expect(rec).toMatch(/mais da metade do ticket/)
    expect(rec).toMatch(/lead da Meta custa/)
    expect(rec).toMatch(/orgânicos/)
  })
})
