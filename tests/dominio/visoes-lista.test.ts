import { describe, expect, it } from 'vitest'
import { CATALOGO_VISOES, ehTipoDeVisao, nomeParaNovaVisao } from '@/dominio/visoes-lista'

describe('catálogo de visualizações', () => {
  it('traz as opções do ClickUp em três grupos; só as disponíveis têm tipo válido', () => {
    expect(CATALOGO_VISOES.filter((c) => c.grupo === 'popular')).toHaveLength(8)
    expect(CATALOGO_VISOES.filter((c) => c.grupo === 'mais')).toHaveLength(8)
    expect(CATALOGO_VISOES.filter((c) => c.grupo === 'incorporacoes')).toHaveLength(7)
    for (const c of CATALOGO_VISOES) {
      expect(!!c.disponivel).toBe(!!c.tipo)
      if (c.tipo) expect(ehTipoDeVisao(c.tipo)).toBe(true)
    }
    expect(new Set(CATALOGO_VISOES.map((c) => c.chave)).size).toBe(CATALOGO_VISOES.length)
  })

  it('numera nomes repetidos', () => {
    expect(nomeParaNovaVisao('lista', [])).toBe('Lista')
    expect(nomeParaNovaVisao('lista', [{ nome: 'Lista' }])).toBe('Lista 2')
    expect(nomeParaNovaVisao('lista', [{ nome: 'Lista' }, { nome: 'Lista 2' }])).toBe('Lista 3')
  })
})
