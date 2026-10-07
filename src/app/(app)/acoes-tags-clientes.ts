'use server'

import { revalidatePath } from 'next/cache'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'

const COR_HEX = /^#[0-9a-f]{6}$/i

/** Troca a tag obrigatoria da lista; o gatilho do banco sincroniza todas as tarefas. */
export async function definirTagClienteDaLista(listaId: string, clienteId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!listaId || !clienteId) return { erro: 'Selecione uma tag de cliente.' }
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    const { error, count } = await sb.from('lists').update({ client_id: clienteId }, { count: 'exact' }).eq('id', listaId)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Tag de cliente atualizada em todas as tarefas.')
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
