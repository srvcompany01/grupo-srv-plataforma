import { describe, expect, it } from 'vitest'
import { formatarDuracao, lerPeriodoPainel, montarPainel, type RegistroPainel, type TarefaPainel } from '@/dominio/painel-projetos'

const t = (p: Partial<TarefaPainel> & { id: string }): TarefaPainel => ({ paiId: null, listaId: 'A', titulo: p.id, categoria: 'todo', concluidaEm: null, prazo: null, ...p })
const r = (tarefaId: string, inicio: string, minutos: number): RegistroPainel => ({ tarefaId, usuarioId: 'eu', inicio, fim: inicio, segundos: minutos * 60 })
const linhas = [{ id: 'A', nome: 'Padaria', cor: '#000', href: '/a' }, { id: 'B', nome: 'Academia', cor: '#000', href: '/b' }, { id: 'C', nome: 'Vazio', cor: '#000', href: '/c' }]

describe('painel dos projetos', () => {
  const tarefas = [
    t({ id: 'mae' }), // tem subtarefas: não conta
    t({ id: 's1', paiId: 'mae', categoria: 'done', concluidaEm: '2026-10-20T15:00:00Z' }),
    t({ id: 's2', paiId: 'mae', categoria: 'in_progress' }),
    t({ id: 'a3', prazo: '2026-10-01' }), // pendente e atrasada
    t({ id: 'b1', listaId: 'B', categoria: 'done', concluidaEm: '2026-08-01T15:00:00Z' }),
    t({ id: 'b2', listaId: 'B', prazo: '2026-12-01' }),
  ]
  const registros = [r('s2', '2026-10-21T13:00:00Z', 120), r('mae', '2026-10-15T13:00:00Z', 60), r('b2', '2026-07-01T13:00:00Z', 600)]
  const painel = montarPainel({ linhas, linhaDa: (x) => x.listaId, tarefas, registros, hoje: '2026-10-22', dias: 30, agoraMs: Date.parse('2026-10-22T15:00:00Z') })

  it('soma tempo e conta só as tarefas folha', () => {
    const [a, b, c] = painel.linhas
    expect([a.id, a.segundosPeriodo / 60, a.total, a.concluidas, a.concluidasPeriodo, a.emAndamento, a.pendentes, a.atrasadas]).toEqual(['A', 180, 3, 1, 1, 1, 1, 1])
    expect([b.id, b.segundosPeriodo, b.segundosTotal / 60, b.concluidas, b.concluidasPeriodo]).toEqual(['B', 0, 600, 1, 0])
    expect(a.participacao).toBe(1)
    expect(c.id).toBe('C')
  })

  it('saúde: ativo nos últimos 7 dias, parado pede atenção, sem nada é vazio', () => {
    expect(painel.linhas.map((l) => l.saude)).toEqual(['saudavel', 'atencao', 'vazio'])
    const tudoFeito = montarPainel({ linhas: [linhas[0]], linhaDa: () => 'A', tarefas: [t({ id: 'x', categoria: 'done' })], registros: [], hoje: '2026-10-22', dias: 30, agoraMs: 0 })
    expect(tudoFeito.linhas[0].saude).toBe('concluido')
  })

  it('totais, semanas e cronômetro rodando', () => {
    expect(painel.totais).toMatchObject({ segundosPeriodo: 180 * 60, total: 5, concluidas: 2, pendentes: 2, atrasadas: 1 })
    expect(painel.semanas).toHaveLength(8)
    expect(painel.semanas.at(-1)).toEqual({ inicio: '2026-10-19', segundos: 120 * 60 })
    expect(painel.inicioPeriodo).toBe('2026-09-23')
    const rodando = montarPainel({ linhas: [linhas[0]], linhaDa: () => 'A', tarefas: [t({ id: 'x' })], registros: [{ tarefaId: 'x', usuarioId: 'eu', inicio: '2026-10-22T14:00:00Z', fim: null, segundos: null }], hoje: '2026-10-22', dias: 7, agoraMs: Date.parse('2026-10-22T15:30:00Z') })
    expect(rodando.linhas[0].segundosPeriodo).toBe(90 * 60)
  })

  it('formatos', () => {
    expect([formatarDuracao(0), formatarDuracao(45 * 60), formatarDuracao(150 * 60), formatarDuracao(120 * 60)]).toEqual(['0min', '45min', '2h 30min', '2h'])
    expect([lerPeriodoPainel('7'), lerPeriodoPainel('x')]).toEqual([7, 30])
  })
})
