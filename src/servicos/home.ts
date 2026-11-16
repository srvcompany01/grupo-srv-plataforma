import type { PostHome } from '@/dominio/home'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

/** Só o estado dos posts, sem carregar mídias nem chamar as redes sociais. A RLS limita o acesso. */
export async function listarPostsHome(sb: Supabase): Promise<PostHome[]> {
  const posts = dados(await sb.from('content_posts').select('task_id, approval, publish_status, publish_at').neq('publish_status', 'publicado').or('approval.eq.aguardando,approval.eq.ajuste,publish_status.eq.falhou,publish_status.eq.agendado').order('created_at', { ascending: false }).limit(2000))
  return posts.map((p) => ({ tarefaId: p.task_id, aprovacao: p.approval, status: p.publish_status, em: p.publish_at }))
}
