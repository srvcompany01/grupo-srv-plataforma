import type { Categoria, StatusLista } from '@/dominio/tarefas'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type Lista = {
  id: string
  nome: string
  mes: string | null
  cliente: { id: string; nome: string }
  espaco: { id: string; nome: string }
  status: (StatusLista & { posicao: string })[]
  /** Gestor do espaço (ou admin): cria/edita status, arquiva tarefas. */
  podeGerir: boolean
}

/** null se a lista não existe ou a RLS esconde (a página responde 404). */
export async function buscarLista(sb: Supabase, id: string): Promise<Lista | null> {
  const { data: l, error } = await sb
    .from('lists')
    .select('id, name, reference_month, space_id, clients(id, name), spaces(id, name), list_statuses(id, name, color, category, position)')
    .eq('id', id)
    .is('archived_at', null)
    .maybeSingle()
  if (error) throw error
  if (!l) return null
  const { data: podeGerir } = await sb.rpc('is_space_manager', { space: l.space_id })
  return {
    id: l.id,
    nome: l.name,
    mes: l.reference_month,
    cliente: { id: l.clients?.id ?? '', nome: l.clients?.name ?? '' },
    // Responsável de fora do espaço lê a lista mas não o espaço.
    espaco: { id: l.space_id, nome: l.spaces?.name ?? '' },
    status: l.list_statuses
      .map((s) => ({ id: s.id, nome: s.name, cor: s.color, categoria: s.category as Categoria, posicao: s.position }))
      .sort((a, b) => (a.posicao < b.posicao ? -1 : 1)),
    podeGerir: !!podeGerir,
  }
}

/** Listas que o usuário enxerga, para "mover para outra lista". */
export async function listarListasVisiveis(sb: Supabase) {
  const linhas = dados(
    await sb.from('lists').select('id, name, reference_month, clients(id, name), spaces(name)').is('archived_at', null).order('name'),
  )
  return linhas.map((l) => ({
    id: l.id,
    nome: l.name,
    mes: l.reference_month,
    clienteId: l.clients?.id ?? '',
    clienteNome: l.clients?.name ?? '',
    espacoNome: l.spaces?.name ?? '',
  }))
}

/** Etiquetas disponíveis num espaço (as do próprio espaço e as do espaço-pai). */
export async function listarTags(sb: Supabase, espacoId: string) {
  const { data: e } = await sb.from('spaces').select('parent_id').eq('id', espacoId).maybeSingle()
  const ids = [espacoId, e?.parent_id].filter((x): x is string => !!x)
  const linhas = dados(await sb.from('tags').select('id, name, color').in('space_id', ids).order('name'))
  return linhas.map((t) => ({ id: t.id, nome: t.name, cor: t.color }))
}

/** Status de várias listas (departamento e "Minhas tarefas" misturam listas). */
export async function statusDasListas(sb: Supabase, ids: string[]): Promise<Record<string, StatusLista[]>> {
  if (!ids.length) return {}
  const linhas = dados(
    await sb.from('list_statuses').select('id, list_id, name, color, category, position').in('list_id', ids).order('position'),
  )
  const mapa: Record<string, StatusLista[]> = {}
  for (const s of linhas) (mapa[s.list_id] ??= []).push({ id: s.id, nome: s.name, cor: s.color, categoria: s.category as Categoria })
  return mapa
}
