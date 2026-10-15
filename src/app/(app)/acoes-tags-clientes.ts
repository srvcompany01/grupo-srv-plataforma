'use server'

import { revalidatePath } from 'next/cache'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as tarefas from '@/servicos/tarefas'

const COR_HEX = /^#[0-9a-f]{6}$/i

/**
 * Troca a tag de cliente de UMA tarefa e de toda a sua árvore (a mãe de origem e todas as subtarefas),
 * sem mexer nas outras tarefas da lista. Sobe até a raiz e desce de volta para manter a árvore coerente.
 */
export async function definirTagClienteDaTarefa(tarefaId: string, clienteId: string | null): Promise<Resultado> {
  await exigirEquipe()
  if (!tarefaId) return { erro: 'Tarefa inválida.' }
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    await tarefas.definirTagCliente(sb, tarefaId, clienteId)
  }, clienteId ? 'Tag de cliente atualizada nesta tarefa e nas subtarefas.' : 'Tag de cliente removida desta tarefa e das subtarefas.')
  revalidatePath('/', 'layout')
  return resultado
}

/** Edita a identidade visual da tag, compartilhada por todas as listas desse cliente. */
export async function atualizarTagCliente(clienteId: string, nomeInformado: string, corInformada: string): Promise<Resultado> {
  await exigirEquipe()
  const nome = nomeInformado.trim()
  const cor = corInformada.trim().toLowerCase()
  if (!nome) return { erro: 'Informe o nome da tag.' }
  if (!COR_HEX.test(cor)) return { erro: 'Informe uma cor HEX válida, como #3b82f6.' }
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    const { error, count } = await sb.from('clients').update({ name: nome, color: cor }, { count: 'exact' }).eq('id', clienteId)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Nome e cor da tag atualizados.')
  revalidatePath('/', 'layout')
  revalidatePath('/clientes')
  return resultado
}
