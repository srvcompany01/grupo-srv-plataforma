'use server'

import { revalidatePath } from 'next/cache'
import { configuracaoPadrao, TIPOS_CAMPO, type ConfigCampo, type TipoCampoPersonalizado } from '@/dominio/personalizacao'
import { posicaoEntre } from '@/dominio/posicao'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { tentar, type Resultado } from '@/servicos/acao'

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
    let consultaPosicao = sb
      .from('custom_fields')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
    consultaPosicao = dados.espacoId ? consultaPosicao.eq('space_id', dados.espacoId) : consultaPosicao.is('space_id', null)
    const { data: ultimos, error: erroPosicao } = await consultaPosicao
    if (erroPosicao) throw erroPosicao
    const configuracao = { ...configuracaoPadrao(dados.tipo), ...dados.configuracao }
    const { data, error } = await sb
      .from('custom_fields')
      .insert({
        space_id: dados.espacoId,
        name: dados.nome.trim(),
        type: dados.tipo,
        config: configuracao as Json,
        color: /^#[0-9a-f]{6}$/i.test(dados.cor) ? dados.cor : '#6647f0',
        icon: dados.icone,
        position: posicaoEntre(ultimos[0]?.position ?? null, null),
      })
      .select('id')
      .single()
    if (error) throw error
    id = data.id
    const { data: vinculos, error: erroVinculos } = await sb
      .from('list_custom_fields')
      .select('position')
      .eq('list_id', dados.listaId)
      .order('position', { ascending: false })
      .limit(1)
    if (erroVinculos) throw erroVinculos
    const vinculo = await sb.from('list_custom_fields').insert({
      list_id: dados.listaId,
      field_id: id,
      position: posicaoEntre(vinculos[0]?.position ?? null, null),
    })
    if (vinculo.error) throw vinculo.error
  }, 'Campo criado e adicionado à lista.')
  revalidatePath('/', 'layout')
  return { ...(resultado ?? {}), id: resultado?.erro ? undefined : id }
}

export async function adicionarCampoExistente(listaId: string, campoId: string): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    const { data, error } = await sb
      .from('list_custom_fields')
      .select('position')
      .eq('list_id', listaId)
      .order('position', { ascending: false })
      .limit(1)
    if (error) throw error
    const inserir = await sb.from('list_custom_fields').insert({ list_id: listaId, field_id: campoId, position: posicaoEntre(data[0]?.position ?? null, null) })
    if (inserir.error) throw inserir.error
  }, 'Campo adicionado à lista.')
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
  const vazio = valor == null || valor === '' || (Array.isArray(valor) && valor.length === 0)
  let listaId = ''
  const resultado = await tentar(async () => {
    const { data: tarefa, error: erroTarefa } = await sb.from('tasks').select('list_id').eq('id', tarefaId).single()
    if (erroTarefa) throw erroTarefa
    listaId = tarefa.list_id
    if (vazio) {
      const { error } = await sb.from('task_custom_field_values').delete().eq('task_id', tarefaId).eq('field_id', campoId)
      if (error) throw error
      return
    }
    const { error } = await sb.from('task_custom_field_values').upsert({ task_id: tarefaId, field_id: campoId, value: valor })
    if (error) throw error
  })
  revalidatePath(`/tarefas/${tarefaId}`)
  if (listaId) revalidatePath(`/listas/${listaId}`)
  return resultado
}
