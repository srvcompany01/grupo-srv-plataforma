import { describe, expect, it } from 'vitest'
import { dataDeHoje, escreverFiltros, lerFiltros, prazoEm } from '@/dominio/filtros'

describe('filtros', () => {
  it('lê da URL ignorando valores desconhecidos', () => {
    const f = lerFiltros({ resp: 'a,b', visao: 'kanban', prio: 'alta,xyz', prazo: 'nunca' })
    expect(f.responsaveis).toEqual(['a', 'b'])
    expect(f.visao).toBe('kanban')
    expect(f.prioridades).toEqual(['alta'])
    expect(f.prazo).toBeNull()
  })

  it('padrão é visão lista sem filtros', () => {
    expect(lerFiltros({})).toEqual({
      responsaveis: [],
      status: [],
      prioridades: [],
      tags: [],
      prazo: null,
      clientes: [],
      mes: null,
      busca: '',
      visao: 'lista',
      agrupamento: 'status',
      niveis: 'ambas',
      campos: [],
    })
  })

  it('ida e volta pela URL', () => {
    const f = lerFiltros({ resp: 'a', status: 's1,s2', tag: 't', prazo: 'semana', cliente: 'c', mes: '2026-10-01', busca: 'roteiro', visao: 'calendario', grupo: 'mes', niveis: 'maes' })
    const sp = Object.fromEntries(escreverFiltros(f))
    expect(lerFiltros(sp)).toEqual(f)
  })

  it('mês inválido é ignorado', () => {
    expect(lerFiltros({ mes: '2026-13-01' }).mes).toBeNull()
    expect(lerFiltros({ mes: 'x' }).mes).toBeNull()
  })

  it('intervalos de prazo sem fuso', () => {
    expect(prazoEm('atrasadas', '2026-10-06')).toEqual({ ate: '2026-10-05' })
    expect(prazoEm('hoje', '2026-10-06')).toEqual({ de: '2026-10-06', ate: '2026-10-06' })
    expect(prazoEm('semana', '2026-10-06')).toEqual({ de: '2026-10-06', ate: '2026-10-12' })
    expect(prazoEm('semana', '2026-12-29')).toEqual({ de: '2026-12-29', ate: '2027-01-04' })
    expect(prazoEm('sem-prazo', '2026-10-06')).toEqual({ semPrazo: true })
    expect(prazoEm(null, '2026-10-06')).toEqual({})
  })

  it('hoje no fuso de Belém', () => {
    expect(dataDeHoje(new Date('2026-10-07T02:30:00Z'))).toBe('2026-10-06')
    expect(dataDeHoje(new Date('2026-10-07T03:30:00Z'))).toBe('2026-10-07')
  })
})
