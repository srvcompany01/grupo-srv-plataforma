'use server'

import { revalidatePath } from 'next/cache'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { configurarProjetos } from '@/servicos/painel-projetos'

/** Usa a lista solta "Projetos" que já existir ou cria uma. */
export async function configurarProjetosAcao(): Promise<Resultado> {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const r = await tentar(() => configurarProjetos(sb), 'Projetos pronto. Crie uma tarefa para cada cliente ou projeto, com as entregas como subtarefas.')
  revalidatePath('/', 'layout')
  return r
}
