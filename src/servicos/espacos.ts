import { montarArvoreEspacos, type NoEspaco } from '@/dominio/arvore-espacos'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

/** Árvore da barra lateral. A RLS já filtra o que o usuário pode ver. */
export async function listarArvore(sb: Supabase): Promise<NoEspaco[]> {
  const [espacos, pastas, listas] = await Promise.all([
    sb.from('spaces').select('id, name, description, color, icon, emoji, position, parent_id').is('archived_at', null),
    sb.from('folders').select('id, name, color, icon, emoji, space_id, position').is('archived_at', null),
    sb.from('lists').select('id, name, color, icon, emoji, space_id, folder_id, position, reference_month, clients(name)').is('archived_at', null),
  ])
  return montarArvoreEspacos(
    dados(espacos).map((e) => ({ id: e.id, nome: e.name, descricao: e.description, cor: e.color, icone: e.icon, emoji: e.emoji, posicao: e.position, paiId: e.parent_id })),
    dados(pastas).map((p) => ({ id: p.id, nome: p.name, cor: p.color, icone: p.icon, emoji: p.emoji, espacoId: p.space_id, posicao: p.position })),
    dados(listas).map((l) => ({
      id: l.id,
      nome: l.name,
      espacoId: l.space_id,
      pastaId: l.folder_id,
      posicao: l.position,
      clienteNome: l.clients?.name ?? '',
      mes: l.reference_month,
      cor: l.color,
      icone: l.icon,
      emoji: l.emoji,
    })),
  )
}

export type EspacoComMembros = {
  id: string
  nome: string
  cor: string
  icone: string
  emoji: string | null
  descricao: string | null
  posicao: string
  paiId: string | null
  membros: { id: string; nome: string; papel: 'gestor' | 'membro' }[]
}

export async function listarEspacosComMembros(sb: Supabase): Promise<EspacoComMembros[]> {
  const linhas = dados(
    await sb
      .from('spaces')
      .select('id, name, description, color, icon, emoji, position, parent_id, space_members(user_id, role, profiles(full_name))')
      .is('archived_at', null)
      .order('position'),
  )
  return linhas.map((e) => ({
    id: e.id,
    nome: e.name,
    cor: e.color,
    icone: e.icon,
    emoji: e.emoji,
    descricao: e.description,
    posicao: e.position,
    paiId: e.parent_id,
    membros: e.space_members.map((m) => ({ id: m.user_id, nome: m.profiles?.full_name ?? '', papel: m.role as 'gestor' | 'membro' })),
  }))
}
