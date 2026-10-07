import { prazoEm, type Filtros } from '@/dominio/filtros'
import { posicaoEntre } from '@/dominio/posicao'
import type { Prioridade, TarefaResumo } from '@/dominio/tarefas'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { dados } from './resultado'

export type Escopo = { listaId: string } | { espacoId: string } | { responsavelId: string }

const CAMPOS_RESUMO = `id, title, parent_task_id, status_id, priority, due_date, position, completed_at, list_id,
  lists!inner(name, space_id, reference_month, archived_at, clients(id, name, color)),
  task_assignees(profiles(id, full_name, avatar_url)),
  task_tags(tags(id, name, color))`

/** Tarefas não arquivadas do escopo, com os filtros aplicados no banco. A RLS esconde o resto. */
export async function listarTarefas(sb: Supabase, escopo: Escopo, filtros: Filtros, hoje: string): Promise<TarefaResumo[]> {
  // Aliases extras (!inner) filtram sem cortar a lista completa de responsáveis/etiquetas exibida.
  let campos = CAMPOS_RESUMO
  if (filtros.responsaveis.length || 'responsavelId' in escopo) campos += ', filtro_resp:task_assignees!inner(user_id)'
  if (filtros.tags.length) campos += ', filtro_tag:task_tags!inner(tag_id)'

  // Lista arquivada (ou de pasta/departamento arquivado, que arquivam as listas) some das telas.
  let q = sb.from('tasks').select(campos).is('archived_at', null).is('lists.archived_at', null)

  if ('listaId' in escopo) q = q.eq('list_id', escopo.listaId)
  if ('espacoId' in escopo) {
    const filhos = dados(await sb.from('spaces').select('id').eq('parent_id', escopo.espacoId))
    q = q.in('lists.space_id', [escopo.espacoId, ...filhos.map((f) => f.id)])
  }
  if ('responsavelId' in escopo) q = q.eq('filtro_resp.user_id', escopo.responsavelId)
  if (filtros.responsaveis.length) q = q.in('filtro_resp.user_id', filtros.responsaveis)
  if (filtros.tags.length) q = q.in('filtro_tag.tag_id', filtros.tags)
  if (filtros.status.length) q = q.in('status_id', filtros.status)
  if (filtros.prioridades.length) q = q.in('priority', filtros.prioridades)
  if (filtros.clientes.length) q = q.in('client_id', filtros.clientes)
  if (filtros.mes) q = q.eq('lists.reference_month', filtros.mes)
  if (filtros.busca) q = q.ilike('title', `%${filtros.busca}%`)

  const prazo = prazoEm(filtros.prazo, hoje)
  if (prazo.semPrazo) q = q.is('due_date', null)
  if (prazo.de) q = q.gte('due_date', prazo.de)
  if (prazo.ate) q = q.lte('due_date', prazo.ate)
  // "Atrasadas" = prazo vencido e ainda não concluída.
  if (filtros.prazo === 'atrasadas') q = q.is('completed_at', null)

  const linhas = dados(await q.order('position').limit(2000)) as unknown as LinhaResumo[]
  return linhas.map(paraResumo)
}

type LinhaResumo = {
  id: string
  title: string
  parent_task_id: string | null
  status_id: string
  priority: string
  due_date: string | null
  position: string
  completed_at: string | null
  list_id: string
  lists: { name: string; clients: { id: string; name: string; color: string } | null } | null
  task_assignees: { profiles: { id: string; full_name: string; avatar_url: string | null } | null }[]
  task_tags: { tags: { id: string; name: string; color: string } | null }[]
}

function paraResumo(t: LinhaResumo): TarefaResumo {
  return {
    id: t.id,
    titulo: t.title,
    paiId: t.parent_task_id,
    statusId: t.status_id,
    prioridade: t.priority as Prioridade,
    prazo: t.due_date,
    posicao: t.position,
    concluidaEm: t.completed_at,
    listaId: t.list_id,
    listaNome: t.lists?.name ?? '',
    clienteId: t.lists?.clients?.id ?? '',
    clienteNome: t.lists?.clients?.name ?? '',
    clienteCor: t.lists?.clients?.color ?? '#64748b',
    camposPersonalizados: {},
    responsaveis: t.task_assignees.flatMap((a) => (a.profiles ? [{ id: a.profiles.id, nome: a.profiles.full_name, avatar: a.profiles.avatar_url }] : [])),
    tags: t.task_tags.flatMap((x) => (x.tags ? [{ id: x.tags.id, nome: x.tags.name, cor: x.tags.color }] : [])),
  }
}

export async function criarTarefa(
  sb: Supabase,
  d: { listaId: string; titulo: string; responsaveis: string[]; paiId?: string | null; statusId?: string | null },
): Promise<string> {
  const { data: ultima, error: e1 } = await sb
    .from('tasks')
    .select('position')
    .eq('list_id', d.listaId)
    .order('position', { ascending: false })
    .limit(1)
  if (e1) throw e1
  const { data, error } = await sb.rpc('criar_tarefa', {
    p_list: d.listaId,
    p_title: d.titulo,
    p_assignees: d.responsaveis,
    p_parent: d.paiId ?? undefined,
    p_status: d.statusId ?? undefined,
    p_position: posicaoEntre(ultima[0]?.position ?? null, null),
  })
  if (error) throw error
  return data
}

export type CamposTarefa = Partial<{
  titulo: string
  descricao: unknown
  statusId: string
  prioridade: Prioridade
  inicio: string | null
  prazo: string | null
  estimativaMin: number | null
  visivelCliente: boolean
}>

export async function atualizarTarefa(sb: Supabase, id: string, c: CamposTarefa) {
  const campos = {
    title: c.titulo,
    description: c.descricao as Json | undefined,
    status_id: c.statusId,
    priority: c.prioridade,
    start_date: c.inicio,
    due_date: c.prazo,
    estimate_minutes: c.estimativaMin,
    visible_to_client: c.visivelCliente,
  }
  // Campos undefined não vão na requisição.
  const { error, count } = await sb.from('tasks').update(campos, { count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

export async function definirResponsaveis(sb: Supabase, id: string, ids: string[]) {
  const { error } = await sb.rpc('definir_responsaveis', { p_task: id, p_assignees: ids })
  if (error) throw error
}

export async function moverTarefa(sb: Supabase, id: string, statusId: string, posicao: string) {
  const { error } = await sb.rpc('mover_tarefa', { p_task: id, p_status: statusId, p_position: posicao })
  if (error) throw error
}

export async function moverParaLista(sb: Supabase, id: string, listaId: string) {
  const { error, count } = await sb.from('tasks').update({ list_id: listaId, parent_task_id: null }, { count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

export async function arquivarTarefa(sb: Supabase, id: string) {
  const { error, count } = await sb.from('tasks').update({ archived_at: new Date().toISOString() }, { count: 'exact' }).eq('id', id)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

/** Arquiva várias tarefas-raiz; o gatilho do banco inclui todas as subtarefas. */
export async function arquivarTarefas(sb: Supabase, ids: string[]) {
  const { error, count } = await sb
    .from('tasks')
    .update({ archived_at: new Date().toISOString() }, { count: 'exact' })
    .in('id', ids)
    .is('archived_at', null)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

export type TarefaCompleta = {
  id: string
  titulo: string
  descricao: unknown
  statusId: string
  prioridade: Prioridade
  inicio: string | null
  prazo: string | null
  estimativaMin: number | null
  visivelCliente: boolean
  concluidaEm: string | null
  paiId: string | null
  pai: { id: string; titulo: string } | null
  lista: { id: string; nome: string; espacoId: string | null; mes: string | null; clienteId: string; clienteNome: string; clienteCor: string }
  responsaveis: { id: string; nome: string; avatar: string | null }[]
  tags: { id: string; nome: string; cor: string }[]
  subtarefas: TarefaResumo[]
}

/** null se a RLS esconder (a página responde 404). */
export async function buscarTarefa(sb: Supabase, id: string): Promise<TarefaCompleta | null> {
  const { data: t, error } = await sb
    .from('tasks')
    .select(
      `id, title, description, status_id, priority, start_date, due_date, estimate_minutes, visible_to_client, completed_at, parent_task_id,
       lists(id, name, space_id, reference_month, client_id, clients(name, color)),
       task_assignees(profiles(id, full_name, avatar_url)),
       task_tags(tags(id, name, color))`,
    )
    .eq('id', id)
    .is('archived_at', null)
    .maybeSingle()
  if (error) throw error
  if (!t) return null
  // A RLS pode esconder a tarefa-mãe: nesse caso `pai` fica null.
  const { data: pai, error: erroPai } = t.parent_task_id
    ? await sb.from('tasks').select('id, title').eq('id', t.parent_task_id).maybeSingle()
    : { data: null, error: null }
  if (erroPai) throw erroPai
  const filhas = dados(await sb.from('tasks').select(CAMPOS_RESUMO).eq('parent_task_id', id).is('archived_at', null).order('position'))
  return {
    id: t.id,
    titulo: t.title,
    descricao: t.description,
    statusId: t.status_id,
    prioridade: t.priority as Prioridade,
    inicio: t.start_date,
    prazo: t.due_date,
    estimativaMin: t.estimate_minutes,
    visivelCliente: t.visible_to_client,
    concluidaEm: t.completed_at,
    paiId: t.parent_task_id,
    pai: pai ? { id: pai.id, titulo: pai.title } : null,
    lista: {
      id: t.lists?.id ?? '',
      nome: t.lists?.name ?? '',
      espacoId: t.lists?.space_id ?? null,
      mes: t.lists?.reference_month ?? null,
      clienteId: t.lists?.client_id ?? '',
      clienteNome: t.lists?.clients?.name ?? '',
      clienteCor: t.lists?.clients?.color ?? '#64748b',
    },
    responsaveis: t.task_assignees.flatMap((a) => (a.profiles ? [{ id: a.profiles.id, nome: a.profiles.full_name, avatar: a.profiles.avatar_url }] : [])),
    tags: t.task_tags.flatMap((x) => (x.tags ? [{ id: x.tags.id, nome: x.tags.name, cor: x.tags.color }] : [])),
    subtarefas: (filhas as unknown as LinhaResumo[]).map(paraResumo),
  }
}

export async function definirEtiqueta(sb: Supabase, tarefaId: string, tagId: string, ligada: boolean) {
  const { error } = ligada
    ? await sb.from('task_tags').insert({ task_id: tarefaId, tag_id: tagId })
    : await sb.from('task_tags').delete().eq('task_id', tarefaId).eq('tag_id', tagId)
  if (error) throw error
}

export async function criarEtiqueta(sb: Supabase, espacoId: string, nome: string, cor: string): Promise<string> {
  const { data, error } = await sb.from('tags').insert({ space_id: espacoId, name: nome, color: cor }).select('id').single()
  if (error) throw error
  return data.id
}

export type ItemAtividade = {
  id: number
  action: string
  field: string | null
  old_value: unknown
  new_value: unknown
  ator: string | null
  criadoEm: string
}

export async function listarAtividade(sb: Supabase, tarefaId: string): Promise<ItemAtividade[]> {
  const linhas = dados(
    await sb
      .from('task_activity')
      .select('id, action, field, old_value, new_value, created_at, profiles(full_name)')
      .eq('task_id', tarefaId)
      .order('id', { ascending: false })
      .limit(200),
  )
  return linhas.map((a) => ({
    id: a.id,
    action: a.action,
    field: a.field,
    old_value: a.old_value,
    new_value: a.new_value,
    ator: a.profiles?.full_name ?? null,
    criadoEm: a.created_at,
  }))
}
