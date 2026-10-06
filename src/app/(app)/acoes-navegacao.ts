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

function validarVisual(visual: Visual): Visual {
  return {
    cor: /^#[0-9a-f]{6}$/i.test(visual.cor) ? visual.cor : '#6647f0',
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
  espacoId: string
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
  espacoId: string
  pastaId: string | null
  clienteId: string
  nome: string
  mes: string
  visual: Visual
}): Promise<ResultadoCriacao> {
  await exigirEquipe()
  const nome = dados.nome.trim()
  if (!nome) return { erro: 'Informe o nome da lista.' }
  if (!dados.clienteId) return { erro: 'Escolha o cliente da lista.' }
  if (dados.mes && !/^\d{4}-(0[1-9]|1[0-2])$/.test(dados.mes)) return { erro: 'Mês inválido.' }
  const sb = await criarClienteServidor()
  let id = ''
  const resultado = await tentar(async () => {
    const visual = validarVisual(dados.visual)
    id = await estrutura.criarLista(sb, {
      espacoId: dados.espacoId,
      pastaId: dados.pastaId,
      clienteId: dados.clienteId,
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
