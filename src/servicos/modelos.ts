import type { Supabase } from '@/infra/supabase/servidor'
import { criarTarefa } from './tarefas'

export type ModeloTarefa = { id: string; nome: string; titulo: string; subtarefas: string[]; criadoPor: string }

export async function listarModelos(sb: Supabase): Promise<ModeloTarefa[]> {
  const { data, error } = await sb.from('task_templates').select('id, name, title, subtasks, created_by').order('name')
  if (error) return [] // sem a migration, o menu só não mostra modelos
  return data.map((m) => ({ id: m.id, nome: m.name, titulo: m.title, subtarefas: m.subtasks, criadoPor: m.created_by }))
}

export async function salvarModelo(sb: Supabase, m: { nome: string; titulo: string; subtarefas: string[] }): Promise<void> {
  const { error } = await sb.from('task_templates').insert({ name: m.nome, title: m.titulo, subtasks: m.subtarefas })
  if (error) throw error
}

export async function excluirModelo(sb: Supabase, id: string): Promise<void> {
  const { error } = await sb.from('task_templates').delete().eq('id', id)
  if (error) throw error
}

/** Cria a tarefa do modelo na lista e, dentro dela, uma subtarefa por linha do modelo. Devolve o id da tarefa. */
export async function criarDoModelo(sb: Supabase, modeloId: string, listaId: string, euId: string): Promise<string> {
  const { data, error } = await sb.from('task_templates').select('title, subtasks').eq('id', modeloId).single()
  if (error) throw error
  const id = await criarTarefa(sb, { listaId, titulo: data.title, responsaveis: [euId] })
  for (const sub of data.subtasks) await criarTarefa(sb, { listaId, titulo: sub, responsaveis: [euId], paiId: id })
  return id
}
