import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import type { PapelUsuario } from '@/dominio/acesso'
import { criarClienteServidor } from './servidor'

export type Perfil = { id: string; nome: string; papel: PapelUsuario; ativo: boolean; avatar: string | null }

/** Usuário logado com o perfil; null se não houver sessão válida. */
export const usuarioAtual = cache(async (): Promise<Perfil | null> => {
  const sb = await criarClienteServidor()
  const { data } = await sb.auth.getClaims()
  const id = data?.claims?.sub
  if (!id) return null
  const { data: p } = await sb.from('profiles').select('id, full_name, role, active, avatar_url').eq('id', id).maybeSingle()
  if (!p) return null
  return { id: p.id, nome: p.full_name, papel: p.role as PapelUsuario, ativo: p.active, avatar: p.avatar_url }
})

/** Toda página/ação da área interna chama isto (o layout não protege as páginas). */
export async function exigirEquipe(): Promise<Perfil> {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo) redirect('/login')
  if (eu.papel === 'cliente') redirect('/portal')
  return eu
}

export async function exigirAdmin(): Promise<Perfil> {
  const eu = await exigirEquipe()
  if (eu.papel !== 'admin') notFound()
  return eu
}

export async function exigirCliente(): Promise<Perfil> {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo) redirect('/login')
  if (eu.papel !== 'cliente') redirect('/inicio')
  return eu
}
