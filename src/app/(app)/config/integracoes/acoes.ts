'use server'

import { revalidatePath } from 'next/cache'
import { ESCOPOS_TOKEN, gerarTokenApi, hashToken, type EscopoToken } from '@/dominio/api-token'
import { mensagemErro } from '@/dominio/erros-banco'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'

export type ResultadoToken = { token: string } | { erro: string }

/** Cria o token e devolve o valor completo UMA vez; só o hash fica no banco. */
export async function criarTokenAcao(nome: string, escopo: EscopoToken, dias: number): Promise<ResultadoToken> {
  await exigirAdmin()
  const limpo = nome.trim()
  if (!limpo || limpo.length > 80) return { erro: 'Dê um nome de 1 a 80 caracteres (ex.: Codex no meu Mac).' }
  if (!ESCOPOS_TOKEN.includes(escopo)) return { erro: 'Escopo inválido.' }
  if (!Number.isInteger(dias) || dias < 1 || dias > 365) return { erro: 'A validade deve ser de 1 a 365 dias.' }
  const token = gerarTokenApi()
  const sb = await criarClienteServidor()
  const { error } = await sb.from('api_tokens').insert({
    name: limpo,
    token_hash: await hashToken(token),
    scope: escopo,
    expires_at: new Date(Date.now() + dias * 86_400_000).toISOString(),
  })
  if (error) {
    console.error(error)
    return { erro: mensagemErro(error) }
  }
  revalidatePath('/config/integracoes')
  return { token }
}

export async function revogarTokenAcao(id: string): Promise<{ ok: true } | { erro: string }> {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const { error, count } = await sb.from('api_tokens').update({ revoked_at: new Date().toISOString() }, { count: 'exact' }).eq('id', id).is('revoked_at', null)
  if (error || !count) return { erro: 'Não foi possível revogar este token.' }
  revalidatePath('/config/integracoes')
  return { ok: true }
}
