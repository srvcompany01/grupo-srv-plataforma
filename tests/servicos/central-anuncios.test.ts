import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ md: vi.fn(), mr: vi.fn(), gd: vi.fn(), gc: vi.fn(), graph: vi.fn() }))
vi.mock('@/servicos/meta-anuncios', () => ({ pagoPorDiaMeta: api.md, resumoMetaPorTipo: api.mr }))
vi.mock('@/servicos/google-agencia', () => ({ pagoPorDiaGoogle: api.gd, estruturaGoogle: api.gc }))
vi.mock('@/servicos/publicacao-meta', () => ({ graph: api.graph }))
import { contaCentralAnuncios } from '@/servicos/central-anuncios'

describe('leitura da central de anúncios', () => {
  beforeEach(() => { vi.resetAllMocks() })
  it('consulta somente o canal escolhido e usa conversões da conta, inclusive de campanhas que foram pausadas', async () => {
    api.gd.mockResolvedValue([{ dia: '2026-11-01', gasto: 150, cliques: 25, conversoes: 7.5 }])
    api.gc.mockResolvedValue([{ status: 'ENABLED', conversoes: 2 }, { status: 'PAUSED', conversoes: 1 }])
    const conta = await contaCentralAnuncios('a', 'Cliente', 'm', 'g', '2026-11-01', '2026-11-02', true, 'google')
    expect(api.md).not.toHaveBeenCalled()
    expect(api.mr).not.toHaveBeenCalled()
    expect(api.graph).not.toHaveBeenCalled()
    expect(conta.meta).toBeNull()
    expect(conta.google).toMatchObject({ gasto: 150, resultados: 7.5, ativas: 1, pausadas: 1 })
  })
  it('não mostra zero quando a agência está desconectada do Google', async () => {
    const conta = await contaCentralAnuncios('b', 'Cliente', null, 'g', '2026-11-01', '2026-11-02', false, 'todos')
    expect(api.gd).not.toHaveBeenCalled()
    expect(api.gc).not.toHaveBeenCalled()
    expect(conta.google).toMatchObject({ gasto: null, resultados: null, ativas: null })
    expect(conta.erros[0]).toContain('conecte a conta')
  })
  it('preserva resultados parciais e pagina a contagem de campanhas Meta', async () => {
    api.md.mockResolvedValue({ erro: 'Indisponível' })
    api.mr.mockResolvedValue({ captacao: { leads: 8, gasto: 80 } })
    api.graph.mockResolvedValueOnce({ data: [{ id: '1', status: 'ACTIVE' }], paging: { next: 'outra-pagina', cursors: { after: 'cursor' } } }).mockResolvedValueOnce({ data: [{ id: '2', status: 'PAUSED' }] })
    const conta = await contaCentralAnuncios('c', 'Cliente', 'm', null, '2026-11-01', '2026-11-02', false, 'meta')
    expect(conta.meta).toMatchObject({ gasto: null, resultados: 8, gastoCaptacao: 80, ativas: 1, pausadas: 1 })
    expect(conta.erros).toEqual(['Investimento Meta: Indisponível'])
    expect(api.graph).toHaveBeenCalledTimes(2)
    expect(api.graph.mock.calls[1][1].params.after).toBe('cursor')
  })
})
