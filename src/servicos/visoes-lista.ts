import { ehTipoDeVisao, nomeParaNovaVisao, VISOES_INICIAIS, type VisaoDaLista } from '@/dominio/visoes-lista'
import type { VisaoTarefas } from '@/dominio/filtros'
import type { Supabase } from '@/infra/supabase/servidor'

const COLUNAS = 'id, kind, name, params, is_private, pinned, created_by'
type Linha = { id: string; kind: string; name: string; params: string; is_private: boolean; pinned: boolean; created_by: string }
const paraVisao = (l: Linha): VisaoDaLista => ({ id: l.id, tipo: (ehTipoDeVisao(l.kind) ? l.kind : 'lista') as VisaoTarefas, nome: l.name, params: l.params, privada: l.is_private, fixada: l.pinned, criadoPor: l.created_by })

/** Abas da lista visíveis para a pessoa, na ordem. `null` = a tabela ainda não existe (migration pendente): a tela usa as abas fixas de antes. */
export async function listarVisoes(sb: Supabase, listaId: string): Promise<VisaoDaLista[] | null> {
  const { data, error } = await sb.from('list_views').select(COLUNAS).eq('list_id', listaId).order('position').order('created_at')
  if (error) return null
  return (data as Linha[]).map(paraVisao)
}

/** Lista sem nenhuma aba (nova ou anterior a este recurso): cria as iniciais, públicas e fixadas. */
export async function garantirVisoesIniciais(sb: Supabase, listaId: string, euId: string): Promise<VisaoDaLista[]> {
  const { error } = await sb.from('list_views').insert(VISOES_INICIAIS.map((kind, i) => ({ list_id: listaId, kind, name: nomeParaNovaVisao(kind, []), position: i, pinned: false, created_by: euId })))
  if (error) return []
  return (await listarVisoes(sb, listaId)) ?? []
}

export async function criarVisao(sb: Supabase, euId: string, d: { listaId: string; tipo: VisaoTarefas; privada: boolean; fixada: boolean }): Promise<string> {
  const existentes = (await listarVisoes(sb, d.listaId)) ?? []
  const { data: ultima } = await sb.from('list_views').select('position').eq('list_id', d.listaId).order('position', { ascending: false }).limit(1)
  const { data, error } = await sb.from('list_views').insert({ list_id: d.listaId, kind: d.tipo, name: nomeParaNovaVisao(d.tipo, existentes), is_private: d.privada, pinned: d.fixada, position: (ultima?.[0]?.position ?? -1) + 1, created_by: euId }).select('id').single()
  if (error) throw error
  return data.id
}

export async function renomearVisao(sb: Supabase, id: string, nome: string): Promise<void> {
  const { error } = await sb.from('list_views').update({ name: nome }).eq('id', id)
  if (error) throw error
}

export async function excluirVisao(sb: Supabase, id: string): Promise<void> {
  const { error } = await sb.from('list_views').delete().eq('id', id)
  if (error) throw error
}

export async function duplicarVisao(sb: Supabase, euId: string, id: string): Promise<string> {
  const { data, error } = await sb.from('list_views').select('list_id, kind, name, params, is_private, pinned').eq('id', id).single()
  if (error) throw error
  const { data: ultima } = await sb.from('list_views').select('position').eq('list_id', data.list_id).order('position', { ascending: false }).limit(1)
  const nome = `${data.name} (cópia)`.slice(0, 60)
  const { data: nova, error: e2 } = await sb.from('list_views').insert({ list_id: data.list_id, kind: data.kind, name: nome, params: data.params, is_private: data.is_private, pinned: data.pinned, position: (ultima?.[0]?.position ?? -1) + 1, created_by: euId }).select('id').single()
  if (e2) throw e2
  return nova.id
}

export async function definirFixada(sb: Supabase, id: string, fixada: boolean): Promise<void> {
  const { error } = await sb.from('list_views').update({ pinned: fixada }).eq('id', id)
  if (error) throw error
}

export async function salvarParamsDaVisao(sb: Supabase, id: string, params: string): Promise<void> {
  const { error } = await sb.from('list_views').update({ params }).eq('id', id)
  if (error) throw error
}

/** Grava a ordem das abas (posições 0, 1, 2… na ordem dos ids). Abas que a pessoa não pode editar ficam como estavam (a RLS recusa em silêncio). */
export async function reordenarVisoes(sb: Supabase, ids: string[]): Promise<void> {
  for (const [i, id] of ids.entries()) {
    const { error } = await sb.from('list_views').update({ position: i }).eq('id', id)
    if (error) throw error
  }
}
