import { describe, expect, it } from 'vitest'
import {
  descreverPosicaoMensal,
  descreverRecorrencia,
  ocorrenciasNoIntervalo,
  prazoDaOcorrencia,
  proximasDatas,
  resumirRecorrencia,
  serieConcluida,
  validarRecorrencia,
  type Frequencia,
  type ModoMensal,
} from '@/dominio/recorrencia'

const regra = (r: { frequencia: Frequencia; cada?: number; primeiroPrazo: string; diasSemana?: number[] | null; modoMensal?: ModoMensal; geradas?: number; terminaEm?: string | null; maximo?: number | null }) => ({
  cada: 1,
  diasSemana: null,
  modoMensal: 'day' as ModoMensal,
  geradas: 0,
  terminaEm: null,
  maximo: null,
  ...r,
})

it('descreve a regra no singular e no plural', () => {
  expect(descreverRecorrencia({ frequencia: 'monthly', cada: 1 })).toBe('Repete todo mês')
  expect(descreverRecorrencia({ frequencia: 'weekly', cada: 1 })).toBe('Repete toda semana')
  expect(descreverRecorrencia({ frequencia: 'weekly', cada: 2 })).toBe('Repete a cada 2 semanas')
  expect(descreverRecorrencia({ frequencia: 'weekdays', cada: 1 })).toBe('Repete nos dias úteis')
})

describe('prazoDaOcorrencia', () => {
  it('diária e mensal por dia (fim de mês encolhe, mas não acumula)', () => {
    expect(prazoDaOcorrencia(regra({ frequencia: 'daily', cada: 3, primeiroPrazo: '2026-11-30' }), 2)).toBe('2026-12-06')
    const mensal = regra({ frequencia: 'monthly', primeiroPrazo: '2026-01-31' })
    expect([0, 1, 2].map((n) => prazoDaOcorrencia(mensal, n))).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
  })

  it('dias úteis pulam o fim de semana e começam no primeiro dia útil', () => {
    // 2026-11-14 é sábado
    const r = regra({ frequencia: 'weekdays', primeiroPrazo: '2026-11-14' })
    expect([0, 1, 4, 5, 6].map((n) => prazoDaOcorrencia(r, n))).toEqual(['2026-11-16', '2026-11-17', '2026-11-20', '2026-11-23', '2026-11-24'])
  })

  it('semanal com vários dias, a partir do meio da semana', () => {
    // 2026-11-24 é terça; seg e qui
    const r = regra({ frequencia: 'weekly', primeiroPrazo: '2026-11-24', diasSemana: [4, 1] })
    expect([0, 1, 2, 3].map((n) => prazoDaOcorrencia(r, n))).toEqual(['2026-11-26', '2026-11-30', '2026-12-03', '2026-12-07'])
  })

  it('semanal sem dias usa o dia da âncora e respeita "a cada N semanas"', () => {
    const r = regra({ frequencia: 'weekly', cada: 2, primeiroPrazo: '2026-11-24' })
    expect([0, 1, 2].map((n) => prazoDaOcorrencia(r, n))).toEqual(['2026-11-24', '2026-12-08', '2026-12-22'])
  })

  it('mensal na mesma posição da semana, inclusive a última', () => {
    // 2026-11-23: 4ª segunda-feira
    const quarta = regra({ frequencia: 'monthly', primeiroPrazo: '2026-11-23', modoMensal: 'weekday_position' })
    expect([0, 1, 2].map((n) => prazoDaOcorrencia(quarta, n))).toEqual(['2026-11-23', '2026-12-28', '2027-01-25'])
    // 2026-11-30: 5ª segunda = última segunda
    const ultima = regra({ frequencia: 'monthly', primeiroPrazo: '2026-11-30', modoMensal: 'weekday_position' })
    expect([0, 1, 2].map((n) => prazoDaOcorrencia(ultima, n))).toEqual(['2026-11-30', '2026-12-28', '2027-01-25'])
  })
})

describe('séries', () => {
  it('próximas datas param no fim por data e por contagem', () => {
    const porData = regra({ frequencia: 'daily', primeiroPrazo: '2026-11-01', terminaEm: '2026-11-03' })
    expect(proximasDatas(porData, 10)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03'])
    const porContagem = regra({ frequencia: 'weekly', primeiroPrazo: '2026-11-02', maximo: 3, geradas: 1 })
    expect(proximasDatas(porContagem, 10)).toEqual(['2026-11-09', '2026-11-16'])
    expect(serieConcluida({ ...porContagem, geradas: 3 })).toBe(true)
    expect(serieConcluida(porContagem)).toBe(false)
  })

  it('ocorrências no intervalo, no máximo uma por dia', () => {
    const r = regra({ frequencia: 'weekdays', primeiroPrazo: '2026-11-02' })
    expect(ocorrenciasNoIntervalo(r, '2026-11-05', '2026-11-10')).toEqual(['2026-11-05', '2026-11-06', '2026-11-09', '2026-11-10'])
  })
})

describe('texto e validação', () => {
  it('resume a regra', () => {
    expect(resumirRecorrencia(regra({ frequencia: 'weekly', primeiroPrazo: '2026-11-24', diasSemana: [1, 4] }))).toBe('Toda semana · seg e qui')
    expect(resumirRecorrencia(regra({ frequencia: 'weekly', primeiroPrazo: '2026-11-24' }))).toBe('Toda semana · ter')
    expect(resumirRecorrencia(regra({ frequencia: 'weekdays', primeiroPrazo: '2026-11-24' }))).toBe('Todo dia útil')
    expect(resumirRecorrencia(regra({ frequencia: 'monthly', cada: 2, primeiroPrazo: '2026-11-24' }))).toBe('A cada 2 meses · no dia 24')
    expect(resumirRecorrencia(regra({ frequencia: 'monthly', primeiroPrazo: '2026-11-23', modoMensal: 'weekday_position' }))).toBe('Todo mês · na 4ª segunda-feira')
    expect(descreverPosicaoMensal('2026-11-28')).toBe('no 4º sábado')
    expect(descreverPosicaoMensal('2026-11-30')).toBe('na última segunda-feira')
  })

  it('valida com as mensagens da especificação', () => {
    const base = { frequencia: 'weekly' as const, cada: 1, antecedencia: 0, primeiroPrazo: '2026-11-24', diasSemana: [2], terminaEm: null, maximo: null }
    expect(validarRecorrencia(base)).toBeNull()
    expect(validarRecorrencia({ ...base, terminaEm: '2026-11-24' })).toBe('A data de fim precisa ser depois do início.')
    expect(validarRecorrencia({ ...base, diasSemana: [] })).toBe('Escolha pelo menos um dia.')
    expect(validarRecorrencia({ ...base, cada: 366 })).toBe('Use um número de 1 a 365.')
    expect(validarRecorrencia({ ...base, maximo: 0 })).toBe('Use de 1 a 1000 vezes.')
  })
})
