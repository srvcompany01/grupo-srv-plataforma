import { calcularFormula, type ConfigCampo, type DefinicaoCampo, type TipoCampoPersonalizado } from '@/dominio/personalizacao'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { dados } from './resultado'

type LinhaCampo = {
  id: string
  space_id: string
  name: string
  type: string
  config: Json
  color: string
  icon: string
}

function paraCampo(campo: LinhaCampo): DefinicaoCampo {
  return {
    id: campo.id,
    espacoId: campo.space_id,
    nome: campo.name,
    tipo: campo.type as TipoCampoPersonalizado,
    configuracao: campo.config as ConfigCampo,
    cor: campo.color,
    icone: campo.icon,
  }
}

export async function listarCamposDoEspaco(sb: Supabase, espacoId: string): Promise<DefinicaoCampo[]> {
  const linhas = dados(
    await sb
      .from('custom_fields')
      .select('id, space_id, name, type, config, color, icon')
      .eq('space_id', espacoId)
      .is('archived_at', null)
      .order('position'),
  )
  return (linhas as LinhaCampo[]).map(paraCampo)
}

export async function listarCamposDaLista(sb: Supabase, listaId: string): Promise<DefinicaoCampo[]> {
  const linhas = dados(
    await sb
      .from('list_custom_fields')
      .select('position, custom_fields!inner(id, space_id, name, type, config, color, icon, archived_at)')
      .eq('list_id', listaId)
      .is('custom_fields.archived_at', null)
      .order('position'),
  ) as unknown as { custom_fields: LinhaCampo | null }[]
  return linhas.flatMap((linha) => (linha.custom_fields ? [paraCampo(linha.custom_fields)] : []))
}

export async function listarCamposDaTarefa(sb: Supabase, tarefaId: string, listaId: string): Promise<DefinicaoCampo[]> {
  const [campos, valores, subtarefas] = await Promise.all([
    listarCamposDaLista(sb, listaId),
    sb.from('task_custom_field_values').select('field_id, value').eq('task_id', tarefaId),
    sb.from('tasks').select('id, completed_at').eq('parent_task_id', tarefaId).is('archived_at', null),
  ])
  if (valores.error) throw valores.error
  if (subtarefas.error) throw subtarefas.error
  const mapa = new Map<string, Json | null>((valores.data ?? []).map((item) => [item.field_id, item.value]))
  const total = subtarefas.data.length
  const progresso = total ? Math.round((subtarefas.data.filter((item) => !!item.completed_at).length / total) * 100) : 0

  for (const campo of campos) {
    if (campo.tipo === 'progress_auto') mapa.set(campo.id, progresso)
    campo.valor = mapa.get(campo.id) ?? null
  }
  for (const campo of campos) {
    if (campo.tipo === 'formula') {
      campo.valor = calcularFormula(campo.configuracao, mapa)
      mapa.set(campo.id, campo.valor ?? null)
    }
  }
  return campos
}

/** Dados numéricos já normalizados para relatórios, somas, médias e séries. */
export async function valoresNumericosParaRelatorio(sb: Supabase, campoId: string) {
  return dados(
    await sb
      .from('task_custom_field_values')
      .select('task_id, number_value, updated_at')
      .eq('field_id', campoId)
      .not('number_value', 'is', null),
  )
}
