import { limparOpcoes, type OpcaoCampoCliente, type TipoCampoCliente } from '@/dominio/clientes-galeria'
import { urlLeitura } from '@/infra/r2'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type CampoCliente = { id: string; nome: string; tipo: TipoCampoCliente; naCapa: boolean; posicao: number; opcoes: OpcaoCampoCliente[] }
/** `logo`: a logo do cliente (a mesma da página da bio), quadradinha por cima da capa. */
export type Capa = { url: string | null; credito: string | null; logo: string | null }

export async function listarCamposCliente(sb: Supabase): Promise<CampoCliente[]> {
  const linhas = dados(await sb.from('client_fields').select('id, name, kind, show_on_card, position, options').order('position').order('created_at'))
  return linhas.map((c) => ({ id: c.id, nome: c.name, tipo: c.kind as TipoCampoCliente, naCapa: c.show_on_card, posicao: c.position, opcoes: limparOpcoes(c.options) }))
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
  const linhas = dados(await sb.from('clients').select('id, cover_url, cover_credit, bio_logo'))
  const capas = await Promise.all(linhas.map(async (l) => [l.id, { url: await resolverCapa(l.cover_url), credito: l.cover_credit, logo: await resolverCapa(l.bio_logo) }] as const))
  return Object.fromEntries(capas)
}
