import { notFound, redirect } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import * as chat from '@/servicos/chat'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Aba "Canal" da lista: abre o canal de chat da própria lista (`lista-<início do id>`), criando-o na primeira vez. */
export default async function CanalDaLista({ params }: { params: Promise<{ lista: string }> }) {
  const { lista } = await params
  if (!UUID.test(lista)) notFound()
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const { data: l } = await sb.from('lists').select('name').eq('id', lista).maybeSingle()
  if (!l) notFound()
  const nome = `lista-${lista.slice(0, 8)}`
  const { data: existente } = await sb.from('chat_channels').select('id').eq('name', nome).maybeSingle()
  if (!existente) await chat.criarCanal(sb, eu.id, { nome, descricao: `Canal da lista ${l.name}`, privado: false, membros: [] })
  redirect(`/chat/${nome}`)
}
