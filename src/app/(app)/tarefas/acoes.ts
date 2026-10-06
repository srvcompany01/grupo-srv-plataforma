'use server'

import { revalidatePath } from 'next/cache'
import type { Categoria } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as status from '@/servicos/status'
import * as tarefas from '@/servicos/tarefas'

// Ações de tarefa usadas pela lista, pelo Kanban, pelo departamento e pelo painel da tarefa.
// Tudo pelo cliente do usuário: a RLS e as regras do banco decidem.

async function executar(fn: (sb: Awaited<ReturnType<typeof criarClienteServidor>>) => Promise<unknown>, ok?: string) {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(() => fn(sb), ok)
  revalidatePath('/', 'layout')
  return r
}

export async function criarTarefaAcao(d: {
  listaId: string
  titulo: string
  responsaveis: string[]
  paiId?: string | null
  statusId?: string | null
}): Promise<Resultado> {
  if (!d.titulo.trim()) return { erro: 'Informe o título.' }
  return executar((sb) => tarefas.criarTarefa(sb, { ...d, titulo: d.titulo.trim() }), 'Tarefa criada.')
}

export async function atualizarTarefaAcao(id: string, campos: tarefas.CamposTarefa): Promise<Resultado> {
  if (campos.titulo !== undefined && !campos.titulo.trim()) return { erro: 'O título não pode ficar vazio.' }
  return executar((sb) => tarefas.atualizarTarefa(sb, id, campos))
}

export async function definirResponsaveisAcao(id: string, ids: string[]): Promise<Resultado> {
  return executar((sb) => tarefas.definirResponsaveis(sb, id, ids))
}

export async function moverTarefaAcao(id: string, statusId: string, posicao: string): Promise<Resultado> {
  return executar((sb) => tarefas.moverTarefa(sb, id, statusId, posicao))
}

export async function moverParaListaAcao(id: string, listaId: string): Promise<Resultado> {
  return executar((sb) => tarefas.moverParaLista(sb, id, listaId), 'Tarefa movida.')
}

export async function arquivarTarefaAcao(id: string): Promise<Resultado> {
  return executar((sb) => tarefas.arquivarTarefa(sb, id), 'Tarefa arquivada.')
}

export async function criarStatusAcao(listaId: string, nome: string, cor: string, categoria: Categoria): Promise<Resultado> {
  if (!nome.trim()) return { erro: 'Informe o nome do status.' }
  return executar((sb) => status.criarStatus(sb, listaId, nome.trim(), cor, categoria), 'Status criado.')
}

export async function atualizarStatusAcao(id: string, campos: { nome?: string; cor?: string; categoria?: Categoria }): Promise<Resultado> {
  return executar((sb) => status.atualizarStatus(sb, id, campos))
}

export async function removerStatusAcao(id: string, destinoId: string): Promise<Resultado> {
  return executar((sb) => status.removerStatus(sb, id, destinoId), 'Status removido.')
}

export async function reposicionarStatusAcao(id: string, antes: string | null, depois: string | null): Promise<Resultado> {
  return executar((sb) => status.reposicionarStatus(sb, id, antes, depois))
}
