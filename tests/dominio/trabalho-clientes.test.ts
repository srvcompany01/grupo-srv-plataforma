import { describe, expect, it } from 'vitest'
import { diasDoPeriodo, lerPeriodo, minimoSaudavel, rankingDeTrabalho } from '@/dominio/trabalho-clientes'

describe('relatório de clientes trabalhados', () => {
  it('monta o período terminando hoje, virando o mês', () => {
    expect(diasDoPeriodo('2026-11-02', 4)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'])
  })

  it('lê o período com padrão de 7 dias', () => {
    expect(lerPeriodo('30')).toBe(30)
    expect(lerPeriodo('99')).toBe(7)
    expect(lerPeriodo(undefined)).toBe(7)
    expect([7, 14, 30].map(minimoSaudavel)).toEqual([2, 4, 9])
  })

  it('ordena por dias trabalhados e separa saudáveis de quem precisa de atenção', () => {
    const dias = diasDoPeriodo('2026-10-20', 7)
    const clientes = [{ id: 'a', nome: 'Ana', cor: '#000' }, { id: 'b', nome: 'Bia', cor: '#000' }, { id: 'c', nome: 'Caio', cor: '#000' }]
    const { ranking, porDia } = rankingDeTrabalho(clientes, [
      { clienteId: 'b', dia: '2026-10-19' },
      { clienteId: 'b', dia: '2026-10-20' },
      { clienteId: 'a', dia: '2026-10-18' },
      { clienteId: 'a', dia: '2026-10-01' }, // fora do período
    ], dias)
    expect(ranking.map((r) => [r.id, r.dias, r.ultimo, r.saudavel])).toEqual([
      ['b', 2, '2026-10-20', true],
      ['a', 1, '2026-10-18', false],
      ['c', 0, null, false],
    ])
    expect(porDia.at(-1)).toEqual({ dia: '2026-10-20', total: 1 })
    expect(porDia.reduce((s, d) => s + d.total, 0)).toBe(3)
  })
})
