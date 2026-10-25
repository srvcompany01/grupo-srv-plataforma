'use server'

import { revalidatePath } from 'next/cache'
import { mensagemErro } from '@/dominio/erros-banco'
import { lerCompromisso, type EntradaCompromisso, type TagAgenda } from '@/dominio/agenda'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as agenda from '@/servicos/agenda'
import { desconectarGoogle, prepararExclusaoNoGoogle, sincronizarCompromisso } from '@/servicos/google-agenda'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Cria (id null) ou edita um compromisso e leva a mudança para o Google de quem vê. */
export async function salvarCompromissoAcao(id: string | null, e: EntradaCompromisso): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (id && !UUID.test(id)) return { erro: 'Compromisso inválido.' }
  const v = lerCompromisso(e, eu.papel === 'admin' || eu.papel === 'gestor')
  if ('erro' in v) return { erro: v.erro }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const salvo = id ?? (await agenda.criarCompromisso(sb, v.campos))
    if (id) await agenda.atualizarCompromisso(sb, id, v.campos)
    await sincronizarCompromisso(salvo)
  }, id ? 'Compromisso atualizado.' : 'Compromisso criado.')
  revalidatePath('/agenda')
  return r
}

export async function cancelarOcorrenciaAcao(id: string, dia: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return { erro: 'Dados inválidos.' }
  const r = await tentar(async () => {
    await agenda.cancelarOcorrencia(await criarClienteServidor(), id, dia)
    await sincronizarCompromisso(id)
  }, 'Só este dia foi cancelado.')
  revalidatePath('/agenda')
  return r
}

export async function excluirCompromissoAcao(id: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Compromisso inválido.' }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const apagarNoGoogle = await prepararExclusaoNoGoogle(id)
    await agenda.excluirCompromisso(sb, id)
    await apagarNoGoogle()
  }, 'Compromisso excluído.')
  revalidatePath('/agenda')
  return r
}

export async function desconectarGoogleAcao(): Promise<Resultado> {
  const eu = await exigirEquipe()
  const r = await tentar(() => desconectarGoogle(eu.id), 'Google Agenda desconectado.')
  revalidatePath('/agenda')
  return r
}

const ROTULO = { tag: 'tag', categoria: 'categoria' } as const

/** Tag ou categoria nova (vale para a equipe toda). Devolve o item para o formulário já marcá-lo. */
export async function criarEtiquetaAcao(tipo: agenda.TipoEtiqueta, nome: string, cor: string): Promise<Resultado & { item?: TagAgenda }> {
  await exigirEquipe()
  if (!(tipo in ROTULO)) return { erro: 'Tipo inválido.' }
  const limpo = nome.trim()
  if (!limpo || limpo.length > 40) return { erro: `Dê um nome de até 40 caracteres para a ${ROTULO[tipo]}.` }
  if (!/^#[0-9a-f]{6}$/i.test(cor)) return { erro: 'Cor inválida.' }
  const sb = await criarClienteServidor()
  try {
    const item = await agenda.criarEtiqueta(sb, tipo, limpo, cor)
    revalidatePath('/agenda')
    return { ok: tipo === 'tag' ? 'Tag criada.' : 'Categoria criada.', item }
  } catch (e) {
    console.error(e)
    return { erro: (e as { code?: string }).code === '23505' ? `Já existe uma ${ROTULO[tipo]} com esse nome.` : mensagemErro(e) }
  }
}

/** Exclui a tag ou categoria (só quem criou ou o admin; a RLS confere). */
export async function excluirEtiquetaAcao(tipo: agenda.TipoEtiqueta, id: string): Promise<Resultado> {
  await exigirEquipe()
  if (!(tipo in ROTULO) || !UUID.test(id)) return { erro: 'Item inválido.' }
  const sb = await criarClienteServidor()
  const r = await tentar(() => agenda.excluirEtiqueta(sb, tipo, id), tipo === 'tag' ? 'Tag excluída.' : 'Categoria excluída.')
  revalidatePath('/agenda')
  return r
}
