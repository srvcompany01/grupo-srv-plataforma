'use server'

import { revalidatePath } from 'next/cache'
import { ICONES_PERSONALIZACAO } from '@/dominio/personalizacao'
import { posicaoEntre } from '@/dominio/posicao'
import { exigirAdmin, exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as estrutura from '@/servicos/estrutura'

type Visual = { cor: string; icone: string; emoji: string | null }
export type ResultadoCriacao = { ok?: string; erro?: string; id?: string } | null
type AlvoMovimento = { tipo: 'root' } | { tipo: 'space' | 'folder' | 'list'; id: string }

function validarVisual(visual: Visual): Visual {
  return {
    cor: /^#[0-9a-f]{6}$/i.test(visual.cor) ? visual.cor : '#70262d',
    icone: (ICONES_PERSONALIZACAO as readonly string[]).includes(visual.icone) ? visual.icone : 'layers-3',
    emoji: visual.emoji?.trim().slice(0, 8) || null,
  }
}

async function ultimaPosicaoEspaco(paiId: string | null) {
  const sb = await criarClienteServidor()
  let q = sb.from('spaces').select('position').is('archived_at', null).order('position', { ascending: false }).limit(1)
  q = paiId ? q.eq('parent_id', paiId) : q.is('parent_id', null)
  const { data, error } = await q
  if (error) throw error
  return { sb, posicao: posicaoEntre(data[0]?.position ?? null, null) }
}

export async function criarEspacoNavegacao(dados: {
  nome: string
  descricao: string
  paiId: string | null
  visual: Visual
}): Promise<ResultadoCriacao> {
  await exigirAdmin()
  const nome = dados.nome.trim()
  if (!nome) return { erro: 'Informe o nome do espaço.' }
  let id = ''
  const resultado = await tentar(async () => {
    const { sb, posicao } = await ultimaPosicaoEspaco(dados.paiId)
    const visual = validarVisual(dados.visual)
    const { data, error } = await sb
      .from('spaces')
      .insert({
        name: nome,
        description: dados.descricao.trim() || null,
        parent_id: dados.paiId,
        color: visual.cor,
        icon: visual.icone,
        emoji: visual.emoji,
        position: posicao,
      })
      .select('id')
      .single()
    if (error) throw error
    id = data.id
  }, 'Espaço criado.')
  revalidatePath('/', 'layout')
  return { ...(resultado ?? {}), id: resultado?.erro ? undefined : id }
}

export async function criarPastaNavegacao(dados: {
  espacoId: string | null
  nome: string
  visual: Visual
}): Promise<ResultadoCriacao> {
  await exigirEquipe()
  const nome = dados.nome.trim()
  if (!nome) return { erro: 'Informe o nome da pasta.' }
  const sb = await criarClienteServidor()
  const resultado = await tentar(
    () => estrutura.criarPasta(sb, dados.espacoId, nome, validarVisual(dados.visual)),
    'Pasta criada.',
  )
  revalidatePath('/', 'layout')
  return resultado
}

export async function criarListaNavegacao(dados: {
  espacoId: string | null
  pastaId: string | null
  nome: string
  mes: string
  visual: Visual
}): Promise<ResultadoCriacao> {
  await exigirEquipe()
  const nome = dados.nome.trim()
  if (!nome) return { erro: 'Informe o nome da lista.' }
  if (dados.mes && !/^\d{4}-(0[1-9]|1[0-2])$/.test(dados.mes)) return { erro: 'Mês inválido.' }
  const sb = await criarClienteServidor()
  let id = ''
  const resultado = await tentar(async () => {
    const visual = validarVisual(dados.visual)
    id = await estrutura.criarLista(sb, {
      espacoId: dados.espacoId,
      pastaId: dados.pastaId,
      nome,
      mes: dados.mes ? `${dados.mes}-01` : null,
      ...visual,
    })
  }, 'Lista criada.')
  revalidatePath('/', 'layout')
  return { ...(resultado ?? {}), id: resultado?.erro ? undefined : id }
}

export async function personalizarItemNavegacao(dados: {
  tipo: 'spaces' | 'folders' | 'lists'
  id: string
  nome: string
  visual: Visual
}): Promise<Resultado> {
  await exigirEquipe()
  const nome = dados.nome.trim()
  if (!nome) return { erro: 'Informe o nome.' }
  const sb = await criarClienteServidor()
  const visual = validarVisual(dados.visual)
  const resultado = await tentar(async () => {
    const { error, count } = await sb
      .from(dados.tipo)
      .update({ name: nome, color: visual.cor, icon: visual.icone, emoji: visual.emoji }, { count: 'exact' })
      .eq('id', dados.id)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Personalização salva.')
  revalidatePath('/', 'layout')
  return resultado
}

export async function moverItemNavegacao(dados: {
  tipo: 'space' | 'folder' | 'list'
  id: string
  alvo: AlvoMovimento
}): Promise<Resultado> {
  await exigirEquipe()
  if (dados.alvo.tipo !== 'root' && dados.id === dados.alvo.id) return null
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    if (dados.tipo === 'space') {
      if (dados.alvo.tipo !== 'root' && dados.alvo.tipo !== 'space') throw new Error('Solte o espaço junto de outro espaço ou na raiz.')
      let paiId: string | null = null
      let antes: string | null = null
      if (dados.alvo.tipo === 'space') {
        const { data: alvo, error } = await sb.from('spaces').select('parent_id, position').eq('id', dados.alvo.id).single()
        if (error) throw error
        paiId = alvo.parent_id
        antes = alvo.position
      }
      let consulta = sb.from('spaces').select('position').neq('id', dados.id).is('archived_at', null).order('position', { ascending: false }).limit(1)
      consulta = paiId ? consulta.eq('parent_id', paiId) : consulta.is('parent_id', null)
      if (antes) consulta = consulta.lt('position', antes)
      const { data: anterior, error: erroAnterior } = await consulta
      if (erroAnterior) throw erroAnterior
      const { error, count } = await sb.from('spaces').update({ parent_id: paiId, position: posicaoEntre(anterior[0]?.position ?? null, antes) }, { count: 'exact' }).eq('id', dados.id)
      if (error) throw error
      if (!count) throw { code: '42501' }
      return
    }

    if (dados.tipo === 'folder') {
      let espacoId: string | null = null
      let antes: string | null = null
      if (dados.alvo.tipo === 'space') espacoId = dados.alvo.id
      if (dados.alvo.tipo === 'folder') {
        const { data: alvo, error } = await sb.from('folders').select('space_id, position').eq('id', dados.alvo.id).single()
        if (error) throw error
        espacoId = alvo.space_id
        antes = alvo.position
      }
      if (dados.alvo.tipo === 'list') {
        const { data: alvo, error } = await sb.from('lists').select('space_id').eq('id', dados.alvo.id).single()
        if (error) throw error
        espacoId = alvo.space_id
      }
      let consulta = sb.from('folders').select('position').neq('id', dados.id).is('archived_at', null).order('position', { ascending: false }).limit(1)
      consulta = espacoId ? consulta.eq('space_id', espacoId) : consulta.is('space_id', null)
      if (antes) consulta = consulta.lt('position', antes)
      const { data: anterior, error: erroAnterior } = await consulta
      if (erroAnterior) throw erroAnterior
      const { error, count } = await sb.from('folders').update({ space_id: espacoId, position: posicaoEntre(anterior[0]?.position ?? null, antes) }, { count: 'exact' }).eq('id', dados.id)
      if (error) throw error
      if (!count) throw { code: '42501' }
      return
    }

    let espacoId: string | null = null
    let pastaId: string | null = null
    let antes: string | null = null
    if (dados.alvo.tipo === 'space') espacoId = dados.alvo.id
    if (dados.alvo.tipo === 'folder') {
      const { data: alvo, error } = await sb.from('folders').select('space_id').eq('id', dados.alvo.id).single()
      if (error) throw error
      espacoId = alvo.space_id
      pastaId = dados.alvo.id
    }
    if (dados.alvo.tipo === 'list') {
      const { data: alvo, error } = await sb.from('lists').select('space_id, folder_id, position').eq('id', dados.alvo.id).single()
      if (error) throw error
      espacoId = alvo.space_id
      pastaId = alvo.folder_id
      antes = alvo.position
    }
    let consulta = sb.from('lists').select('position').neq('id', dados.id).is('archived_at', null).order('position', { ascending: false }).limit(1)
    consulta = pastaId ? consulta.eq('folder_id', pastaId) : consulta.is('folder_id', null)
    consulta = espacoId ? consulta.eq('space_id', espacoId) : consulta.is('space_id', null)
    if (antes) consulta = consulta.lt('position', antes)
    const { data: anterior, error: erroAnterior } = await consulta
    if (erroAnterior) throw erroAnterior
    const { error, count } = await sb.from('lists').update({ space_id: espacoId, folder_id: pastaId, position: posicaoEntre(anterior[0]?.position ?? null, antes) }, { count: 'exact' }).eq('id', dados.id)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Organização atualizada.')
  revalidatePath('/', 'layout')
  return resultado
}

type TipoItem = 'space' | 'folder' | 'list'
const TABELA = { space: 'spaces', folder: 'folders', list: 'lists' } as const

export async function renomearItemNavegacao(dados: { tipo: TipoItem; id: string; nome: string }): Promise<Resultado> {
  await exigirEquipe()
  const nome = dados.nome.trim()
  if (!nome || nome.length > 120) return { erro: 'O nome deve ter de 1 a 120 caracteres.' }
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    const { error, count } = await sb.from(TABELA[dados.tipo]).update({ name: nome }, { count: 'exact' }).eq('id', dados.id)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Nome atualizado.')
  revalidatePath('/', 'layout')
  return resultado
}

/** "Excluir" = arquivar (os dados continuam no banco). Pasta e espaço levam as listas junto, senão elas "subiriam" para a raiz. */
export async function excluirItemNavegacao(dados: { tipo: TipoItem; id: string }): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const agora = new Date().toISOString()
  const resultado = await tentar(async () => {
    const tabela = TABELA[dados.tipo]
    if (dados.tipo !== 'folder') {
      const { data: alvo, error: e0 } = await sb.from(dados.tipo === 'space' ? 'spaces' : 'lists').select('slug').eq('id', dados.id).maybeSingle()
      if (e0) throw e0
      if (!alvo) throw { code: '42501' }
      if (alvo.slug) throw { code: 'P0001', message: 'Esta é uma área fixa da plataforma e não pode ser excluída.' }
    }

    if (dados.tipo === 'space') {
      await exigirAdmin()
      const { data: filhos, error: e1 } = await sb.from('spaces').select('id').eq('parent_id', dados.id)
      if (e1) throw e1
      const ids = [dados.id, ...filhos.map((f) => f.id)]
      for (const t of ['lists', 'folders'] as const) {
        const { error } = await sb.from(t).update({ archived_at: agora }).in('space_id', ids).is('archived_at', null)
        if (error) throw error
      }
      const { error, count } = await sb.from('spaces').update({ archived_at: agora }, { count: 'exact' }).in('id', ids)
      if (error) throw error
      if (!count) throw { code: '42501' }
      return
    }
    if (dados.tipo === 'folder') {
      const { error: e2 } = await sb.from('lists').update({ archived_at: agora }).eq('folder_id', dados.id).is('archived_at', null)
      if (e2) throw e2
    }
    const { error, count } = await sb.from(tabela).update({ archived_at: agora }, { count: 'exact' }).eq('id', dados.id)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, dados.tipo === 'list' ? 'Lista excluída.' : dados.tipo === 'folder' ? 'Pasta excluída.' : 'Espaço excluído.')
  revalidatePath('/', 'layout')
  return resultado
}

export async function duplicarListaNavegacao(id: string): Promise<ResultadoCriacao> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  let novo = ''
  const resultado = await tentar(async () => {
    const { data, error } = await sb.rpc('duplicar_lista', { p_list: id })
    if (error) throw error
    novo = data
  }, 'Lista duplicada (sem as tarefas).')
  revalidatePath('/', 'layout')
  return { ...(resultado ?? {}), id: resultado?.erro ? undefined : novo }
}
