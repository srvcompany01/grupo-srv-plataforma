import { describe, expect, it } from 'vitest'
import { barras, diasCompletos, periodoAnterior, somar, valorDe, variacao, type DiaPago } from '@/dominio/painel-anuncios'

const dia = (d: string, gasto: number, cliques = 0, impressoes = 0, conversoes = 0, valor = 0): DiaPago => ({ dia: d, gasto, impressoes, cliques, conversoes, valor })

describe('painel de anúncios', () => {
  it('calcula as métricas derivadas e evita divisão por zero', () => {
    const t = somar([dia('2026-11-01', 100, 50, 1000, 4, 300), dia('2026-11-02', 50, 25, 500, 1, 0)])
    expect(valorDe('ctr', t)).toBeCloseTo(5)
    expect(valorDe('cpc', t)).toBe(2)
    expect(valorDe('cpa', t)).toBe(30)
    expect(valorDe('roas', t)).toBe(2)
    expect(valorDe('cpa', somar([]))).toBeNull()
  })
  it('compara com o período anterior do mesmo tamanho', () => {
    expect(periodoAnterior({ de: '2026-11-01', ate: '2026-11-07' })).toEqual({ de: '2026-10-25', ate: '2026-10-31' })
    expect(variacao(110, 100)).toBeCloseTo(10)
    expect(variacao(5, 0)).toBeNull()
  })
  it('preenche dias sem linha e agrupa em no máximo 12 barras', () => {
    const dias = diasCompletos({ de: '2026-10-01', ate: '2026-10-30' }, [dia('2026-10-02', 10), dia('2026-10-03', 5)])
    expect(dias).toHaveLength(30)
    const b = barras('investimento', dias)
    expect(b).toHaveLength(10)
    expect(b[0]).toEqual({ dia: '2026-10-01', valor: 15 })
  })
})
