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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Aplica o mesmo valor do campo a todas as tarefas selecionadas (máx. 200). Valor vazio limpa o campo. */
export async function salvarValorCampoEmLote(tarefaIds: string[], campoId: string, valor: Json | null): Promise<Resultado> {
  await exigirEquipe()
  const ids = [...new Set(tarefaIds)]
  if (ids.length < 1 || ids.length > 200 || !ids.every((id) => UUID.test(id)) || !UUID.test(campoId)) return { erro: 'Seleção inválida (de 1 a 200 tarefas).' }
  const sb = await criarClienteServidor()
  const resultado = await tentar(() => campos.salvarValorEmLote(sb, ids, campoId, valor), `${ids.length} ${ids.length === 1 ? 'tarefa atualizada' : 'tarefas atualizadas'}.`)
  revalidatePath('/', 'layout')
  return resultado
}

/**
 * Grava vários valores de uma vez (colar ou limpar uma faixa de células). Cada item é uma tarefa + campo + valor (null limpa).
 * Itens com o mesmo campo e valor viram uma gravação só. Máx. 500 itens.
 */
export async function salvarCelulasAcao(itens: { tarefaId: string; campoId: string; valor: Json | null }[], textoOk = 'Células atualizadas.'): Promise<Resultado> {
  await exigirEquipe()
  if (!Array.isArray(itens) || itens.length < 1 || itens.length > 500 || !itens.every((i) => UUID.test(i.tarefaId) && UUID.test(i.campoId))) return { erro: 'Seleção inválida (de 1 a 500 células).' }
  const grupos = new Map<string, { campoId: string; valor: Json | null; tarefas: Set<string> }>()
  for (const i of itens) {
    const chave = `${i.campoId}|${JSON.stringify(i.valor ?? null)}`
    const g = grupos.get(chave) ?? { campoId: i.campoId, valor: i.valor ?? null, tarefas: new Set<string>() }
    g.tarefas.add(i.tarefaId)
    grupos.set(chave, g)
  }
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    for (const g of grupos.values()) await campos.salvarValorEmLote(sb, [...g.tarefas], g.campoId, g.valor)
  }, textoOk)
  revalidatePath('/', 'layout')
  return resultado
}
