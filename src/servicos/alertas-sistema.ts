import type { Supabase } from '@/infra/supabase/servidor'

export type AlertaSistema = { id: string; texto: string; detalhe: string; href: string }

/** Pendências que pedem atenção da equipe: posts que falharam ao publicar e posts agendados cujo horário já passou sem sair. A RLS limita ao que a pessoa vê. */
export async function alertasDoSistema(sb: Supabase): Promise<AlertaSistema[]> {
  const limite = new Date(Date.now() - 15 * 60_000).toISOString()
  const { data, error } = await sb
    .from('content_posts')
    .select('task_id, publish_status, publish_at, tasks(title)')
    .or(`publish_status.eq.falhou,and(publish_status.eq.agendado,publish_at.lt.${limite})`)
    .order('publish_at', { ascending: false })
    .limit(20)
  if (error) return [] // sem a migration de conteúdo ou sem acesso: nenhum alerta
  return data.map((p) => {
    const titulo = (p.tasks as unknown as { title: string } | null)?.title ?? 'Post'
    const falhou = p.publish_status === 'falhou'
    return { id: p.task_id, texto: falhou ? 'Falhou ao publicar' : 'Agendado e não saiu no horário', detalhe: titulo, href: `/tarefas/${p.task_id}` }
  })
}
