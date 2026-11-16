import { ehCampoEtapa, opcaoDaEtapa, type EtapaDoPost } from '@/dominio/etapa-post'
import type { Supabase } from '@/infra/supabase/servidor'
import { listarCamposDaLista, salvarValorDoCampo } from './campos-personalizados'

/**
 * Faz o campo personalizado "Etapa" da tarefa (ou subtarefa) do post acompanhar o andamento dele:
 * enviado ao cliente → "Aprovação cliente"; aprovado ou agendado direto → "Agendado"; publicado → "Postado" e a tarefa é concluída.
 * Nunca atrapalha o fluxo do post: sem o campo, sem a opção ou com qualquer erro, só registra no log e segue.
 */
export async function aplicarEtapaDoPost(sb: Supabase, tarefaId: string, etapa: EtapaDoPost): Promise<void> {
  try {
    const { data: tarefa } = await sb.from('tasks').select('list_id').eq('id', tarefaId).maybeSingle()
    if (!tarefa) return
    const campo = (await listarCamposDaLista(sb, tarefa.list_id)).find((c) => (c.tipo === 'dropdown' || c.tipo === 'labels') && ehCampoEtapa(c.nome))
    const opcao = campo ? opcaoDaEtapa(campo.configuracao.options ?? [], etapa) : null
    if (campo && opcao) await salvarValorDoCampo(sb, tarefaId, campo.id, campo.tipo === 'labels' ? [opcao] : opcao)
    if (etapa === 'postado') await concluirTarefa(sb, tarefaId, tarefa.list_id)
  } catch (e) {
    console.error('Etapa do post', tarefaId, etapa, e)
  }
}

/** Move a tarefa para o primeiro status "concluído" da lista (o banco marca a data de conclusão). */
async function concluirTarefa(sb: Supabase, tarefaId: string, listaId: string): Promise<void> {
  const { data: status } = await sb.from('list_statuses').select('id').eq('list_id', listaId).eq('category', 'done').order('position').limit(1).maybeSingle()
  if (!status) return
  const { error } = await sb.from('tasks').update({ status_id: status.id }).eq('id', tarefaId)
  if (error) throw error
}
