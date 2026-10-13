import { posicaoEntre } from '@/dominio/posicao'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

// Pastas e listas de um espaço. Escrita pelo cliente do usuário: a RLS só deixa gestor do espaço/admin.

export type Estrutura = {
  pastas: { id: string; nome: string; cor: string; icone: string; emoji: string | null; posicao: string }[]
  listas: { id: string; nome: string; cor: string; icone: string; emoji: string | null; pastaId: string | null; clienteNome: string; mes: string | null; posicao: string }[]
}

export async function buscarEstrutura(sb: Supabase, espacoId: string): Promise<Estrutura> {
  const [pastas, listas] = await Promise.all([
    sb.from('folders').select('id, name, color, icon, emoji, position').eq('space_id', espacoId).is('archived_at', null).order('position'),
    sb.from('lists').select('id, name, color, icon, emoji, folder_id, reference_month, position, clients(name)').eq('space_id', espacoId).is('archived_at', null).order('position'),
  ])
  return {
    pastas: dados(pastas).map((p) => ({ id: p.id, nome: p.name, cor: p.color, icone: p.icon, emoji: p.emoji, posicao: p.position })),
    listas: dados(listas).map((l) => ({
      id: l.id,
      nome: l.name,
      pastaId: l.folder_id,
      clienteNome: l.clients?.name ?? '',
      mes: l.reference_month,
      posicao: l.position,
      cor: l.color,
      icone: l.icon,
      emoji: l.emoji,
    })),
  }
}

async function ultimaPosicao(sb: Supabase, tabela: 'folders' | 'lists', espacoId: string | null) {
  let consulta = sb.from(tabela).select('position').order('position', { ascending: false }).limit(1)
  consulta = espacoId ? consulta.eq('space_id', espacoId) : consulta.is('space_id', null)
  const r = await consulta
  if (r.error) throw r.error
  return posicaoEntre(r.data[0]?.position ?? null, null)
}

export async function criarPasta(sb: Supabase, espacoId: string | null, nome: string, visual?: { cor?: string; icone?: string; emoji?: string | null }): Promise<string> {
  const { data, error } = await sb.from('folders').insert({
    space_id: espacoId,
    name: nome,
    color: visual?.cor,
    icon: visual?.icone,
    emoji: visual?.emoji,
    position: await ultimaPosicao(sb, 'folders', espacoId),
  }).select('id').single()
  if (error) throw error
  return data.id
}

export async function criarLista(
  sb: Supabase,
  d: { espacoId: string | null; pastaId: string | null; clienteId: string; nome: string; mes: string | null; cor?: string; icone?: string; emoji?: string | null },
): Promise<string> {
  const { data, error } = await sb
    .from('lists')
    .insert({
      space_id: d.espacoId,
      folder_id: d.pastaId,
      client_id: d.clienteId,
      name: d.nome,
      reference_month: d.mes,
      color: d.cor,
      icon: d.icone,
      emoji: d.emoji,
      position: await ultimaPosicao(sb, 'lists', d.espacoId),
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function renomear(sb: Supabase, tabela: 'folders' | 'lists', id: string, nome: string) {
  const { error, count } = await sb.from(tabela).update({ name: nome }, { count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

export async function arquivar(sb: Supabase, tabela: 'folders' | 'lists', id: string) {
  const { error, count } = await sb.from(tabela).update({ archived_at: new Date().toISOString() }, { count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}
