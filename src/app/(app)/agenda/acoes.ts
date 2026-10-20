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

/** Tag nova da agenda (vale para a equipe toda). Devolve a tag para o formulário já marcá-la. */
export async function criarTagAgendaAcao(nome: string, cor: string): Promise<Resultado & { tag?: TagAgenda }> {
  await exigirEquipe()
  const limpo = nome.trim()
  if (!limpo || limpo.length > 40) return { erro: 'Dê um nome de até 40 caracteres para a tag.' }
  if (!/^#[0-9a-f]{6}$/i.test(cor)) return { erro: 'Cor inválida.' }
  const sb = await criarClienteServidor()
  try {
    const tag = await agenda.criarTagAgenda(sb, limpo, cor)
    revalidatePath('/agenda')
    return { ok: 'Tag criada.', tag }
  } catch (e) {
    console.error(e)
    return { erro: (e as { code?: string }).code === '23505' ? 'Já existe uma tag com esse nome.' : mensagemErro(e) }
  }
}
