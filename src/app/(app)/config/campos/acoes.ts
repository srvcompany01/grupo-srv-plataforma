'use server'

import { revalidatePath } from 'next/cache'
import { normalizarHex } from '@/dominio/campos-gestao'
import { configuracaoPadrao, TIPOS_CAMPO, type ConfigCampo, type TipoCampoPersonalizado } from '@/dominio/personalizacao'
import { posicaoEntre } from '@/dominio/posicao'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor, type Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { tentar, type Resultado } from '@/servicos/acao'
import { dadosGestaoCampos, type DadosGestaoCampos } from '@/servicos/campos-gestao'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function atualizado() {
  revalidatePath('/', 'layout')
}

/** Vincula o campo às listas (a trigger do banco exige que a lista seja do mesmo espaço). */
async function vincular(sb: Supabase, campoId: string, listaIds: string[]) {
  for (const listaId of listaIds) {
    const { data, error } = await sb.from('list_custom_fields').select('position').eq('list_id', listaId).order('position', { ascending: false }).limit(1)
    if (error) throw error
    const { error: erroInserir } = await sb.from('list_custom_fields').insert({ list_id: listaId, field_id: campoId, position: posicaoEntre(data[0]?.position ?? null, null) })
    if (erroInserir) throw erroInserir
  }
}

type Entrada = { nome: string; cor: string; icone: string; configuracao: ConfigCampo; listaIds: string[] }

function validar(e: Entrada): { erro: string } | { nome: string; cor: string; icone: string } {
  const nome = e.nome.trim()
  if (!nome || nome.length > 80) return { erro: 'O nome deve ter de 1 a 80 caracteres.' }
  const cor = normalizarHex(e.cor)
  if (!cor) return { erro: 'Cor inválida. Use o formato #RRGGBB.' }
  if (!/^[a-z0-9-]{1,40}$/.test(e.icone)) return { erro: 'Ícone inválido.' }
  if (!e.listaIds.every((id) => UUID.test(id))) return { erro: 'Lista inválida.' }
  return { nome, cor, icone: e.icone }
}

export async function criarCampoGestaoAcao(espacoId: string | null, tipo: TipoCampoPersonalizado, entrada: Entrada): Promise<Resultado> {
  await exigirAdmin()
  if (!TIPOS_CAMPO.has(tipo)) return { erro: 'Tipo de campo inválido.' }
  if (espacoId !== null && !UUID.test(espacoId)) return { erro: 'Espaço inválido.' }
  const v = validar(entrada)
  if ('erro' in v) return v
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    let consulta = sb.from('custom_fields').select('position').order('position', { ascending: false }).limit(1)
    consulta = espacoId ? consulta.eq('space_id', espacoId) : consulta.is('space_id', null)
    const { data: ultimos, error: e1 } = await consulta
    if (e1) throw e1
    const { data, error } = await sb
      .from('custom_fields')
      .insert({
        space_id: espacoId,
        name: v.nome,
        type: tipo,
        config: { ...configuracaoPadrao(tipo), ...entrada.configuracao } as Json,
        color: v.cor,
        icon: v.icone,
        position: posicaoEntre(ultimos[0]?.position ?? null, null),
      })
      .select('id')
      .single()
    if (error) throw error
    await vincular(sb, data.id, entrada.listaIds)
  }, 'Campo criado.')
  atualizado()
  return r
}

export async function atualizarCampoGestaoAcao(id: string, entrada: Entrada): Promise<Resultado> {
  await exigirAdmin()
  if (!UUID.test(id)) return { erro: 'Campo inválido.' }
  const v = validar(entrada)
  if ('erro' in v) return v
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error } = await sb.from('custom_fields').update({ name: v.nome, color: v.cor, icon: v.icone, config: entrada.configuracao as Json, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    const { data: atuais, error: e2 } = await sb.from('list_custom_fields').select('list_id').eq('field_id', id)
    if (e2) throw e2
    const antes = new Set(atuais.map((x) => x.list_id))
    const depois = new Set(entrada.listaIds)
    const remover = [...antes].filter((l) => !depois.has(l))
    if (remover.length) {
      const { error: e3 } = await sb.from('list_custom_fields').delete().eq('field_id', id).in('list_id', remover)
      if (e3) throw e3
    }
    await vincular(sb, id, [...depois].filter((l) => !antes.has(l)))
  }, 'Campo atualizado.')
  atualizado()
  return r
}

/** Arquiva: some das listas, mas os valores já preenchidos nas tarefas são preservados. */
export async function arquivarCampoGestaoAcao(id: string): Promise<Resultado> {
  await exigirAdmin()
  if (!UUID.test(id)) return { erro: 'Campo inválido.' }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error } = await sb.from('custom_fields').update({ archived_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  }, 'Campo arquivado.')
  atualizado()
  return r
}

/** Dados da gestão sob demanda, para o editor aberto a partir do cabeçalho da lista. */
export async function dadosGestaoCamposAcao(): Promise<DadosGestaoCampos> {
  await exigirAdmin()
  return dadosGestaoCampos(await criarClienteServidor())
}
