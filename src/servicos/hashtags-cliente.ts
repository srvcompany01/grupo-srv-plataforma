import type { Supabase } from '@/infra/supabase/servidor'
import { lerHashtags, PLATAFORMAS_HASHTAGS, type PlataformaHashtags } from '@/dominio/hashtags'

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
