import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'

export type TipoTela = 'quadro' | 'funil'
export type ResumoTela = { id: string; titulo: string; atualizadoEm: string; donoNome: string | null; donoId: string | null }
export type Tela = ResumoTela & { dados: unknown }

type Linha = { id: string; title: string; updated_at: string; created_by: string | null; data?: Json; owner: { full_name: string } | null }

export async function listarTelas(sb: Supabase, tipo: TipoTela): Promise<ResumoTela[]> {
  const { data, error } = await sb.from('canvases').select('id, title, updated_at, created_by, owner:profiles!canvases_created_by_fkey(full_name)').eq('kind', tipo).is('archived_at', null).order('updated_at', { ascending: false }).limit(500)
  if (error) throw error
  return (data as unknown as Linha[]).map((l) => ({ id: l.id, titulo: l.title, atualizadoEm: l.updated_at, donoNome: l.owner?.full_name ?? null, donoId: l.created_by }))
}

export async function buscarTela(sb: Supabase, tipo: TipoTela, id: string): Promise<Tela | null> {
  const { data, error } = await sb.from('canvases').select('id, title, updated_at, data, owner:profiles!canvases_created_by_fkey(full_name)').eq('id', id).eq('kind', tipo).is('archived_at', null).maybeSingle()
  if (error) throw error
  if (!data) return null
  const l = data as unknown as Linha
  return { id: l.id, titulo: l.title, atualizadoEm: l.updated_at, donoNome: l.owner?.full_name ?? null, donoId: l.created_by, dados: l.data }
}

export async function criarTela(sb: Supabase, userId: string, tipo: TipoTela, titulo: string, dados: Json): Promise<string> {
  const { data, error } = await sb.from('canvases').insert({ kind: tipo, title: titulo.trim() || 'Sem título', data: dados, created_by: userId }).select('id').single()
  if (error) throw error
  return data.id
}

/** Grava os elementos. Devolve o `updated_at` novo; lança se a tela não existe (ou foi excluída) para o aviso aparecer. */
export async function salvarDadosTela(sb: Supabase, tipo: TipoTela, id: string, dados: Json): Promise<string> {
  const { data, error } = await sb.from('canvases').update({ data: dados }).eq('id', id).eq('kind', tipo).is('archived_at', null).select('updated_at')
  if (error) throw error
  if (!data?.length) throw { code: 'P0001', message: 'Este item não existe mais. Recarregue a página.' }
  return data[0].updated_at
}

export async function renomearTela(sb: Supabase, tipo: TipoTela, id: string, titulo: string): Promise<void> {
  const { data, error } = await sb.from('canvases').update({ title: titulo.trim() }).eq('id', id).eq('kind', tipo).select('id')
  if (error) throw error
  if (!data?.length) throw { code: 'P0001', message: 'Este item não existe mais. Recarregue a página.' }
}

export async function excluirTela(sb: Supabase, tipo: TipoTela, id: string): Promise<void> {
  const { data, error } = await sb.from('canvases').delete().eq('id', id).eq('kind', tipo).select('id')
  if (error) throw error
  // A RLS não dá erro quando a pessoa não é a dona: a linha só não é apagada.
  if (!data?.length) throw { code: '42501', message: 'row-level security' }
}
