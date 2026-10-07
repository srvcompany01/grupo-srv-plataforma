import { calcularFormula, type ConfigCampo, type DefinicaoCampo, type TipoCampoPersonalizado } from '@/dominio/personalizacao'
import type { TarefaResumo } from '@/dominio/tarefas'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { dados } from './resultado'

type LinhaCampo = {
  id: string
  space_id: string | null
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

/** Campos reutilizáveis disponíveis no mesmo contexto da lista, inclusive na raiz. */
export async function listarCamposDoContexto(sb: Supabase, espacoId: string | null): Promise<DefinicaoCampo[]> {
  let consulta = sb
    .from('custom_fields')
    .select('id, space_id, name, type, config, color, icon')
    .is('archived_at', null)
    .order('position')
  consulta = espacoId ? consulta.eq('space_id', espacoId) : consulta.is('space_id', null)
  return (dados(await consulta) as LinhaCampo[]).map(paraCampo)
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

type LinhaValor = { task_id: string; field_id: string; value: Json }

/**
 * Anexa os valores tipados às tarefas para que a visão de lista use exatamente a
 * mesma fonte do painel da tarefa. Fórmulas e progresso automático são calculados
 * na leitura, sem duplicar resultados derivados no banco.
 */
export function anexarValoresPersonalizados(
  tarefas: TarefaResumo[],
  campos: DefinicaoCampo[],
  linhas: LinhaValor[],
): TarefaResumo[] {
  const porTarefa = new Map<string, Map<string, Json | null>>()
  for (const tarefa of tarefas) porTarefa.set(tarefa.id, new Map())
  for (const linha of linhas) porTarefa.get(linha.task_id)?.set(linha.field_id, linha.value)

  const filhos = new Map<string, TarefaResumo[]>()
  for (const tarefa of tarefas) {
    if (tarefa.paiId) filhos.set(tarefa.paiId, [...(filhos.get(tarefa.paiId) ?? []), tarefa])
  }

  return tarefas.map((tarefa) => {
    const valores = porTarefa.get(tarefa.id) ?? new Map<string, Json | null>()
    const subtarefas = filhos.get(tarefa.id) ?? []
    const concluidas = subtarefas.filter((item) => !!item.concluidaEm).length
    for (const campo of campos) {
      if (campo.tipo === 'progress_auto') valores.set(campo.id, subtarefas.length ? Math.round((concluidas / subtarefas.length) * 100) : 0)
    }
    for (const campo of campos) {
      if (campo.tipo === 'formula') valores.set(campo.id, calcularFormula(campo.configuracao, valores))
    }
    return { ...tarefa, camposPersonalizados: Object.fromEntries(valores) }
  })
}

export async function carregarValoresPersonalizados(
  sb: Supabase,
  tarefas: TarefaResumo[],
  campos: DefinicaoCampo[],
): Promise<TarefaResumo[]> {
  if (!tarefas.length || !campos.length) return tarefas
  const linhas = dados(
    await sb
      .from('task_custom_field_values')
      .select('task_id, field_id, value')
      .in('task_id', tarefas.map((tarefa) => tarefa.id))
      .in('field_id', campos.map((campo) => campo.id)),
  ) as LinhaValor[]
  return anexarValoresPersonalizados(tarefas, campos, linhas)
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

/** Fonte tipada completa para painéis: cada tipo usa sua coluna normalizada. */
export async function valoresParaRelatorio(sb: Supabase, campoId: string) {
  return dados(
    await sb
      .from('task_custom_field_values')
      .select('task_id, field_id, value, number_value, text_value, date_value, boolean_value, updated_at')
      .eq('field_id', campoId),
  )
}
