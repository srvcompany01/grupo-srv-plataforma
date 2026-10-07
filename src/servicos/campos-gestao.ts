import { caminhoDaLista, type Local } from '@/dominio/campos-gestao'
import type { ConfigCampo, DefinicaoCampo, TipoCampoPersonalizado } from '@/dominio/personalizacao'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type ListaGestao = { id: string; nome: string; espacoId: string | null; caminho: string }
export type CampoGestao = DefinicaoCampo & { espaco: string; listaIds: string[] }
export type DadosGestaoCampos = { campos: CampoGestao[]; espacos: Local[]; listas: ListaGestao[] }

/** Todos os campos ativos com as listas em que cada um está vinculado, para a tela de gestão (admin). */
export async function dadosGestaoCampos(sb: Supabase): Promise<DadosGestaoCampos> {
  const [espacos, pastas, listas, campos, vinculos] = await Promise.all([
    sb.from('spaces').select('id, name').is('archived_at', null).order('position'),
    sb.from('folders').select('id, name, space_id').is('archived_at', null),
    sb.from('lists').select('id, name, space_id, folder_id').is('archived_at', null).order('position'),
    sb.from('custom_fields').select('id, space_id, name, type, config, color, icon').is('archived_at', null).order('position'),
    sb.from('list_custom_fields').select('list_id, field_id'),
  ])
  const locaisEspaco = dados(espacos).map((e) => ({ id: e.id, nome: e.name }))
  const locaisPasta = dados(pastas).map((p) => ({ id: p.id, nome: p.name, espacoId: p.space_id }))
  const listasGestao = dados(listas).map((l) => ({
    id: l.id,
    nome: l.name,
    espacoId: l.space_id,
    caminho: caminhoDaLista({ id: l.id, nome: l.name, espacoId: l.space_id, pastaId: l.folder_id }, locaisEspaco, locaisPasta),
  }))
  const idsListas = new Set(listasGestao.map((l) => l.id))
  const porCampo = new Map<string, string[]>()
  for (const v of dados(vinculos)) {
    if (idsListas.has(v.list_id)) porCampo.set(v.field_id, [...(porCampo.get(v.field_id) ?? []), v.list_id])
  }
  return {
    espacos: locaisEspaco,
    listas: listasGestao,
    campos: dados(campos).map((c) => ({
      id: c.id,
      espacoId: c.space_id,
      nome: c.name,
      tipo: c.type as TipoCampoPersonalizado,
      configuracao: c.config as ConfigCampo,
      cor: c.color,
      icone: c.icon,
      espaco: c.space_id ? (locaisEspaco.find((e) => e.id === c.space_id)?.nome ?? 'Espaço removido') : 'Raiz',
      listaIds: porCampo.get(c.id) ?? [],
    })),
  }
}
