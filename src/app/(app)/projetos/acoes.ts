'use server'

import { revalidatePath } from 'next/cache'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { configurarProjetos } from '@/servicos/painel-projetos'

/** Usa o espaço "Projetos" que já existir ou cria um (só o admin cria espaços). */
export async function configurarProjetosAcao(): Promise<Resultado> {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const r = await tentar(() => configurarProjetos(sb), 'Espaço Projetos pronto. Crie uma lista para cada cliente ou projeto.')
  revalidatePath('/', 'layout')
  return r
}
