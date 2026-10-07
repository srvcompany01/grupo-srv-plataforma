'use server'

import { revalidatePath } from 'next/cache'
import { TIPOS_CAMPO_CLIENTE } from '@/dominio/clientes-galeria'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function atualizado() {
  revalidatePath('/config/campos-clientes')
  revalidatePath('/clientes')
}

export async function criarCampoClienteAcao(nome: string, tipo: string, naCapa: boolean): Promise<Resultado> {
  await exigirAdmin()
  const limpo = nome.trim()
  if (!limpo) return { erro: 'Informe o nome do campo.' }
  if (limpo.length > 60) return { erro: 'O nome deve ter até 60 caracteres.' }
  const kind = TIPOS_CAMPO_CLIENTE.find((t) => t.tipo === tipo)?.tipo ?? 'texto'
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { data: ultimo, error: e1 } = await sb.from('client_fields').select('position').order('position', { ascending: false }).limit(1)
    if (e1) throw e1
    const { error } = await sb.from('client_fields').insert({ name: limpo, kind, show_on_card: naCapa, position: (ultimo[0]?.position ?? 0) + 1 })
    if (error) throw error
  }, 'Campo criado.')
  atualizado()
  return r
}

export async function atualizarCampoClienteAcao(id: string, mudanca: { nome?: string; naCapa?: boolean }): Promise<Resultado> {
  await exigirAdmin()
  if (!UUID.test(id)) return { erro: 'Campo inválido.' }
  const campos: { name?: string; show_on_card?: boolean } = {}
  if (mudanca.nome !== undefined) {
    const nome = mudanca.nome.trim()
    if (!nome || nome.length > 60) return { erro: 'O nome deve ter de 1 a 60 caracteres.' }
    campos.name = nome
  }
  if (mudanca.naCapa !== undefined) campos.show_on_card = mudanca.naCapa
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error } = await sb.from('client_fields').update(campos).eq('id', id)
    if (error) throw error
  }, 'Campo atualizado.')
  atualizado()
  return r
}

export async function excluirCampoClienteAcao(id: string): Promise<Resultado> {
  await exigirAdmin()
  if (!UUID.test(id)) return { erro: 'Campo inválido.' }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error } = await sb.from('client_fields').delete().eq('id', id)
    if (error) throw error
  }, 'Campo excluído.')
  atualizado()
  return r
}
