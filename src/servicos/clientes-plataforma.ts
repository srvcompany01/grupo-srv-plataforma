import type { Supabase } from '@/infra/supabase/servidor'
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
}

const CAMPOS = 'id, name, color, legal_name, document, email, phone, status, is_internal'

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
export function lerFormCliente(form: FormData) {
  const texto = (k: string) => String(form.get(k) ?? '').trim() || null
  const status = String(form.get('status') ?? 'ativo')
  return {
    name: texto('nome') ?? '',
    legal_name: texto('razaoSocial'),
    document: texto('documento'),
    email: texto('email'),
    phone: texto('telefone'),
    status: (['ativo', 'pausado', 'encerrado'].includes(status) ? status : 'ativo') as StatusCliente,
  }
}
