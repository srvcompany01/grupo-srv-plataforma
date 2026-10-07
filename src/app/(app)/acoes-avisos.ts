'use server'

import { revalidatePath } from 'next/cache'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as avisos from '@/servicos/avisos'

async function executar(fn: (sb: Awaited<ReturnType<typeof criarClienteServidor>>) => Promise<unknown>): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(() => fn(sb))
  revalidatePath('/', 'layout')
  return r
}

export async function marcarAvisoLidoAcao(id: string): Promise<Resultado> {
  return executar((sb) => avisos.marcarLido(sb, id))
}

export async function marcarTodosAvisosLidosAcao(): Promise<Resultado> {
  return executar((sb) => avisos.marcarTodosLidos(sb))
}
