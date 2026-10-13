import type { Frequencia, Recorrencia } from '@/dominio/recorrencia'
import type { Supabase } from '@/infra/supabase/servidor'

const CAMPOS = 'frequency, every, lead_days, active, generated, anchor_date'

export async function buscarRecorrencia(sb: Supabase, tarefaId: string): Promise<Recorrencia | null> {
  const { data, error } = await sb.from('task_recurrences').select(CAMPOS).eq('task_id', tarefaId).maybeSingle()
  if (error) throw error
  return data && { frequencia: data.frequency as Frequencia, cada: data.every, antecedencia: data.lead_days, ativa: data.active, geradas: data.generated, primeiroPrazo: data.anchor_date }
}

/** `null` remove a regra. Ao editar, a âncora e o contador ficam: mudar a regra não repete cópias já criadas. */
export async function definirRecorrencia(
  sb: Supabase,
  tarefaId: string,
  regra: { frequencia: Frequencia; cada: number; antecedencia: number; ativa: boolean; primeiroPrazo: string } | null,
): Promise<void> {
  if (!regra) {
    const { error } = await sb.from('task_recurrences').delete().eq('task_id', tarefaId)
    if (error) throw error
    return
  }
  const campos = { frequency: regra.frequencia, every: regra.cada, lead_days: regra.antecedencia, active: regra.ativa }
  const existe = await buscarRecorrencia(sb, tarefaId)
  const { error } = existe
    ? await sb.from('task_recurrences').update(campos).eq('task_id', tarefaId)
    : await sb.from('task_recurrences').insert({ task_id: tarefaId, anchor_date: regra.primeiroPrazo, ...campos })
  if (error) throw error
}
