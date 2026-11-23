'use server'

import { revalidatePath } from 'next/cache'
import type { EntradaFormulario } from '@/dominio/formularios'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { alternarFormulario, arquivarFormulario, salvarFormulario } from '@/servicos/formularios'

const atualizado = () => revalidatePath('/config/formularios')

export async function salvarFormularioAcao(id: string | null, entrada: EntradaFormulario): Promise<Resultado> {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const r = await tentar(() => salvarFormulario(sb, id, entrada), id ? 'Formulário atualizado.' : 'Formulário criado.')
  if (!r?.erro) atualizado()
  return r
}

export async function alternarFormularioAcao(id: string, ativo: boolean): Promise<Resultado> {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const r = await tentar(() => alternarFormulario(sb, id, ativo), ativo ? 'Link ativado.' : 'Link desativado.')
  if (!r?.erro) atualizado()
  return r
}

export async function arquivarFormularioAcao(id: string): Promise<Resultado> {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const r = await tentar(() => arquivarFormulario(sb, id), 'Formulário arquivado.')
  if (!r?.erro) atualizado()
  return r
}
