import type { Supabase } from '@/infra/supabase/servidor'
import { argumentosSql, type FiltrosTempo, type LinhaResumo } from '@/dominio/tempo-faturavel'
import { dados } from './resultado'

export type RegistroTempo = {
  id: string
  usuarioId: string
  usuarioNome: string
  inicio: string
  fim: string | null
  segundos: number | null
  nota: string | null
  origem: 'timer' | 'manual'
  faturavel: boolean
}

export type CronometroAtivo = { registroId: string; tarefaId: string; tarefaTitulo: string; inicio: string }

export async function listarTempo(sb: Supabase, tarefaId: string): Promise<RegistroTempo[]> {
  const linhas = dados(
    await sb
      .from('time_entries')
      .select('id, user_id, started_at, ended_at, duration_seconds, note, source, billable, profiles(full_name)')
      .eq('task_id', tarefaId)
      .order('started_at', { ascending: false }),
  )
  return linhas.map((r) => ({
    id: r.id,
    usuarioId: r.user_id,
    usuarioNome: r.profiles?.full_name ?? '',
    inicio: r.started_at,
    fim: r.ended_at,
    segundos: r.duration_seconds,
    nota: r.note,
    origem: r.source === 'manual' ? 'manual' : 'timer',
    faturavel: r.billable,
  }))
}

export async function cronometroAtivo(sb: Supabase, usuarioId: string): Promise<CronometroAtivo | null> {
  const { data: r, error } = await sb
    .from('time_entries')
    .select('id, task_id, started_at, tasks(title)')
    .eq('user_id', usuarioId)
    .is('ended_at', null)
    .maybeSingle()
  if (error) throw error
  if (!r) return null
  return { registroId: r.id, tarefaId: r.task_id, tarefaTitulo: r.tasks?.title ?? '', inicio: r.started_at }
}

export async function iniciarCronometro(sb: Supabase, tarefaId: string): Promise<void> {
  const { error } = await sb.rpc('iniciar_cronometro', { p_task: tarefaId })
  if (error) throw error
}

export async function pararCronometro(sb: Supabase): Promise<void> {
  const { error } = await sb.rpc('parar_cronometro')
  if (error) throw error
}

export async function lancarTempo(sb: Supabase, tarefaId: string, data: string, minutos: number, nota: string | null, faturavel = true): Promise<void> {
  const { error } = await sb.rpc('lancar_tempo', { p_task: tarefaId, p_data: data, p_minutos: minutos, p_nota: nota ?? undefined, p_faturavel: faturavel })
  if (error) throw error
}

export async function editarTempo(sb: Supabase, id: string, minutos: number, nota: string | null, faturavel?: boolean): Promise<void> {
  const { error, count } = await sb
    .from('time_entries')
    .update({ duration_seconds: minutos * 60, note: nota, ...(faturavel === undefined ? {} : { billable: faturavel }) }, { count: 'exact' })
    .eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

export async function apagarTempo(sb: Supabase, id: string): Promise<void> {
  const { error, count } = await sb.from('time_entries').delete({ count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

/** Muda só a marca de faturável (dono do registro, gestor do espaço, admin ou gestor). */
export async function definirFaturavel(sb: Supabase, id: string, faturavel: boolean): Promise<void> {
  const { error } = await sb.rpc('definir_faturavel', { p_id: id, p_faturavel: faturavel })
  if (error) throw error
}

/** Soma por cliente e pessoa no período. A função do banco só responde para admin e gestor. */
export async function resumoTempo(sb: Supabase, filtros: FiltrosTempo): Promise<LinhaResumo[]> {
  const linhas = dados(await sb.rpc('resumo_tempo', argumentosSql(filtros)))
  return linhas.map((l) => ({
    clienteId: l.client_id,
    clienteNome: l.client_name ?? '',
    pessoaId: l.user_id,
    pessoaNome: l.user_name,
    total: Number(l.total_seconds),
    faturavel: Number(l.billable_seconds ?? 0),
    registros: Number(l.registros),
  }))
}

export type RegistroDoPeriodo = {
  id: string
  dia: string
  tarefaId: string
  tarefaTitulo: string
  listaNome: string
  clienteId: string | null
  clienteNome: string | null
  pessoaId: string
  pessoaNome: string
  nota: string | null
  segundos: number
  faturavel: boolean
}

/** Registros fechados do período, um por linha (lista do Sheet e CSV). Só admin e gestor. */
export async function registrosDoPeriodo(sb: Supabase, filtros: FiltrosTempo): Promise<RegistroDoPeriodo[]> {
  const linhas = dados(await sb.rpc('registros_tempo', argumentosSql(filtros)))
  return linhas.map((r) => ({
    id: r.id,
    dia: r.dia,
    tarefaId: r.task_id,
    tarefaTitulo: r.task_title,
    listaNome: r.list_name,
    clienteId: r.client_id,
    clienteNome: r.client_name,
    pessoaId: r.user_id,
    pessoaNome: r.user_name,
    nota: r.note,
    segundos: r.seconds,
    faturavel: r.billable,
  }))
}
