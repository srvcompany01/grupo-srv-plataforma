import { describe, expect, it } from 'vitest'
import { lerAbaAnuncios, lerCanalAnuncios, resumirContasAnuncios, serieContasAnuncios, somarDisponiveis, urlAnuncios, type ContaAnuncios, type ResumoCanalAnuncios } from '@/dominio/central-anuncios'

const canal = (p: Partial<ResumoCanalAnuncios> = {}): ResumoCanalAnuncios => ({ gasto: 0, cliques: 0, resultados: 0, gastoCaptacao: null, ativas: 0, pausadas: 0, dias: [], ...p })
const periodo = { de: '2026-11-01', ate: '2026-11-03', atalho: null }

describe('central de anúncios', () => {
  it('separa leads Meta de conversões Google e exclui reconhecimento do CPL', () => {
    const contas: ContaAnuncios[] = [{ id: 'a', nome: 'A', erros: [], meta: canal({ gasto: 1000, gastoCaptacao: 200, resultados: 10, ativas: 2 }), google: canal({ gasto: 700, resultados: 20, ativas: 1 }) }]
    expect(resumirContasAnuncios(contas)).toMatchObject({ gasto: 1700, meta: 1000, google: 700, leads: 10, conversoes: 20, cpl: 20, ativas: 3 })
  })
  it('não transforma falha de consulta em resultado zero ou CPL melhor', () => {
    const contas: ContaAnuncios[] = [
      { id: 'a', nome: 'A', erros: [], meta: canal({ gasto: 800, gastoCaptacao: 200, resultados: 10 }), google: null },
      { id: 'b', nome: 'B', erros: ['Resultados Meta indisponíveis'], meta: canal({ gasto: 300, gastoCaptacao: null, resultados: null }), google: null },
    ]
    expect(resumirContasAnuncios(contas)).toMatchObject({ gasto: 1100, leads: 10, conversoes: null, cpl: 20, erros: ['B: Resultados Meta indisponíveis'] })
    expect(somarDisponiveis([null, undefined, NaN])).toBeNull()
    expect(somarDisponiveis([null, 0])).toBe(0)
  })
  it('preserva o zero confirmado e não divide por zero', () => {
    const t = resumirContasAnuncios([{ id: 'a', nome: 'A', erros: [], meta: canal({ gastoCaptacao: 100 }), google: null }])
    expect(t.leads).toBe(0)
    expect(t.cpl).toBeNull()
    expect(resumirContasAnuncios([]).gasto).toBeNull()
  })
  it('preenche dias sem gasto e soma as contas mantendo os canais separados', () => {
    const contas: ContaAnuncios[] = [
      { id: 'a', nome: 'A', erros: [], meta: canal({ dias: [{ dia: '2026-11-03', gasto: 9 }, { dia: '2026-11-01', gasto: 3 }] }), google: canal({ dias: [{ dia: '2026-11-01', gasto: 5 }] }) },
      { id: 'b', nome: 'B', erros: [], meta: canal({ dias: [{ dia: '2026-11-01', gasto: 7 }] }), google: null },
    ]
    expect(serieContasAnuncios(contas, periodo)).toEqual([{ dia: '2026-11-01', meta: 10, google: 5 }, { dia: '2026-11-02', meta: 0, google: 0 }, { dia: '2026-11-03', meta: 9, google: 0 }])
  })
  it('mantém cliente, intervalo personalizado e canal na troca de aba', () => {
    const u = new URL(urlAnuncios({ cliente: 'cliente-a', periodo, canal: 'google', aba: 'criativos' }), 'https://example.test')
    expect(Object.fromEntries(u.searchParams)).toEqual({ cliente: 'cliente-a', de: '2026-11-01', ate: '2026-11-03', canal: 'google', aba: 'criativos' })
    expect(urlAnuncios({ periodo: { ...periodo, atalho: 7 } })).toBe('/anuncios')
    expect(urlAnuncios({ periodo: { ...periodo, atalho: 'hoje' }, aba: 'aprovacoes' })).toBe('/anuncios?dias=hoje&aba=aprovacoes')
  })
  it('ignora canais e abas desconhecidos na URL', () => {
    expect(lerAbaAnuncios(['campanhas'])).toBe('visao')
    expect(lerCanalAnuncios('facebook')).toBe('todos')
    expect(lerAbaAnuncios('campanhas')).toBe('campanhas')
    expect(lerCanalAnuncios('meta')).toBe('meta')
  })
})
