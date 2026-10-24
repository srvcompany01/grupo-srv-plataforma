'use server'

import { redirect } from 'next/navigation'
import { escopoPedido } from '@/dominio/oauth'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { clienteOAuth, criarCodigo } from '@/servicos/oauth'

/** "Autorizar" ou "Cancelar" na tela de consentimento: volta para o app do Claude com o código (ou o erro). */
export async function decidirAcao(form: FormData) {
  const v = (k: string) => String(form.get(k) ?? '')
  const cliente = await clienteOAuth(v('client_id'))
  if (!cliente || !cliente.retornos.includes(v('redirect_uri'))) throw new Error('Pedido inválido.')
  const destino = new URL(v('redirect_uri'))
  if (v('state')) destino.searchParams.set('state', v('state'))
  const eu = await usuarioAtual()
  if (v('decisao') !== 'autorizar' || !eu || !eu.ativo || eu.papel === 'cliente') {
    destino.searchParams.set('error', 'access_denied')
    redirect(destino.toString())
  }
  const codigo = await criarCodigo({ userId: eu.id, clientId: cliente.id, retorno: v('redirect_uri'), challenge: v('code_challenge'), escopo: v('escopo') === 'read' ? 'read' : escopoPedido(v('scope')) })
  destino.searchParams.set('code', codigo)
  redirect(destino.toString())
}
