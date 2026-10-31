import type { Supabase } from '@/infra/supabase/servidor'
import { comHashtagsDoCliente, ehPlataformaHashtags, lerHashtags, PLATAFORMAS_HASHTAGS, type PlataformaHashtags } from '@/dominio/hashtags'

const limite = (p: PlataformaHashtags) => PLATAFORMAS_HASHTAGS.find((x) => x.id === p)?.limite ?? 30

/** As hashtags fixas do cliente numa plataforma. Sem a migration, devolve lista vazia. */
export async function hashtagsDoCliente(sb: Supabase, clienteId: string, plataforma: PlataformaHashtags): Promise<string[]> {
  const { data } = await sb.from('client_platform_hashtags').select('hashtags').eq('client_id', clienteId).eq('platform', plataforma).maybeSingle()
  return lerHashtags(data?.hashtags ?? '', limite(plataforma))
}

export async function salvarHashtagsDoCliente(sb: Supabase, clienteId: string, plataforma: PlataformaHashtags, texto: string): Promise<string[]> {
  const lista = lerHashtags(texto, limite(plataforma))
  const { error } = await sb.from('client_platform_hashtags').upsert({ client_id: clienteId, platform: plataforma, hashtags: lista.join(' '), updated_at: new Date().toISOString() }, { onConflict: 'client_id,platform' })
  if (error) throw error
  return lista
}

/** Todas as plataformas com hashtags cadastradas no cliente (as que não têm vêm vazias). */
export async function hashtagsDoClienteTodas(sb: Supabase, clienteId: string): Promise<Record<string, string[]>> {
  const r: Record<string, string[]> = {}
  for (const p of PLATAFORMAS_HASHTAGS) r[p.id] = await hashtagsDoCliente(sb, clienteId, p.id)
  return r
}

/** Legenda + (depois de uma linha em branco) as hashtags da plataforma que ainda não estão nela. Plataforma sem hashtags cadastradas: legenda igual. */
export async function legendaComHashtags(sb: Supabase, clienteId: string, plataforma: string, legenda: string): Promise<{ legenda: string; hashtags: string[] }> {
  const hashtags = ehPlataformaHashtags(plataforma) ? await hashtagsDoCliente(sb, clienteId, plataforma) : []
  return { legenda: comHashtagsDoCliente(legenda, hashtags), hashtags }
}
