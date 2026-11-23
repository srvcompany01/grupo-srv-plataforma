'use server'

import { revalidatePath } from 'next/cache'
import type { EntradaFormulario } from '@/dominio/formularios'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { alternarFormulario, arquivarFormulario, duplicarFormulario, respostasFormulario, salvarFormulario, type RespostaFormulario } from '@/servicos/formularios'

const atualizado = () => revalidatePath('/config/formularios')
export async function salvarFormularioAcao(id: string | null, entrada: EntradaFormulario, publicar = true): Promise<{ ok?: string; erro?: string; id?: string; token?: string }> {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  let salvo: string | undefined
  const r = await tentar(async () => { salvo = await salvarFormulario(sb, id, entrada, publicar) }, publicar ? 'Formulário publicado.' : 'Rascunho salvo.')
  if (!r?.erro) atualizado()
  let token: string | undefined
  if (salvo && !r?.erro) { const { data } = await sb.from('forms').select('token').eq('id', salvo).maybeSingle(); token = data?.token }
  return { ...r, id: salvo, token }
}
export async function alternarFormularioAcao(id: string, ativo: boolean): Promise<Resultado> {
  await exigirAdmin(); const sb = await criarClienteServidor()
  const r = await tentar(() => alternarFormulario(sb, id, ativo), ativo ? 'Link ativado.' : 'Link desativado.')
  if (!r?.erro) atualizado(); return r
}
export async function arquivarFormularioAcao(id: string): Promise<Resultado> {
  await exigirAdmin(); const sb = await criarClienteServidor()
  const r = await tentar(() => arquivarFormulario(sb, id), 'Formulário arquivado.')
  if (!r?.erro) atualizado(); return r
}
export async function duplicarFormularioAcao(id: string): Promise<Resultado> {
  await exigirAdmin(); const sb = await criarClienteServidor()
  const r = await tentar(() => duplicarFormulario(sb, id), 'Cópia criada como rascunho.')
  if (!r?.erro) atualizado(); return r
}
export async function respostasFormularioAcao(id: string, pagina = 0): Promise<{ itens: RespostaFormulario[]; total: number; erro?: string }> {
  await exigirAdmin()
  if (!Number.isInteger(pagina) || pagina < 0) return { itens: [], total: 0, erro: 'Página inválida.' }
  try { return await respostasFormulario(await criarClienteServidor(), id, pagina) }
  catch { return { itens: [], total: 0, erro: 'Não foi possível carregar as respostas.' } }
}
