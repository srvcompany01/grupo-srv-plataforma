'use server'

import { revalidatePath } from 'next/cache'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'

const COR_HEX = /^#[0-9a-f]{6}$/i

/**
 * Troca a tag de cliente de UMA tarefa e de toda a sua árvore (a mãe de origem e todas as subtarefas),
 * sem mexer nas outras tarefas da lista. Sobe até a raiz e desce de volta para manter a árvore coerente.
 */
export async function definirTagClienteDaTarefa(tarefaId: string, clienteId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!tarefaId || !clienteId) return { erro: 'Selecione uma tag de cliente.' }
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    const { data: tarefa, error } = await sb.from('tasks').select('id, parent_task_id, list_id').eq('id', tarefaId).single()
    if (error) throw error
    const { data: todas, error: erroLista } = await sb.from('tasks').select('id, parent_task_id').eq('list_id', tarefa.list_id).is('archived_at', null)
    if (erroLista) throw erroLista
    const paiDe = new Map(todas.map((t) => [t.id, t.parent_task_id]))
    let raiz = tarefa.id
    while (paiDe.get(raiz)) raiz = paiDe.get(raiz) as string
    const ids = new Set([raiz])
    let achou = true
    while (achou) {
      achou = false
      for (const [id, pai] of paiDe) if (pai && ids.has(pai) && !ids.has(id)) { ids.add(id); achou = true }
    }
    const { error: erroUpdate, count } = await sb.from('tasks').update({ client_id: clienteId }, { count: 'exact' }).in('id', [...ids])
    if (erroUpdate) throw erroUpdate
    if (!count) throw { code: '42501' }
  }, 'Tag de cliente atualizada nesta tarefa e nas subtarefas.')
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
