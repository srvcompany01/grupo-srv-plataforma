import { describe, expect, it } from 'vitest'
import { filtrarLancamentos, lerMes, lerReais, limitesDoMes, mesVizinho, repetirMensal, resumir, serieMensal, type Lancamento } from '@/dominio/financeiro'

const l = (p: Partial<Lancamento>): Lancamento => ({ id: 'x', tipo: 'entrada', categoria: 'Mensalidade', descricao: '', centavos: 100, data: '2026-10-05', pago: true, clienteId: null, clienteNome: null, ...p })

describe('lerReais', () => {
  it.each([
    ['1.500,00', 150000],
    ['1500', 150000],
    ['1500,5', 150050],
    ['R$ 10,99', 1099],
    ['1.234.567,89', 123456789],
    ['12.5', 1250],
    ['1.500', 150000],
  ])('%s → %i', (texto, centavos) => expect(lerReais(texto)).toBe(centavos))
  it.each(['', 'abc', '0', '-5', '1,234', '10,5,5', '99999999999'])('recusa %j', (texto) => expect(lerReais(texto)).toBeNull())
})

describe('meses', () => {
  it('lerMes aceita AAAA-MM e cai no mês de hoje se for inválido', () => {
    expect(lerMes('2026-03', '2026-10-19')).toBe('2026-03')
    expect(lerMes('2026-13', '2026-10-19')).toBe('2026-10')
    expect(lerMes(undefined, '2026-10-19')).toBe('2026-10')
  })
  it('mesVizinho atravessa o ano e limitesDoMes é [de, ate)', () => {
    expect(mesVizinho('2026-12', 1)).toBe('2027-01')
    expect(mesVizinho('2026-01', -1)).toBe('2025-12')
    expect(limitesDoMes('2026-12')).toEqual({ de: '2026-12-01', ate: '2027-01-01' })
  })
  it('repetirMensal mantém o dia e usa o último dia nos meses curtos', () => {
    expect(repetirMensal('2026-01-31', 3)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
    expect(repetirMensal('2026-11-15', 3)).toEqual(['2026-11-15', '2026-12-15', '2027-01-15'])
    expect(repetirMensal('2026-11-15', 0)).toHaveLength(1)
    expect(repetirMensal('2026-11-15', 99)).toHaveLength(36)
  })
})

describe('resumir', () => {
  const itens = [
    l({ centavos: 10000 }),
    l({ centavos: 5000, pago: false }),
    l({ tipo: 'saida', categoria: 'Equipe', centavos: 4000 }),
    l({ tipo: 'saida', categoria: 'Tráfego pago', centavos: 1000, pago: false }),
    l({ tipo: 'saida', categoria: 'Equipe', centavos: 500 }),
  ]
  it('separa pago de pendente e calcula saldo e previsto', () => {
    const r = resumir(itens)
    expect(r).toMatchObject({ entradas: 10000, despesas: 4500, saldo: 5500, aReceber: 5000, aPagar: 1000, previsto: 9500 })
  })
  it('soma por categoria, da maior para a menor', () => {
    expect(resumir(itens).porCategoria.map((c) => [c.categoria, c.centavos])).toEqual([['Mensalidade', 15000], ['Equipe', 4500], ['Tráfego pago', 1000]])
  })
  it('mesmo nome de categoria em entrada e saída não se mistura', () => {
    const r = resumir([l({ categoria: 'Outros', centavos: 3 }), l({ tipo: 'saida', categoria: 'Outros', centavos: 4 })])
    expect(r.porCategoria).toHaveLength(2)
  })
})

it('serieMensal devolve 6 meses seguidos e ignora o que está fora', () => {
  const s = serieMensal([l({ data: '2026-10-01', centavos: 7 }), l({ tipo: 'saida', data: '2026-08-31', centavos: 3 }), l({ data: '2025-01-01', centavos: 99 })], '2026-10')
  expect(s.map((m) => m.mes)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'])
  expect(s[5].entradas).toBe(7)
  expect(s[3].despesas).toBe(3)
})

it('filtrarLancamentos', () => {
  const itens = [l({}), l({ tipo: 'saida', pago: false })]
  expect(filtrarLancamentos(itens, 'entradas')).toHaveLength(1)
  expect(filtrarLancamentos(itens, 'despesas')).toHaveLength(1)
  expect(filtrarLancamentos(itens, 'pendentes')).toHaveLength(1)
  expect(filtrarLancamentos(itens, 'todos')).toHaveLength(2)
})
