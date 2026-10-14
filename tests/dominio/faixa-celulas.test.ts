import { describe, expect, it } from 'vitest'
import { interpretarColagem, planejarColagem, retangulo, textoParaValor, valorParaTexto } from '@/dominio/faixa-celulas'
import type { DefinicaoCampo } from '@/dominio/personalizacao'

const def = (tipo: string, options?: string[]) => ({ id: 'c', espacoId: null, nome: 'C', tipo, configuracao: { options }, cor: '#000', icone: 'x' }) as unknown as DefinicaoCampo
const equipe = [{ id: 'u1', nome: 'Ana Souza', avatar: null }, { id: 'u2', nome: 'Beto', avatar: null }]

describe('seleção em faixa', () => {
  const linhas = ['t1', 't2', 't3', 't4']
  const colunas = ['nome', 'campo:a', 'campo:b']
  it('retângulo vale em qualquer direção e na ordem da tela', () => {
    expect(retangulo(linhas, colunas, { linha: 't3', coluna: 'campo:b' }, { linha: 't2', coluna: 'campo:a' })).toEqual({ linhas: ['t2', 't3'], colunas: ['campo:a', 'campo:b'] })
    expect(retangulo(linhas, colunas, { linha: 'x', coluna: 'nome' }, { linha: 't1', coluna: 'nome' })).toBeNull()
  })
  it('um valor só preenche toda a seleção; vários começam no canto superior esquerdo', () => {
    const faixa = { linhas: ['t2', 't3'], colunas: ['campo:a', 'campo:b'] }
    expect(planejarColagem(faixa, [['x']], linhas, colunas)).toHaveLength(4)
    const m = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']]
    expect(planejarColagem(faixa, m, linhas, colunas).map((c) => `${c.linha}/${c.coluna}=${c.texto}`)).toEqual(['t2/campo:a=1', 't2/campo:b=2', 't3/campo:a=4', 't3/campo:b=5'])
    // célula única: o colado se espalha até onde a tabela deixar
    const unica = { linhas: ['t3'], colunas: ['campo:b'] }
    expect(planejarColagem(unica, m, linhas, colunas).map((c) => `${c.linha}/${c.coluna}`)).toEqual(['t3/campo:b', 't4/campo:b'])
  })
  it('interpreta o que vem de planilha (tab e quebra de linha)', () => {
    expect(interpretarColagem('a\tb\r\nc\td\r\n')).toEqual([['a', 'b'], ['c', 'd']])
  })
})

describe('texto ↔ valor do campo', () => {
  it('número em formato brasileiro, data, opção, rótulos, sim/não e pessoas', () => {
    expect(textoParaValor(def('number'), '1.234,5', equipe)).toEqual({ ok: true, valor: 1234.5 })
    expect(textoParaValor(def('number'), 'abc', equipe)).toEqual({ ok: false })
    expect(textoParaValor(def('date'), '05/10/2026', equipe)).toEqual({ ok: true, valor: '2026-10-05' })
    expect(textoParaValor(def('date'), '31/02/2026', equipe)).toEqual({ ok: false })
    expect(textoParaValor(def('dropdown', ['Reels', 'Feed']), 'feed', equipe)).toEqual({ ok: true, valor: 'Feed' })
    expect(textoParaValor(def('dropdown', ['Reels']), 'Story', equipe)).toEqual({ ok: false })
    expect(textoParaValor(def('labels', ['A', 'B']), 'a; B', equipe)).toEqual({ ok: true, valor: ['A', 'B'] })
    expect(textoParaValor(def('checkbox'), 'Sim', equipe)).toEqual({ ok: true, valor: true })
    expect(textoParaValor(def('people'), 'ana souza, Beto', equipe)).toEqual({ ok: true, valor: ['u1', 'u2'] })
    expect(textoParaValor(def('text'), '', equipe)).toEqual({ ok: true, valor: null })
    expect(textoParaValor(def('formula'), 'x', equipe)).toEqual({ ok: false })
  })
  it('valorParaTexto devolve o que se vê na célula', () => {
    expect(valorParaTexto(def('date'), '2026-10-05', equipe)).toBe('05/10/2026')
    expect(valorParaTexto(def('people'), ['u1', 'u2'], equipe)).toBe('Ana Souza, Beto')
    expect(valorParaTexto(def('checkbox'), true, equipe)).toBe('Sim')
    expect(valorParaTexto(def('text'), null, equipe)).toBe('')
  })
})
