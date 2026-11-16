import { describe, expect, it } from 'vitest'
import { resumirAgendaHome, resumirHome, ordenarPrioridades, type PostHome } from '@/dominio/home'
import type { TarefaResumo, StatusLista } from '@/dominio/tarefas'
import type { Ocorrencia } from '@/dominio/agenda'

const hoje = '2026-11-16'
const status: Record<string, StatusLista[]> = { lista: [{ id: 'aberta', nome: 'Em andamento', categoria: 'in_progress', cor: '#000' }, { id: 'feita', nome: 'Finalizada', categoria: 'done', cor: '#000' }] }
const tarefa = (id: string, extra: Partial<TarefaResumo> = {}): TarefaResumo => ({ id, titulo: id, paiId: null, listaId: 'lista', listaNome: 'Conteúdo', statusId: 'aberta', prioridade: 'normal', prazo: null, posicao: id, responsaveis: [], tags: [], clienteId: 'cliente', clienteNome: 'Cliente', clienteCor: '#000', concluidaEm: null, ...extra })
const post = (id: string, extra: Partial<PostHome> = {}): PostHome => ({ tarefaId: id, aprovacao: 'aguardando', status: 'nao_agendado', em: null, ...extra })

describe('resumo da Home', () => {
  it('exclui concluídas pela data ou categoria e inclui subtarefas vencidas', () => {
    const tarefas = [tarefa('mae'), tarefa('sub', { paiId: 'mae', prazo: '2026-11-10' }), tarefa('feita', { statusId: 'feita', prazo: '2026-11-01' }), tarefa('data', { concluidaEm: '2026-11-12', prazo: '2026-11-01' })]
    const r = resumirHome(tarefas, tarefas, status, [], hoje)
    expect(r.pessoais.map((t) => t.id)).toEqual(['mae', 'sub'])
    expect(r.atrasadas).toBe(1)
    expect(r.categoria(tarefas[3])).toBe('done')
  })
  it('conta aprovações reais, ajustes e falhas somente dos posts visíveis e não publicados', () => {
    const tarefas = ['aguarda', 'ajuste', 'falhou', 'publicado', 'agendado'].map((id) => tarefa(id, { paiId: 'mae' }))
    const posts = [post('aguarda'), post('ajuste', { aprovacao: 'ajuste' }), post('falhou', { status: 'falhou', aprovacao: 'aprovado' }), post('publicado', { status: 'publicado' }), post('agendado', { status: 'agendado', aprovacao: 'aprovado' }), post('oculto')]
    const r = resumirHome(tarefas, [], status, posts, hoje)
    expect(r.aguardando.map((p) => p.tarefaId)).toEqual(['aguarda'])
    expect(r.ajustes.map((p) => p.tarefaId)).toEqual(['ajuste'])
    expect(r.falhas.map((p) => p.tarefaId)).toEqual(['falhou'])
    expect(r.agendados.map((p) => p.tarefaId)).toEqual(['agendado'])
  })
  it('conta hoje e os próximos sete dias sem incluir datas além da semana', () => {
    const tarefas = [tarefa('hoje', { prazo: hoje }), tarefa('amanha', { prazo: '2026-11-17' }), tarefa('limite', { prazo: '2026-11-23' }), tarefa('depois', { prazo: '2026-11-24' }), tarefa('sem')]
    const r = resumirHome(tarefas, tarefas, status, [], hoje)
    expect([r.hoje, r.semana, r.semPrazo]).toEqual([1, 2, 1])
  })
  it('prioriza vencidas, hoje e urgentes sem prazo, sem alterar a lista original', () => {
    const tarefas = [tarefa('normal'), tarefa('urgente', { prioridade: 'urgente' }), tarefa('hoje', { prazo: hoje }), tarefa('ontem', { prazo: '2026-11-15' }), tarefa('alta', { prazo: hoje, prioridade: 'alta' })]
    expect(ordenarPrioridades(tarefas, hoje).map((t) => t.id)).toEqual(['ontem', 'alta', 'hoje', 'urgente', 'normal'])
    expect(tarefas[0].id).toBe('normal')
  })
})

describe('agenda da Home', () => {
  const evento = (id: string, inicio: string, fim: string): Ocorrencia => ({ id, titulo: id, inicio, fim, diaInteiro: false })
  it('conta o dia inteiro antes de limitar a prévia e não chama um evento encerrado de próximo', () => {
    const eventos = Array.from({ length: 9 }, (_, i) => evento(String(i), `2026-11-16T${String(i + 8).padStart(2, '0')}:00:00-03:00`, `2026-11-16T${String(i + 9).padStart(2, '0')}:00:00-03:00`))
    const r = resumirAgendaHome(eventos, new Date('2026-11-16T14:30:00-03:00'), hoje)
    expect(r.doDia).toHaveLength(9)
    expect(r.proximo?.id).toBe('6')
    expect(r.proximos).toHaveLength(3)
  })
  it('inclui eventos que atravessam o dia e respeita o fim exclusivo à meia-noite', () => {
    const eventos = [evento('acabou', '2026-11-15T12:00:00-03:00', '2026-11-16T00:00:00-03:00'), evento('atravessa', '2026-11-15T12:00:00-03:00', '2026-11-17T00:00:00-03:00')]
    expect(resumirAgendaHome(eventos, new Date('2026-11-16T09:00:00-03:00'), hoje).doDia.map((e) => e.id)).toEqual(['atravessa'])
  })
  it('ordena eventos do Google em UTC e compromissos locais pelo instante real', () => {
    const eventos = [evento('local', '2026-11-16T08:00:00-03:00', '2026-11-16T09:00:00-03:00'), evento('google', '2026-11-16T10:00:00Z', '2026-11-16T10:30:00Z')]
    expect(resumirAgendaHome(eventos, new Date('2026-11-16T06:00:00-03:00'), hoje).proximos.map((e) => e.id)).toEqual(['google', 'local'])
  })
})
