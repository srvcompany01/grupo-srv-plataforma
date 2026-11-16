import { dataLocal, instante, somarDias, type Ocorrencia } from './agenda'
import type { Categoria, StatusLista, TarefaResumo } from './tarefas'

export type PostHome = { tarefaId: string; aprovacao: string; status: string; em: string | null }

export function tarefaConcluida(t: TarefaResumo, status: Record<string, StatusLista[]>): boolean {
  return !!t.concluidaEm || status[t.listaId]?.some((s) => s.id === t.statusId && s.categoria === 'done') === true
}

/** O prazo vem primeiro; a prioridade desempata tarefas do mesmo dia. Urgentes sem prazo também aparecem. */
export function ordenarPrioridades(tarefas: TarefaResumo[], hoje: string): TarefaResumo[] {
  const peso = { urgente: 0, alta: 1, normal: 2, baixa: 3 }
  const grupo = (t: TarefaResumo) => t.prazo && t.prazo < hoje ? 0 : t.prazo === hoje ? 1 : t.prioridade === 'urgente' ? 2 : 3
  return [...tarefas].sort((a, b) => grupo(a) - grupo(b) || (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999') || peso[a.prioridade] - peso[b.prioridade] || a.titulo.localeCompare(b.titulo, 'pt-BR'))
}

/** Conta também subtarefas. Não depende de nomes de status para descobrir aprovações de posts. */
export function resumirHome(tarefas: TarefaResumo[], minhas: TarefaResumo[], status: Record<string, StatusLista[]>, posts: PostHome[], hoje: string) {
  const abertas = tarefas.filter((t) => !tarefaConcluida(t, status))
  const pessoais = minhas.filter((t) => !tarefaConcluida(t, status))
  const ids = new Set(tarefas.map((t) => t.id))
  const conteudo = posts.filter((p) => ids.has(p.tarefaId))
  const aguardando = conteudo.filter((p) => p.aprovacao === 'aguardando' && p.status !== 'publicado')
  const ajustes = conteudo.filter((p) => p.aprovacao === 'ajuste' && p.status !== 'publicado')
  const falhas = conteudo.filter((p) => p.status === 'falhou')
  const agendados = conteudo.filter((p) => p.status === 'agendado')
  return {
    abertas, pessoais, aguardando, ajustes, falhas, agendados,
    prioridades: ordenarPrioridades(pessoais, hoje),
    atrasadas: pessoais.filter((t) => t.prazo && t.prazo < hoje).length,
    hoje: pessoais.filter((t) => t.prazo === hoje).length,
    semana: pessoais.filter((t) => t.prazo && t.prazo > hoje && t.prazo <= somarDias(hoje, 7)).length,
    semPrazo: pessoais.filter((t) => !t.prazo).length,
    categoria: (t: TarefaResumo): Categoria => tarefaConcluida(t, status) ? 'done' : status[t.listaId]?.find((s) => s.id === t.statusId)?.categoria ?? 'todo',
  }
}

/** Inclui eventos que atravessam a meia-noite; o fim de um evento é exclusivo. */
export function resumirAgendaHome(eventos: Ocorrencia[], agora: Date, hoje: string) {
  const inicio = instante(hoje).getTime()
  const fim = instante(somarDias(hoje, 1)).getTime()
  const ordenados = [...eventos].sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
  const doDia = ordenados.filter((e) => Date.parse(e.inicio) < fim && Date.parse(e.fim) > inicio)
  const proximos = ordenados.filter((e) => Date.parse(e.fim) > agora.getTime() && dataLocal(e.inicio) <= somarDias(hoje, 14))
  return { doDia, proximos, proximo: proximos[0] }
}
