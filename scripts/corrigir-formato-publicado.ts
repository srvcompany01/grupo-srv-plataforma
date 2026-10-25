import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/infra/supabase/tipos'

/**
 * Corrige posts já publicados consultando o objeto real de cada mídia no Instagram.
 * Uso: npx tsx --env-file=.env.local scripts/corrigir-formato-publicado.ts
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
const token = process.env.META_ACCESS_TOKEN
if (!url || !chave || !token) throw new Error('Faltam NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ou META_ACCESS_TOKEN.')

const sb = createClient<Database>(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
const versao = process.env.META_API_VERSION || 'v23.0'
const { data: posts, error } = await sb.from('content_posts').select('task_id, ig_media_id, format').eq('publish_status', 'publicado').not('ig_media_id', 'is', null)
if (error) throw error

let corrigidos = 0
for (const post of posts) {
  const q = new URLSearchParams({ fields: 'media_type,media_product_type', access_token: token })
  const resposta = await fetch(`https://graph.facebook.com/${versao}/${post.ig_media_id}?${q}`)
  const media = await resposta.json() as { media_type?: string; media_product_type?: string; error?: { message?: string } }
  if (!resposta.ok || media.error) {
    console.error(post.task_id, media.error?.message ?? `HTTP ${resposta.status}`)
    continue
  }
  const formato = media.media_product_type === 'REELS' ? 'reels' : media.media_product_type === 'STORY' ? 'stories' : 'feed'
  if (post.format === formato) continue
  const { error: erroUpdate } = await sb.from('content_posts').update({ format: formato }).eq('task_id', post.task_id)
  if (erroUpdate) throw erroUpdate
  corrigidos++
  console.log(`${post.task_id}: ${post.format} -> ${formato}`)
}

console.log(`${corrigidos} post(s) corrigido(s) de ${posts.length} consultado(s).`)
