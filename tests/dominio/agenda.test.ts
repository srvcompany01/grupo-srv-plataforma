import { describe, expect, it } from 'vitest'
import { blocosDoDia, doDia, gradeDoMes, horaLocal, lerCompromisso, ocorrencias, paraEntrada, publico, regraGoogle, semanaDe, type Compromisso } from '@/dominio/agenda'

const c = (p: Partial<Compromisso>): Compromisso => ({
  id: 'c1', titulo: 'Reunião', descricao: '', inicio: '2026-10-19T13:00:00.000Z', fim: '2026-10-19T14:00:00.000Z',
  diaInteiro: false, visibilidade: 'privado', repetir: 'nunca', repetirAte: null, criadoPor: 'eu', pessoas: [], clienteId: null, tags: [], categoriaId: null, ...p,
})

describe('agenda', () => {
  it('semana começa na segunda', () => {
    expect(semanaDe('2026-10-25')).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'])
    expect(semanaDe('2026-10-19')[0]).toBe('2026-10-19')
  })

  it('grade do mês em semanas completas', () => {
    const g = gradeDoMes('2026-10')
    expect([g[0], g.at(-1), g.length]).toEqual(['2026-09-28', '2026-11-01', 35])
    expect(gradeDoMes('2026-02').length % 7).toBe(0)
  })

  it('lê o formulário no fuso de Belém e valida', () => {
    const r = lerCompromisso({ titulo: ' Reunião ', data: '2026-10-19', horaInicio: '10:00', horaFim: '11:30' }, false)
    expect(r).toEqual({ campos: expect.objectContaining({ titulo: 'Reunião', inicio: '2026-10-19T13:00:00.000Z', fim: '2026-10-19T14:30:00.000Z', visibilidade: 'privado' }) })
    expect(lerCompromisso({ titulo: 'x', data: '2026-10-19', horaInicio: '11:00', horaFim: '10:00' }, true)).toEqual({ erro: expect.stringMatching(/depois do início/) })
    expect(lerCompromisso({ titulo: 'x', data: '2026-10-19', diaInteiro: true, visibilidade: 'equipe' }, false)).toEqual({ erro: expect.stringMatching(/admin e gestor/) })
    expect(lerCompromisso({ titulo: 'x', data: '2026-10-19', diaInteiro: true, visibilidade: 'selecionados' }, true)).toEqual({ erro: 'Escolha pelo menos uma pessoa.' })
    const dia = lerCompromisso({ titulo: 'Feriado', data: '2026-10-19', diaInteiro: true }, false)
    expect('campos' in dia && [dia.campos.inicio, dia.campos.fim]).toEqual(['2026-10-19T03:00:00.000Z', '2026-10-20T03:00:00.000Z'])
    expect(horaLocal('2026-10-19T13:00:00.000Z')).toBe('10:00')
    expect(paraEntrada(c({})).horaInicio).toBe('10:00')
    expect(lerCompromisso({ titulo: 'x', data: '2026-10-19', diaInteiro: true, clienteId: 'nao-e-id' }, true)).toEqual({ erro: 'Cliente inválido.' })
    const comTags = lerCompromisso({ titulo: 'x', data: '2026-10-19', diaInteiro: true, tags: ['6f1c2c1e-0000-4000-8000-000000000001', '6f1c2c1e-0000-4000-8000-000000000001'] }, false)
    expect('campos' in comTags && comTags.campos.tags).toHaveLength(1)
  })

  it('expande o compromisso fixo dentro da janela, respeitando a data final', () => {
    const semanal = c({ repetir: 'semanal', inicio: '2026-01-05T13:00:00.000Z', fim: '2026-01-05T14:00:00.000Z' })
    expect(ocorrencias([semanal], '2026-10-19', '2026-10-25').map((o) => o.inicio)).toEqual(['2026-10-19T13:00:00.000Z'])
    expect(ocorrencias([{ ...semanal, repetirAte: '2026-10-18' }], '2026-10-19', '2026-10-25')).toEqual([])
    expect(ocorrencias([c({ repetir: 'diario' })], '2026-10-19', '2026-10-25')).toHaveLength(7)
    expect(ocorrencias([c({})], '2026-10-20', '2026-10-25')).toEqual([])
    // mensal no dia 31 pula os meses sem dia 31
    const mensal = c({ repetir: 'mensal', inicio: '2026-01-31T13:00:00.000Z', fim: '2026-01-31T14:00:00.000Z' })
    expect(ocorrencias([mensal], '2026-02-01', '2026-05-31').map((o) => o.inicio.slice(0, 10))).toEqual(['2026-03-31', '2026-05-31'])
  })

  it('grade de horas: posição em minutos e colunas para sobrepostos', () => {
    const o = (id: string, ini: string, fim: string, diaInteiro = false) => ({ id, titulo: id, inicio: `2026-10-19T${ini}:00.000Z`, fim: `2026-10-19T${fim}:00.000Z`, diaInteiro })
    // horários em UTC; Belém = UTC-3 → 13:00Z é 10h
    const b = blocosDoDia([o('a', '13:00', '14:00'), o('b', '13:30', '15:00'), o('c', '17:00', '18:00'), o('d', '03:00', '03:00', true)], '2026-10-19')
    expect(b.map((x) => [x.ocorrencia.id, x.de, x.ate, x.coluna, x.colunas])).toEqual([
      ['a', 600, 660, 0, 2],
      ['b', 630, 720, 1, 2],
      ['c', 840, 900, 0, 1],
    ])
    // atravessa a meia-noite: corta em 24h e aparece no dia seguinte
    const noite = o('n', '01:00', '05:00') // 22h do dia 18 até 2h do dia 19
    expect(blocosDoDia([noite], '2026-10-18')[0].ate).toBe(1440)
    expect(blocosDoDia([noite], '2026-10-19')[0].de).toBe(0)
    expect(doDia([noite], '2026-10-18')).toHaveLength(1)
    expect(doDia([noite], '2026-10-20')).toHaveLength(0)
  })

  it('público e regra do Google', () => {
    expect(publico(c({ visibilidade: 'equipe' }), ['eu', 'ana'])).toEqual(['eu', 'ana'])
    expect(publico(c({ visibilidade: 'selecionados', pessoas: ['bia'] }), ['ana'])).toEqual(['eu', 'bia'])
    expect(publico(c({}), ['ana'])).toEqual(['eu'])
    expect(regraGoogle(c({}))).toBeUndefined()
    expect(regraGoogle(c({ repetir: 'semanal', repetirAte: '2026-12-31' }))).toEqual(['RRULE:FREQ=WEEKLY;UNTIL=20270101T025900Z'])
    expect(regraGoogle(c({ repetir: 'mensal', repetirAte: '2026-12-31', diaInteiro: true }))).toEqual(['RRULE:FREQ=MONTHLY;UNTIL=20261231'])
  })
})
