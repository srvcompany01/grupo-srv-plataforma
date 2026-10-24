'use server'

import { revalidatePath } from 'next/cache'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { analisarPost } from '@/servicos/insights-post'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A IA assiste o post e explica o desempenho (leva até 1 ou 2 minutos em vídeos). */
export async function analisarPostAcao(taskId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(taskId)) return { erro: 'Post inválido.' }
  const r = await tentar(async () => analisarPost(await criarClienteServidor(), taskId), 'Análise pronta.')
  revalidatePath('/agendamentos')
  return r
}
