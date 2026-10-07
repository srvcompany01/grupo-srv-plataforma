import type { Json } from '@/infra/supabase/tipos'

export const PRIORIDADES = ['urgente', 'alta', 'normal', 'baixa'] as const
export type Prioridade = (typeof PRIORIDADES)[number]

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  normal: 'Normal',
  baixa: 'Baixa',
}

export type Categoria = 'todo' | 'in_progress' | 'done'

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  done: 'Concluído',
}

export type StatusLista = { id: string; nome: string; cor: string; categoria: Categoria }

export type Pessoa = { id: string; nome: string; avatar: string | null }

export type TarefaResumo = {
  id: string
  titulo: string
  paiId: string | null
  statusId: string
  prioridade: Prioridade
  /** YYYY-MM-DD */
  prazo: string | null
  posicao: string
  responsaveis: Pessoa[]
  tags: { id: string; nome: string; cor: string }[]
  listaId: string
  listaNome: string
  clienteNome: string
  concluidaEm: string | null
  /** Valores dos campos vinculados à lista, indexados pelo id da definição. */
  camposPersonalizados?: Record<string, Json | null>
}

export type No<T> = T & { filhos: No<T>[] }

const porPosicao = (a: { posicao: string }, b: { posicao: string }) =>
  a.posicao < b.posicao ? -1 : a.posicao > b.posicao ? 1 : 0

/** Monta a árvore de subtarefas. Filha cuja mãe não veio na consulta aparece como raiz. */
export function montarArvore(tarefas: TarefaResumo[]): No<TarefaResumo>[] {
  const nos = new Map(tarefas.map((t) => [t.id, { ...t, filhos: [] as No<TarefaResumo>[] }]))
  const raizes: No<TarefaResumo>[] = []
  for (const no of nos.values()) {
    const mae = no.paiId ? nos.get(no.paiId) : undefined
    if (mae) mae.filhos.push(no)
    else raizes.push(no)
  }
  const ordenar = (lista: No<TarefaResumo>[]) => {
    lista.sort(porPosicao)
    lista.forEach((n) => ordenar(n.filhos))
  }
  ordenar(raizes)
  return raizes
}

export function agruparPorStatus<S extends { id: string }>(
  raizes: No<TarefaResumo>[],
  status: S[],
): { status: S; tarefas: No<TarefaResumo>[] }[] {
  return status.map((s) => ({ status: s, tarefas: raizes.filter((t) => t.statusId === s.id) }))
}
