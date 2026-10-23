import { generateNKeysBetween } from 'fractional-indexing'
import type { Supabase } from '@/infra/supabase/servidor'
import { lerContaAnuncios } from '@/dominio/anuncios-meta'
import { lerContaGoogleAds } from '@/dominio/google'
import { lerPaginaMeta } from '@/dominio/biblioteca-anuncios'
import { dados } from './resultado'

export type StatusCliente = 'ativo' | 'pausado' | 'encerrado'

export type Cliente = {
  id: string
  nome: string
  cor: string
  razaoSocial: string | null
  documento: string | null
  email: string | null
  telefone: string | null
  status: StatusCliente
  interno: boolean
  /** Posição na galeria (ordem manual); null = ainda não ordenado. */
  posicaoGaleria: string | null
  /** ID da página do Facebook (Biblioteca de Anúncios do Meta). */
  metaPaginaId: string | null
  /** Conta de anúncios do Meta (números do act_), para a galeria com os resultados. */
  metaContaId: string | null
  /** Conta do Google Ads (10 dígitos, sem traços). */
  googleAdsId: string | null
  /** Perfil do Google Meu Negócio: accounts/…/locations/… e o nome dele. */
  googlePerfil: string | null
  googlePerfilNome: string | null
}

const CAMPOS = 'id, name, color, legal_name, document, email, phone, status, is_internal, gallery_position, meta_page_id, meta_ad_account_id, google_ads_customer_id, google_location, google_location_title'

type Linha = {
  id: string
  name: string
  color: string
  legal_name: string | null
  document: string | null
  email: string | null
  phone: string | null
  status: string
  is_internal: boolean
  gallery_position: string | null
  meta_page_id: string | null
  meta_ad_account_id: string | null
  google_ads_customer_id: string | null
  google_location: string | null
  google_location_title: string | null
}

const paraCliente = (c: Linha): Cliente => ({
  id: c.id,
  nome: c.name,
  cor: c.color,
  razaoSocial: c.legal_name,
  documento: c.document,
  email: c.email,
  telefone: c.phone,
  status: c.status as StatusCliente,
  interno: c.is_internal,
  posicaoGaleria: c.gallery_position,
  metaPaginaId: c.meta_page_id,
  metaContaId: c.meta_ad_account_id,
  googleAdsId: c.google_ads_customer_id,
  googlePerfil: c.google_location,
  googlePerfilNome: c.google_location_title,
})

export async function listarClientes(sb: Supabase): Promise<Cliente[]> {
  return dados(await sb.from('clients').select(CAMPOS).order('is_internal', { ascending: false }).order('name')).map(paraCliente)
}

export async function buscarCliente(sb: Supabase, id: string): Promise<Cliente | null> {
  const c = dados(await sb.from('clients').select(CAMPOS).eq('id', id).maybeSingle())
  return c ? paraCliente(c) : null
}

/** Usuários do portal de um cliente (só admin enxerga client_users de outros). */
export async function usuariosDoCliente(sb: Supabase, clienteId: string) {
  const linhas = dados(
    await sb.from('client_users').select('user_id, profiles(full_name, email, active)').eq('client_id', clienteId),
  )
  return linhas.map((l) => ({ id: l.user_id, nome: l.profiles?.full_name ?? '', email: l.profiles?.email ?? '', ativo: l.profiles?.active ?? false }))
}

export const ROTULO_STATUS_CLIENTE: Record<StatusCliente, string> = { ativo: 'Ativo', pausado: 'Pausado', encerrado: 'Encerrado' }

/** Campos do formulário de cliente → colunas. Nome obrigatório; vazios viram null. */
/** Campos do formulário do cliente; `erro` quando a página do Meta não foi reconhecida. */
type CamposFormCliente = { meta_page_id: string | null; meta_ad_account_id: string | null; google_ads_customer_id: string | null; name: string; legal_name: string | null; document: string | null; email: string | null; phone: string | null; status: StatusCliente }

export function lerFormCliente(form: FormData): CamposFormCliente | { erro: string } {
  const texto = (k: string) => String(form.get(k) ?? '').trim() || null
  const status = String(form.get('status') ?? 'ativo')
  const meta = lerPaginaMeta(String(form.get('metaPagina') ?? ''))
  if ('erro' in meta) return { erro: meta.erro }
  const conta = lerContaAnuncios(String(form.get('metaConta') ?? ''))
  if ('erro' in conta) return { erro: conta.erro }
  const ads = lerContaGoogleAds(String(form.get('googleAds') ?? ''))
  if ('erro' in ads) return { erro: ads.erro }
  return {
    meta_page_id: meta.id,
    meta_ad_account_id: conta.id,
    google_ads_customer_id: ads.id,
    name: texto('nome') ?? '',
    legal_name: texto('razaoSocial'),
    document: texto('documento'),
    email: texto('email'),
    phone: texto('telefone'),
    status: (['ativo', 'pausado', 'encerrado'].includes(status) ? status : 'ativo') as StatusCliente,
  }
}

/** Grava a ordem da galeria: a lista inteira, na ordem em que ficou. Só admin/gestor (RLS). */
export async function ordenarGaleria(sb: Supabase, ids: string[]): Promise<void> {
  const posicoes = generateNKeysBetween(null, null, ids.length)
  const resultados = await Promise.all(ids.map((id, i) => sb.from('clients').update({ gallery_position: posicoes[i] }, { count: 'exact' }).eq('id', id)))
  for (const r of resultados) {
    if (r.error) throw r.error
    if (!r.count) throw { code: '42501' }
  }
}

/** Clientes em que ESTA pessoa marcou "trabalhei hoje" no dia informado (a RLS só mostra as marcas dela). */
export async function clientesTrabalhadosEm(sb: Supabase, dia: string): Promise<Set<string>> {
  const { data, error } = await sb.from('client_work_marks').select('client_id').eq('day', dia)
  if (error) throw error
  return new Set(data.map((m) => m.client_id))
}

/** Marcas "trabalhei hoje" DESTA pessoa a partir de um dia (inclusive), para o relatório. */
export async function marcasDeTrabalhoDesde(sb: Supabase, de: string): Promise<{ clienteId: string; dia: string }[]> {
  return dados(await sb.from('client_work_marks').select('client_id, day').gte('day', de)).map((m) => ({ clienteId: m.client_id, dia: m.day }))
}

export async function marcarTrabalhado(sb: Supabase, usuarioId: string, clienteId: string, dia: string, marcado: boolean): Promise<void> {
  const { error } = marcado
    ? await sb.from('client_work_marks').upsert({ user_id: usuarioId, client_id: clienteId, day: dia }, { onConflict: 'user_id,client_id,day', ignoreDuplicates: true })
    : await sb.from('client_work_marks').delete().eq('client_id', clienteId).eq('day', dia)
  if (error) throw error
}

/** Grava (ou tira, com null) a página do Facebook do cliente para a Biblioteca de Anúncios. Só admin/gestor (RLS). */
export async function definirPaginaMeta(sb: Supabase, clienteId: string, campos: { meta_page_id?: string | null; meta_ad_account_id?: string | null }): Promise<void> {
  const { error, count } = await sb.from('clients').update(campos, { count: 'exact' }).eq('id', clienteId)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

/** Liga (ou tira, com null) o perfil do Google Meu Negócio do cliente. Só admin/gestor (RLS). */
export async function definirPerfilGoogle(sb: Supabase, clienteId: string, perfil: { id: string; nome: string } | null): Promise<void> {
  const { error, count } = await sb.from('clients').update({ google_location: perfil?.id ?? null, google_location_title: perfil?.nome ?? null }, { count: 'exact' }).eq('id', clienteId)
  if (error) throw error
  if (!count) throw { code: '42501' }
}

/** Código do link do cliente (/cliente/<código>). null sem a migration do link. */
export async function linkDoCliente(sb: Supabase, clienteId: string): Promise<string | null> {
  const { data, error } = await sb.from('clients').select('portal_slug').eq('id', clienteId).maybeSingle()
  return error || !data ? null : data.portal_slug
}

/** Gera um link novo (o anterior para de funcionar). Nome do cliente + 6 caracteres aleatórios. Só admin/gestor (RLS). */
export async function novoLinkDoCliente(sb: Supabase, clienteId: string, nome: string): Promise<string> {
  const letras = 'abcdefghijkmnpqrstuvwxyz23456789'
  const codigo = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => letras[b % letras.length]).join('')
  const base = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '') || 'cliente'
  const slug = `${base}-${codigo}`
  const { error, count } = await sb.from('clients').update({ portal_slug: slug }, { count: 'exact' }).eq('id', clienteId)
  if (error) throw error
  if (!count) throw { code: '42501' }
  return slug
}
