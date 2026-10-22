'use server'

import { revalidatePath } from 'next/cache'
import { STATUS_TIME, type StatusTime } from '@/dominio/time'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as time from '@/servicos/time'

/** Chamado pelo navegador a cada minuto. Silencioso: sem a migration, só não registra. */
export async function presencaAcao(ativo: boolean): Promise<void> {
  await exigirEquipe()
  try {
    await time.registrarPresenca(await criarClienteServidor(), ativo === true)
  } catch {}
}

export async function definirStatusAcao(status: StatusTime, texto: string, ate: string | null): Promise<Resultado> {
  await exigirEquipe()
  if (!STATUS_TIME.includes(status)) return { erro: 'Status inválido.' }
  if (ate && !(Date.parse(ate) > Date.now())) return { erro: 'O horário de volta precisa ser no futuro.' }
  const r = await tentar(async () => time.definirStatus(await criarClienteServidor(), status, String(texto ?? ''), ate), 'Status atualizado.')
  revalidatePath('/time')
  return r
}
