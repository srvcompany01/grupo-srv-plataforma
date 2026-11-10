import { describe, expect, it } from 'vitest'
import { CAMPOS, chavesInvalidas, idDoCheck, mesclar, normalizar, numero, preenchimento, VAZIO } from '@/dominio/estrategia'

describe('estratégia do cliente', () => {
  it('normaliza: apara, tira vazios, ignora chaves e tipos inválidos', () => {
    const d = normalizar({ textos: { bigidea: '  Ideia  ', vazio: '  ', 'Chave Ruim': 'x', n: 3 }, listas: { dores: [' a ', '', 2, 'b'], nada: [] }, marcados: ['x', 'x', 5] })
    expect(d).toEqual({ textos: { bigidea: 'Ideia' }, listas: { dores: ['a', 'b'] }, marcados: ['x'] })
    expect(normalizar(null)).toEqual(VAZIO)
  })

  it('mescla só as chaves enviadas; vazio apaga', () => {
    const atual = normalizar({ textos: { slogan: 'A', proposta: 'B' }, listas: { valores: ['x'] }, marcados: ['arq.heroi'] })
    const novo = mesclar(atual, { textos: { slogan: '' }, listas: { pilares: ['p'] } })
    expect(novo).toEqual({ textos: { proposta: 'B' }, listas: { valores: ['x'], pilares: ['p'] }, marcados: ['arq.heroi'] })
  })

  it('preenchimento conta os campos do método (sem os acréscimos do checklist)', () => {
    expect(preenchimento('swot', VAZIO)).toBe(0)
    const swot = normalizar({ listas: { 'swot.forcas': ['a'], 'swot.fraquezas': ['b'], 'swot.oportunidades': ['c'], 'swot.ameacas': ['d'] } })
    expect(preenchimento('swot', swot)).toBe(0.5)
    expect(preenchimento('jornada', normalizar({ listas: { 'extra.simples.descoberta': ['x'] } }))).toBe(0)
  })

  it('chaves do catálogo são únicas, válidas e reconhecidas', () => {
    for (const campos of Object.values(CAMPOS)) {
      const chaves = campos.map((c) => c.chave)
      expect(new Set(chaves).size).toBe(chaves.length)
      for (const k of chaves) expect(k).toMatch(/^[a-z0-9_.]{1,60}$/)
    }
    expect(chavesInvalidas('receita', ['volume.selecao', 'num.cac', 'inventada'])).toEqual(['inventada'])
    expect(idDoCheck('simples', 'acao', 'Item')).toBe('simples.acao:Item')
  })

  it('lê números em pt-BR', () => {
    expect(numero('R$ 1.234,50')).toBe(1234.5)
    expect(numero('12%')).toBe(12)
    expect(numero('')).toBeNull()
    expect(numero('abc')).toBeNull()
  })
})

describe('textosDosNumerosReais', () => {
  it('preenche só o que dá para calcular, em formato que numero() lê de volta', async () => {
    const { textosDosNumerosReais, numero } = await import('@/dominio/estrategia')
    const mapa = (n: Parameters<typeof textosDosNumerosReais>[0]) => Object.fromEntries(textosDosNumerosReais(n).map((i) => [i.chave, i.valor]))
    const cheio = mapa({ mes: '2026-10', impressoes: 344709, leads: 219, vendas: 12, investido: 3600, faturamento: 30000 })
    expect(cheio['volume.consciencia']).toBe('344.709')
    expect(cheio['conversao.consciencia']).toBe('0,064%')
    expect(cheio['volume.educacao']).toBe('219')
    expect(numero(cheio['num.cac'])).toBe(300)
    expect(numero(cheio['num.ticket'])).toBe(2500)
    expect(numero(cheio['volume.consciencia'])).toBe(344709)
    const semVenda = mapa({ mes: '2026-10', impressoes: null, leads: 5, vendas: null, investido: 100, faturamento: null })
    expect(Object.keys(semVenda)).toEqual(['volume.educacao'])
  })
})
