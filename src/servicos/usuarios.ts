import type { PapelUsuario } from '@/dominio/acesso'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type Usuario = {
  id: string
  nome: string
  email: string
  papel: PapelUsuario
  ativo: boolean
  espacos: { id: string; nome: string; papel: 'gestor' | 'membro' }[]
  cliente: { id: string; nome: string } | null
}

export async function listarUsuarios(sb: Supabase): Promise<Usuario[]> {
  const linhas = dados(
    await sb
      .from('profiles')
      .select('id, full_name, email, role, active, space_members(space_id, role, spaces(name)), client_users(client_id, clients(name))')
      .order('full_name'),
  )
  return linhas.map((p) => ({
    id: p.id,
    nome: p.full_name,
    email: p.email ?? '',
    papel: p.role as PapelUsuario,
    ativo: p.active,
    espacos: p.space_members.map((m) => ({ id: m.space_id, nome: m.spaces?.name ?? '', papel: m.role as 'gestor' | 'membro' })),
    cliente: p.client_users ? { id: p.client_users.client_id, nome: p.client_users.clients?.name ?? '' } : null,
  }))
}

/** Pessoas da equipe ativas (para escolher responsáveis e membros). */
export async function listarEquipe(sb: Supabase): Promise<{ id: string; nome: string; avatar: string | null }[]> {
  const linhas = dados(
    await sb.from('profiles').select('id, full_name, avatar_url').neq('role', 'cliente').eq('active', true).order('full_name'),
  )
  return linhas.map((p) => ({ id: p.id, nome: p.full_name, avatar: p.avatar_url }))
}
