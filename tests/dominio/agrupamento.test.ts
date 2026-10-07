import { expect, it } from 'vitest'
import { agruparTarefas, lerAgrupamento } from '@/dominio/agrupamento'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import type { No, Pessoa, StatusLista, TarefaResumo } from '@/dominio/tarefas'

const status: StatusLista[] = [
  { id: 's1', nome: 'A fazer', cor: '#111111', categoria: 'todo' },
  { id: 's2', nome: 'Feito', cor: '#222222', categoria: 'done' },
]
const ana: Pessoa = { id: 'p1', nome: 'Ana', avatar: null }
const beto: Pessoa = { id: 'p2', nome: 'Beto', avatar: null }
const CAMPO = '0b9c6d36-1d8e-4f43-8d5c-123456789abc'

function tarefa(id: string, extra: Partial<TarefaResumo> = {}): No<TarefaResumo> {
  return {
    id, titulo: id, paiId: null, statusId: 's1', prioridade: 'normal', prazo: null, posicao: id, responsaveis: [], tags: [],
    listaId: 'l', listaNome: 'L', clienteId: 'c1', clienteNome: 'Acme', clienteCor: '#ff0000', concluidaEm: null, filhos: [], ...extra,
  }
}
const campo = (tipo: DefinicaoCampo['tipo'], configuracao: DefinicaoCampo['configuracao'] = {}): DefinicaoCampo =>
  ({ id: CAMPO, espacoId: null, nome: 'C', tipo, configuracao, cor: '#000000', icone: 'type' })
const ctx = (campos: DefinicaoCampo[] = []) => ({ status, campos, equipe: [ana, beto] })
const ids = (g: { tarefas: { id: string }[] }) => g.tarefas.map((t) => t.id)

it('valida o parâmetro de agrupamento', () => {
  expect(lerAgrupamento('nenhum')).toBe('nenhum')
  expect(lerAgrupamento(`campo:${CAMPO}`)).toBe(`campo:${CAMPO}`)
  expect(lerAgrupamento('campo:xyz')).toBe('status')
  expect(lerAgrupamento('qualquer')).toBe('status')
})

it('sem agrupamento devolve um grupo só, sem cabeçalho', () => {
  const g = agruparTarefas([tarefa('a'), tarefa('b')], 'nenhum', ctx())
  expect(g).toHaveLength(1)
  expect(g[0].semCabecalho).toBe(true)
  expect(ids(g[0])).toEqual(['a', 'b'])
})

it('status mantém todos os status, mesmo vazios', () => {
  const g = agruparTarefas([tarefa('a', { statusId: 's2' })], 'status', ctx())
  expect(g.map((x) => x.id)).toEqual(['s1', 's2'])
  expect(ids(g[1])).toEqual(['a'])
})

it('agrupa por mês do prazo com "Sem valor" no fim', () => {
  const g = agruparTarefas([tarefa('a'), tarefa('b', { prazo: '2026-11-03' }), tarefa('c', { prazo: '2026-10-20' })], 'mes', ctx())
  expect(g.map((x) => x.id)).toEqual(['2026-10', '2026-11', '__sem-valor'])
})

it('responsável com vários valores aparece em cada grupo', () => {
  const g = agruparTarefas([tarefa('a', { responsaveis: [ana, beto] }), tarefa('b', { responsaveis: [beto] }), tarefa('c')], 'responsavel', ctx())
  expect(g.map((x) => [x.nome, ids(x)])).toEqual([['Ana', ['a']], ['Beto', ['a', 'b']], ['Sem valor', ['c']]])
})

it('lista suspensa segue a ordem das opções e usa a cor da opção', () => {
  const def = campo('dropdown', { options: ['Baixo', 'Alto'], optionColors: { Alto: '#123456' } })
  const g = agruparTarefas([
    tarefa('a', { camposPersonalizados: { [CAMPO]: 'Alto' } }),
    tarefa('b', { camposPersonalizados: { [CAMPO]: 'Baixo' } }),
    tarefa('c'),
  ], `campo:${CAMPO}`, ctx([def]))
  expect(g.map((x) => x.nome)).toEqual(['Baixo', 'Alto', 'Sem valor'])
  expect(g[1].cor).toBe('#123456')
})

it('caixa de seleção: Sim e Não, sem "Sem valor"', () => {
  const g = agruparTarefas([tarefa('a', { camposPersonalizados: { [CAMPO]: true } }), tarefa('b')], `campo:${CAMPO}`, ctx([campo('checkbox')]))
  expect(g.map((x) => [x.nome, ids(x)])).toEqual([['Sim', ['a']], ['Não', ['b']]])
})

it('campo que não existe ou não agrupa cai em status', () => {
  expect(agruparTarefas([tarefa('a')], `campo:${CAMPO}`, ctx()).map((x) => x.id)).toEqual(['s1', 's2'])
  expect(agruparTarefas([tarefa('a')], `campo:${CAMPO}`, ctx([campo('number')])).map((x) => x.id)).toEqual(['s1', 's2'])
})
