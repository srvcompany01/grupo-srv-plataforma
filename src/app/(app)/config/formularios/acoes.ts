'use server'

import { revalidatePath } from 'next/cache'
import type { CampoFormulario } from '@/dominio/formularios'
import { gerarToken } from '@/dominio/token'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { tentar, type Resultado } from '@/servicos/acao'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type EntradaFormulario = {
  listaId: string
  clienteId: string | null
  responsavelId: string
  nome: string
  descricao: string
  campos: CampoFormulario[]
}

const atualizado = () => revalidatePath('/config/formularios')

/** Cria (id = null) ou atualiza. Chave e lista conferem no banco (gatilho validar_formulario). */
export async function salvarFormularioAcao(id: string | null, e: EntradaFormulario): Promise<Resultado> {
  await exigirAdmin()
  const nome = e.nome.trim()
  if (!nome || nome.length > 120) return { erro: 'O nome deve ter de 1 a 120 caracteres.' }
  if (!UUID.test(e.listaId) || !UUID.test(e.responsavelId) || (e.clienteId && !UUID.test(e.clienteId))) return { erro: 'Escolha a lista, o responsável e o cliente.' }
  const campos = e.campos.map((c) => ({ key: c.key, label: c.label.trim(), required: c.key === 'title' || c.required }))
  const sb = await criarClienteServidor()
  const base = { list_id: e.listaId, client_id: e.clienteId, assignee_id: e.responsavelId, name: nome, description: e.descricao.trim() || null, fields: campos as unknown as Json }
  const r = await tentar(async () => {
    const { error } = id ? await sb.from('forms').update(base).eq('id', id) : await sb.from('forms').insert({ ...base, token: gerarToken() })
    if (error) throw error
  }, id ? 'Formulário atualizado.' : 'Formulário criado.')
  atualizado()
  return r
}

export async function alternarFormularioAcao(id: string, ativo: boolean): Promise<Resultado> {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error } = await sb.from('forms').update({ active: ativo }).eq('id', id)
    if (error) throw error
  }, ativo ? 'Link ativado.' : 'Link desativado.')
  atualizado()
  return r
}

export async function arquivarFormularioAcao(id: string): Promise<Resultado> {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error } = await sb.from('forms').update({ archived_at: new Date().toISOString(), active: false }).eq('id', id)
    if (error) throw error
  }, 'Formulário arquivado.')
  atualizado()
  return r
}
