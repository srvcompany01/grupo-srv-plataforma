import type { Supabase } from '@/infra/supabase/servidor'
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
}

export type CronometroAtivo = { registroId: string; tarefaId: string; tarefaTitulo: string; inicio: string }

export async function listarTempo(sb: Supabase, tarefaId: string): Promise<RegistroTempo[]> {
  const linhas = dados(
    await sb
      .from('time_entries')
      .select('id, user_id, started_at, ended_at, duration_seconds, note, source, profiles(full_name)')
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

export async function lancarTempo(sb: Supabase, tarefaId: string, data: string, minutos: number, nota: string | null): Promise<void> {
  const { error } = await sb.rpc('lancar_tempo', { p_task: tarefaId, p_data: data, p_minutos: minutos, p_nota: nota ?? undefined })
  if (error) throw error
}

export async function editarTempo(sb: Supabase, id: string, minutos: number, nota: string | null): Promise<void> {
  const { error, count } = await sb
    .from('time_entries')
    .update({ duration_seconds: minutos * 60, note: nota }, { count: 'exact' })
    .eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

export async function apagarTempo(sb: Supabase, id: string): Promise<void> {
  const { error, count } = await sb.from('time_entries').delete({ count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}
