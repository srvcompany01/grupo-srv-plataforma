import { instante, somarDias, type CamposCompromisso, type Compromisso, type Repeticao, type TagAgenda, type Visibilidade } from '@/dominio/agenda'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

// Compromissos com o cliente da pessoa logada: a RLS decide o que ela vê e o que pode mudar.

export const CAMPOS_COMPROMISSO = 'id, title, description, starts_at, ends_at, all_day, visibility, repeat, repeat_until, created_by, client_id, category_id, agenda_event_people(user_id), agenda_event_tags(tag_id)'

type Linha = {
  id: string; title: string; description: string; starts_at: string; ends_at: string; all_day: boolean
  visibility: string; repeat: string; repeat_until: string | null; created_by: string; client_id: string | null; category_id: string | null
  agenda_event_people: { user_id: string }[]; agenda_event_tags: { tag_id: string }[]
}

export const paraCompromisso = (l: Linha): Compromisso => ({
  id: l.id,
  titulo: l.title,
  descricao: l.description,
  inicio: new Date(l.starts_at).toISOString(),
  fim: new Date(l.ends_at).toISOString(),
  diaInteiro: l.all_day,
  visibilidade: l.visibility as Visibilidade,
  repetir: l.repeat as Repeticao,
  repetirAte: l.repeat_until,
  criadoPor: l.created_by,
  pessoas: l.agenda_event_people.map((p) => p.user_id),
  clienteId: l.client_id,
  tags: l.agenda_event_tags.map((t) => t.tag_id),
  categoriaId: l.category_id,
})

const paraLinha = (c: CamposCompromisso) => ({
  title: c.titulo, description: c.descricao, starts_at: c.inicio, ends_at: c.fim, all_day: c.diaInteiro,
  visibility: c.visibilidade, repeat: c.repetir, repeat_until: c.repetirAte, client_id: c.clienteId, category_id: c.categoriaId,
})

const semPermissao = () => new Error('row-level security: compromisso não encontrado ou sem permissão')

/** Compromissos que podem cair entre os dias `de` e `ate` (os fixos vêm todos; `ocorrencias` expande). */
export async function listarCompromissos(sb: Supabase, de: string, ate: string): Promise<Compromisso[]> {
  const linhas = dados(
    await sb.from('agenda_events').select(CAMPOS_COMPROMISSO)
      .lt('starts_at', instante(somarDias(ate, 1)).toISOString())
      .or(`repeat.neq.nunca,ends_at.gt.${instante(de).toISOString()}`),
  )
  return linhas.map(paraCompromisso)
}

export async function buscarCompromisso(sb: Supabase, id: string): Promise<Compromisso | null> {
  const l = dados(await sb.from('agenda_events').select(CAMPOS_COMPROMISSO).eq('id', id).maybeSingle())
  return l ? paraCompromisso(l) : null
}

async function gravarPessoasETags(sb: Supabase, id: string, c: CamposCompromisso) {
  dados(await sb.from('agenda_event_people').delete().eq('event_id', id))
  if (c.pessoas.length) dados(await sb.from('agenda_event_people').insert(c.pessoas.map((user_id) => ({ event_id: id, user_id }))))
  dados(await sb.from('agenda_event_tags').delete().eq('event_id', id))
  if (c.tags.length) dados(await sb.from('agenda_event_tags').insert(c.tags.map((tag_id) => ({ event_id: id, tag_id }))))
}

export async function criarCompromisso(sb: Supabase, c: CamposCompromisso): Promise<string> {
  const { data, error } = await sb.from('agenda_events').insert(paraLinha(c)).select('id').single()
  if (error) throw error
  await gravarPessoasETags(sb, data.id, c)
  return data.id
}

export async function atualizarCompromisso(sb: Supabase, id: string, c: CamposCompromisso): Promise<void> {
  if (!dados(await sb.from('agenda_events').update(paraLinha(c)).eq('id', id).select('id')).length) throw semPermissao()
  await gravarPessoasETags(sb, id, c)
}

export async function excluirCompromisso(sb: Supabase, id: string): Promise<void> {
  if (!dados(await sb.from('agenda_events').delete().eq('id', id).select('id')).length) throw semPermissao()
}

/** Tags e categorias da agenda: mesmo formato, tabelas diferentes. */
export type TipoEtiqueta = 'tag' | 'categoria'
const TABELA = { tag: 'agenda_tags', categoria: 'agenda_categories' } as const
const paraEtiqueta = (t: { id: string; name: string; color: string; created_by: string | null }): TagAgenda => ({ id: t.id, nome: t.name, cor: t.color, criadoPor: t.created_by })

export async function listarEtiquetas(sb: Supabase, tipo: TipoEtiqueta): Promise<TagAgenda[]> {
  return dados(await sb.from(TABELA[tipo]).select('id, name, color, created_by').order('name')).map(paraEtiqueta)
}

export async function criarEtiqueta(sb: Supabase, tipo: TipoEtiqueta, nome: string, cor: string): Promise<TagAgenda> {
  const { data, error } = await sb.from(TABELA[tipo]).insert({ name: nome, color: cor }).select('id, name, color, created_by').single()
  if (error) throw error
  return paraEtiqueta(data)
}

/** Some dos compromissos também (a tag sai deles; a categoria vira "sem categoria"). Só quem criou ou o admin. */
export async function excluirEtiqueta(sb: Supabase, tipo: TipoEtiqueta, id: string): Promise<void> {
  if (!dados(await sb.from(TABELA[tipo]).delete().eq('id', id).select('id')).length) throw semPermissao()
}
