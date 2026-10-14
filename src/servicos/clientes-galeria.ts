import type { TipoCampoCliente } from '@/dominio/clientes-galeria'
import { urlLeitura } from '@/infra/r2'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type CampoCliente = { id: string; nome: string; tipo: TipoCampoCliente; naCapa: boolean; posicao: number }
export type Capa = { url: string | null; credito: string | null }

export async function listarCamposCliente(sb: Supabase): Promise<CampoCliente[]> {
  const linhas = dados(await sb.from('client_fields').select('id, name, kind, show_on_card, position').order('position').order('created_at'))
  return linhas.map((c) => ({ id: c.id, nome: c.name, tipo: c.kind as TipoCampoCliente, naCapa: c.show_on_card, posicao: c.position }))
}

/** cliente → (campo → valor). */
export async function valoresDosClientes(sb: Supabase): Promise<Record<string, Record<string, string>>> {
  const linhas = dados(await sb.from('client_field_values').select('client_id, field_id, value'))
  const mapa: Record<string, Record<string, string>> = {}
  for (const l of linhas) (mapa[l.client_id] ??= {})[l.field_id] = l.value
  return mapa
}

/** URL externa fica como está; chave do R2 vira URL assinada de leitura. */
async function resolverCapa(valor: string | null): Promise<string | null> {
  if (!valor) return null
  if (valor.startsWith('https://')) return valor
  try {
    return await urlLeitura(valor)
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function capasDosClientes(sb: Supabase): Promise<Record<string, Capa>> {
  const linhas = dados(await sb.from('clients').select('id, cover_url, cover_credit'))
  const capas = await Promise.all(linhas.map(async (l) => [l.id, { url: await resolverCapa(l.cover_url), credito: l.cover_credit }] as const))
  return Object.fromEntries(capas)
}
