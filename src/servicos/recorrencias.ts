import type { Frequencia, ModoCriacao, ModoMensal, Recorrencia, RegraRecorrencia } from '@/dominio/recorrencia'
import type { Supabase } from '@/infra/supabase/servidor'

const CAMPOS =
  'frequency, every, lead_days, active, generated, anchor_date, weekdays, month_mode, ends_on, max_count, create_mode, copy_assignees, copy_subtasks, copy_fields'

type Linha = {
  frequency: string
  every: number
  lead_days: number
  active: boolean
  generated: number
  anchor_date: string
  weekdays: number[] | null
  month_mode: string
  ends_on: string | null
  max_count: number | null
  create_mode: string
  copy_assignees: boolean
  copy_subtasks: boolean
  copy_fields: boolean
}

export function paraRecorrencia(r: Linha): Recorrencia {
  return {
    frequencia: r.frequency as Frequencia,
    cada: r.every,
    antecedencia: r.lead_days,
    ativa: r.active,
    geradas: r.generated,
    primeiroPrazo: r.anchor_date,
    diasSemana: r.weekdays,
    modoMensal: r.month_mode as ModoMensal,
    terminaEm: r.ends_on,
    maximo: r.max_count,
    modoCriacao: r.create_mode as ModoCriacao,
    copiarResponsaveis: r.copy_assignees,
    copiarSubtarefas: r.copy_subtasks,
    copiarCampos: r.copy_fields,
  }
}

export async function buscarRecorrencia(sb: Supabase, tarefaId: string): Promise<Recorrencia | null> {
  const { data, error } = await sb.from('task_recurrences').select(CAMPOS).eq('task_id', tarefaId).maybeSingle()
  if (error) throw error
  return data && paraRecorrencia(data)
}

/** Regras de várias tarefas de uma vez (lista, kanban e calendário), por id da tarefa-modelo. */
export async function buscarRecorrencias(sb: Supabase, tarefaIds: string[]): Promise<Map<string, Recorrencia>> {
  const mapa = new Map<string, Recorrencia>()
  if (tarefaIds.length === 0) return mapa
  const { data, error } = await sb.from('task_recurrences').select(`task_id, ${CAMPOS}`).in('task_id', tarefaIds)
  if (error) throw error
  for (const r of data ?? []) mapa.set(r.task_id, paraRecorrencia(r))
  return mapa
}

/** `null` remove a regra (parar a série: as cópias já criadas ficam). */
export async function definirRecorrencia(sb: Supabase, tarefaId: string, regra: RegraRecorrencia | null): Promise<void> {
  if (!regra) {
    const { error } = await sb.from('task_recurrences').delete().eq('task_id', tarefaId)
    if (error) throw error
    return
  }
  const campos = {
    frequency: regra.frequencia,
    every: regra.cada,
    lead_days: regra.antecedencia,
    active: regra.ativa,
    weekdays: regra.frequencia === 'weekly' ? regra.diasSemana : null,
    month_mode: regra.frequencia === 'monthly' ? regra.modoMensal : 'day',
    ends_on: regra.terminaEm,
    max_count: regra.maximo,
    create_mode: regra.modoCriacao,
    copy_assignees: regra.copiarResponsaveis,
    copy_subtasks: regra.copiarSubtarefas,
    copy_fields: regra.copiarCampos,
  }
  // A âncora e o contador ficam depois da primeira cópia: mudar a regra não repete datas já criadas.
  const existe = await buscarRecorrencia(sb, tarefaId)
  const { error } = existe
    ? await sb
        .from('task_recurrences')
        .update(existe.geradas === 0 ? { ...campos, anchor_date: regra.primeiroPrazo } : campos)
        .eq('task_id', tarefaId)
    : await sb.from('task_recurrences').insert({ task_id: tarefaId, anchor_date: regra.primeiroPrazo, ...campos })
  if (error) throw error
}

/** Pausa ou retoma a série sem mexer no resto da regra. */
export async function pausarRecorrencia(sb: Supabase, tarefaId: string, ativa: boolean): Promise<void> {
  const { error, count } = await sb.from('task_recurrences').update({ active: ativa }, { count: 'exact' }).eq('task_id', tarefaId)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

export type SerieDaTarefa = {
  modeloId: string
  modeloTitulo: string
  /** Regra do modelo (nula se a série foi parada). */
  regra: Recorrencia | null
  criadas: number
}

/** A tarefa é cópia de uma série? Devolve o modelo, a regra e quantas cópias já existem. */
export async function buscarSerieDaTarefa(sb: Supabase, tarefaId: string): Promise<SerieDaTarefa | null> {
  const { data, error } = await sb.from('tasks').select('recurrence_source_id').eq('id', tarefaId).maybeSingle()
  if (error) throw error
  const modeloId = data?.recurrence_source_id
  if (!modeloId) return null
  const [modelo, regra, copias] = await Promise.all([
    sb.from('tasks').select('title').eq('id', modeloId).maybeSingle(),
    buscarRecorrencia(sb, modeloId),
    sb.from('tasks').select('id', { count: 'exact', head: true }).eq('recurrence_source_id', modeloId),
  ])
  if (modelo.error) throw modelo.error
  if (copias.error) throw copias.error
  return { modeloId, modeloTitulo: modelo.data?.title ?? '', regra, criadas: copias.count ?? 0 }
}

export async function contarCopias(sb: Supabase, modeloId: string): Promise<number> {
  const { count, error } = await sb.from('tasks').select('id', { count: 'exact', head: true }).eq('recurrence_source_id', modeloId)
  if (error) throw error
  return count ?? 0
}

/** Depois de concluir uma tarefa de série "ao concluir": a cópia aberta criada agora há pouco, se houver. */
export async function proximaDaSerie(sb: Supabase, tarefaId: string): Promise<{ id: string; prazo: string | null } | null> {
  const { data: t, error } = await sb.from('tasks').select('recurrence_source_id').eq('id', tarefaId).maybeSingle()
  if (error) throw error
  const modeloId = t?.recurrence_source_id ?? tarefaId
  const desde = new Date(Date.now() - 2 * 60_000).toISOString()
  const { data, error: e2 } = await sb
    .from('tasks')
    .select('id, due_date')
    .eq('recurrence_source_id', modeloId)
    .neq('id', tarefaId)
    .is('completed_at', null)
    .is('archived_at', null)
    .gte('created_at', desde)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (e2) throw e2
  return data ? { id: data.id, prazo: data.due_date } : null
}
