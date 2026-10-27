'use server'

import { revalidatePath } from 'next/cache'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { salvarHorario } from '@/servicos/atendimento'
import { analisarConversas } from '@/servicos/atendimento-ia'

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

/** A IA lê as conversas recentes ainda não analisadas do cliente (até 8 por vez). */
export async function analisarConversasAcao(clienteId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  const r = await analisarConversas(clienteId)
  revalidatePath('/atendimento')
  if (r.erro && !r.analisadas) return { erro: r.erro }
  if (!r.analisadas && !r.pendentes) return { ok: 'Nenhuma conversa nova para analisar: só entram as que ficaram paradas há 30 minutos e têm pelo menos 3 mensagens.' }
  return { ok: `${r.analisadas} conversas analisadas${r.pendentes ? `; restam ${r.pendentes}, rode de novo` : ''}${r.erro ? `. Parou por erro: ${r.erro}` : ''}.` }
}
