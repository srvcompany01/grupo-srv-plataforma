'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { lerFormCliente } from '@/servicos/clientes-plataforma'

// Cliente do usuário: a RLS só permite admin e gestores.

export async function criarCliente(_: Resultado, form: FormData): Promise<Resultado> {
  await exigirEquipe()
  const campos = lerFormCliente(form)
  if (!campos.name) return { erro: 'Informe o nome do cliente.' }
  const sb = await criarClienteServidor()
  let id = ''
  const r = await tentar(async () => {
    const { data, error } = await sb.from('clients').insert(campos).select('id').single()
    if (error) throw error
    id = data.id
  })
  if (r?.erro) return r
  revalidatePath('/clientes')
  redirect(`/clientes/${id}`)
}

export async function editarCliente(id: string, _: Resultado, form: FormData): Promise<Resultado> {
  await exigirEquipe()
  const campos = lerFormCliente(form)
  if (!campos.name) return { erro: 'Informe o nome do cliente.' }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error, count } = await sb.from('clients').update(campos, { count: 'exact' }).eq('id', id)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Cliente atualizado.')
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return r
}

/** Exclusão definitiva (só admin, pela RLS). Recusada pelo banco se o cliente ainda tem listas, tarefas, documentos ou usuários. */
export async function excluirCliente(id: string): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { data, error } = await sb.from('clients').delete().eq('id', id).select('id')
    if (error) throw error
    if (!data.length) throw { code: '42501' }
  }, 'Cliente excluído.')
  revalidatePath('/clientes')
  return r
}
