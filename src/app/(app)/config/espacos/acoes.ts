'use server'

import { revalidatePath } from 'next/cache'
import { posicaoEntre } from '@/dominio/posicao'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor, type Supabase } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'

// Todas pelo cliente do usuário: a RLS decide (espaços: só admin; membros: admin e gestor do espaço).

function atualizar() {
  revalidatePath('/', 'layout')
}

async function irmaos(sb: Supabase, paiId: string | null) {
  const q = sb.from('spaces').select('id, position').is('archived_at', null).order('position')
  const { data, error } = paiId ? await q.eq('parent_id', paiId) : await q.is('parent_id', null)
  if (error) throw error
  return data
}

export async function criarEspaco(_: Resultado, form: FormData): Promise<Resultado> {
  await exigirEquipe()
  const nome = String(form.get('nome') ?? '').trim()
  const cor = String(form.get('cor') ?? '#7b68ee')
  const paiId = String(form.get('paiId') ?? '') || null
  if (!nome) return { erro: 'Informe o nome.' }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const lista = await irmaos(sb, paiId)
    const { error } = await sb
      .from('spaces')
      .insert({ name: nome, color: cor, parent_id: paiId, position: posicaoEntre(lista.at(-1)?.position ?? null, null) })
    if (error) throw error
  }, 'Departamento criado.')
  atualizar()
  return r
}

export async function renomearEspaco(id: string, nome: string): Promise<Resultado> {
  await exigirEquipe()
  if (!nome.trim()) return { erro: 'Informe o nome.' }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error, count } = await sb.from('spaces').update({ name: nome.trim() }, { count: 'exact' }).eq('id', id)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Nome atualizado.')
  atualizar()
  return r
}

export async function moverEspaco(id: string, direcao: -1 | 1): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { data: atual, error } = await sb.from('spaces').select('parent_id').eq('id', id).single()
    if (error) throw error
    const lista = await irmaos(sb, atual.parent_id)
    const i = lista.findIndex((e) => e.id === id)
    const alvo = i + direcao
    if (i < 0 || alvo < 0 || alvo >= lista.length) return
    const [antes, depois] = direcao < 0 ? [lista[alvo - 1], lista[alvo]] : [lista[alvo], lista[alvo + 1]]
    const posicao = posicaoEntre(antes?.position ?? null, depois?.position ?? null)
    const u = await sb.from('spaces').update({ position: posicao }).eq('id', id)
    if (u.error) throw u.error
  }, 'Ordem atualizada.')
  atualizar()
  return r
}

export async function arquivarEspaco(id: string): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error, count } = await sb.from('spaces').update({ archived_at: new Date().toISOString() }, { count: 'exact' }).eq('id', id)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Departamento arquivado.')
  atualizar()
  return r
}

export async function adicionarMembroEspaco(espacoId: string, usuarioId: string, papel: 'gestor' | 'membro'): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error } = await sb.from('space_members').upsert({ space_id: espacoId, user_id: usuarioId, role: papel })
    if (error) throw error
  }, 'Membro adicionado.')
  atualizar()
  return r
}

export async function removerMembroEspaco(espacoId: string, usuarioId: string): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error, count } = await sb.from('space_members').delete({ count: 'exact' }).eq('space_id', espacoId).eq('user_id', usuarioId)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Membro removido.')
  atualizar()
  return r
}
