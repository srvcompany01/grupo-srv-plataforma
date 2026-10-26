'use server'

import { revalidatePath } from 'next/cache'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { salvarHorario } from '@/servicos/atendimento'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Expediente em minutos desde 0h (ex.: 8h = 480). Só admin e gestor. */
export async function salvarHorarioAcao(clienteId: string, h: { abre: number; fecha: number; dias: number[] }): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (eu.papel !== 'admin' && eu.papel !== 'gestor') return { erro: 'Só admin e gestor mudam o horário de atendimento.' }
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  const res = await tentar(async () => salvarHorario(await criarClienteServidor(), clienteId, h), 'Horário salvo.')
  revalidatePath('/atendimento')
  return res
}
