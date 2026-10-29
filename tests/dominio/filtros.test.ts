import { describe, expect, it } from 'vitest'
import { aplicarFiltroSalvo, dataDeHoje, escreverFiltros, filtrosEmTexto, lerFiltros, passaPeloOu, prazoEm } from '@/dominio/filtros'

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
      semConcluidas: false,
      logica: 'e',
      subtarefas: 'normal',
      expandidas: false,
    })
  })

  it('ida e volta pela URL', () => {
    const f = lerFiltros({ resp: 'a', status: 's1,s2', tag: 't', prazo: 'semana', cliente: 'c', mes: '2026-10-01', busca: 'roteiro', visao: 'calendario', grupo: 'mes', niveis: 'maes', semconcl: '1' })
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

describe('visões novas e ocultar concluídas', () => {
  it('reconhece tabela, galeria e linha do tempo e guarda semConcluidas na URL', () => {
    for (const v of ['tabela', 'galeria', 'cronograma'] as const) expect(lerFiltros({ visao: v }).visao).toBe(v)
    expect(lerFiltros({ visao: 'qualquer' }).visao).toBe('lista')
    const f = lerFiltros({ semconcl: '1' })
    expect(f.semConcluidas).toBe(true)
    expect(escreverFiltros(f).get('semconcl')).toBe('1')
    expect(escreverFiltros(lerFiltros({})).has('semconcl')).toBe(false)
  })
})

describe('filtros E/OU e salvos', () => {
  const t = { responsaveis: [{ id: 'a' }], tags: [], statusId: 's1', prioridade: 'alta', clienteId: '', prazo: null, concluidaEm: null }
  const base = lerFiltros({})
  it('lê e escreve a lógica', () => {
    expect(lerFiltros({ logica: 'ou' }).logica).toBe('ou')
    expect(lerFiltros({ logica: 'x' }).logica).toBe('e')
    expect(escreverFiltros({ ...base, logica: 'ou' }).toString()).toBe('logica=ou')
  })
  it('OU: basta um filtro bater; sem filtros, passa', () => {
    expect(passaPeloOu(t, { ...base, responsaveis: ['b'], status: ['s1'] }, '2026-10-28')).toBe(true)
    expect(passaPeloOu(t, { ...base, responsaveis: ['b'], status: ['s2'] }, '2026-10-28')).toBe(false)
    expect(passaPeloOu(t, base, '2026-10-28')).toBe(true)
  })
  it('filtro salvo guarda só filtros e aplica sem mexer na visão', () => {
    const texto = filtrosEmTexto({ ...base, status: ['s1'], visao: 'kanban', logica: 'ou' })
    expect(texto).toBe('status=s1&logica=ou')
    expect(aplicarFiltroSalvo({ ...base, visao: 'tabela' }, texto)).toMatchObject({ visao: 'tabela', status: ['s1'], logica: 'ou' })
  })
})
