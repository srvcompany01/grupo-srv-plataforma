import type { Supabase } from '@/infra/supabase/servidor'

/** Visualização salva da pessoa nesta lista (query string normalizada) ou null (= original). A RLS só mostra a própria. */
export async function buscarVisaoSalva(sb: Supabase, listaId: string): Promise<string | null> {
  const { data, error } = await sb.from('saved_views').select('params').eq('list_id', listaId).maybeSingle()
  if (error) throw error
  return data?.params ?? null
}

/** Texto vazio (= original) apaga a linha. */
export async function salvarVisao(sb: Supabase, usuarioId: string, listaId: string, params: string): Promise<void> {
  if (!params) return removerVisao(sb, listaId)
  const { error } = await sb.from('saved_views').upsert({ user_id: usuarioId, list_id: listaId, params, updated_at: new Date().toISOString() }, { onConflict: 'user_id,list_id' })
  if (error) throw error
}

export async function removerVisao(sb: Supabase, listaId: string): Promise<void> {
  const { error } = await sb.from('saved_views').delete().eq('list_id', listaId)
  if (error) throw error
}
