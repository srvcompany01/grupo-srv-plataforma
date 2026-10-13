'use server'

import { revalidatePath } from 'next/cache'
import { TIPOS_CAMPO, type ConfigCampo, type TipoCampoPersonalizado } from '@/dominio/personalizacao'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { tentar, type Resultado } from '@/servicos/acao'
import * as campos from '@/servicos/campos-personalizados'

export type ResultadoCampo = { ok?: string; erro?: string; id?: string } | null

export async function criarCampoPersonalizado(dados: {
  espacoId: string | null
  listaId: string
  nome: string
  tipo: TipoCampoPersonalizado
  configuracao: ConfigCampo
  cor: string
  icone: string
}): Promise<ResultadoCampo> {
  await exigirEquipe()
  if (!dados.nome.trim()) return { erro: 'Informe o nome do campo.' }
  if (!TIPOS_CAMPO.has(dados.tipo)) return { erro: 'Tipo de campo inválido.' }
  const sb = await criarClienteServidor()
  let id = ''
  const resultado = await tentar(async () => {
    id = await campos.criarCampo(sb, dados)
  }, 'Campo criado e adicionado à lista.')
  revalidatePath('/', 'layout')
  return { ...(resultado ?? {}), id: resultado?.erro ? undefined : id }
}

export async function adicionarCampoExistente(listaId: string, campoId: string): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const resultado = await tentar(() => campos.vincularCampoALista(sb, listaId, campoId), 'Campo adicionado à lista.')
  revalidatePath('/', 'layout')
  return resultado
}

export async function removerCampoDaLista(listaId: string, campoId: string): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    const { error, count } = await sb
      .from('list_custom_fields')
      .delete({ count: 'exact' })
      .eq('list_id', listaId)
      .eq('field_id', campoId)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Campo removido da lista. Os valores foram preservados caso ele seja adicionado novamente.')
  revalidatePath(`/listas/${listaId}`)
  return resultado
}

export async function salvarValorCampo(tarefaId: string, campoId: string, valor: Json | null): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  let listaId = ''
  const resultado = await tentar(async () => {
    listaId = await campos.salvarValorDoCampo(sb, tarefaId, campoId, valor)
  })
  revalidatePath(`/tarefas/${tarefaId}`)
  if (listaId) revalidatePath(`/listas/${listaId}`)
  return resultado
}
