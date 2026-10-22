import type { Supabase } from '@/infra/supabase/servidor'
import type { StatusTime } from '@/dominio/time'
import { dados } from './resultado'

export type Membro = {
  id: string
  nome: string
  papel: string
  vistoEm: string | null
  ativoEm: string | null
  status: StatusTime
  statusTexto: string
  statusAte: string | null
  /** Minutos ativos no dia pedido. */
  minutosHoje: number
}

/** Pessoas ativas da equipe com presença e status. null sem a migration do Time. */
export async function quadroDoTime(sb: Supabase, hoje: string): Promise<Membro[] | null> {
  const [pessoas, presenca, hojeAtivo] = await Promise.all([
    sb.from('profiles').select('id, full_name, role').neq('role', 'cliente').eq('active', true).order('full_name').then(dados),
    sb.from('team_presence').select('user_id, last_seen_at, last_active_at, status, status_text, status_until'),
    sb.from('team_activity').select('user_id, active_minutes').eq('day', hoje),
  ])
  if (presenca.error) return null
  const pres = new Map(presenca.data.map((p) => [p.user_id, p]))
  const minutos = new Map((hojeAtivo.data ?? []).map((a) => [a.user_id, a.active_minutes]))
  return pessoas.map((p) => {
    const x = pres.get(p.id)
    const vencido = x?.status_until && Date.parse(x.status_until) < Date.now()
    return {
      id: p.id,
      nome: p.full_name,
      papel: p.role,
      vistoEm: x?.last_seen_at ?? null,
      ativoEm: x?.last_active_at ?? null,
      status: (vencido ? 'disponivel' : (x?.status ?? 'disponivel')) as StatusTime,
      statusTexto: vencido ? '' : (x?.status_text ?? ''),
      statusAte: vencido ? null : (x?.status_until ?? null),
      minutosHoje: minutos.get(p.id) ?? 0,
    }
  })
}

/** Minutos ativos por pessoa e dia desde `de` (a RLS só entrega os de todos para admin/gestor). */
export async function atividadeDesde(sb: Supabase, de: string): Promise<{ usuarioId: string; dia: string; minutos: number; inicio: string | null; fim: string | null }[]> {
  const { data, error } = await sb.from('team_activity').select('user_id, day, active_minutes, first_at, last_at').gte('day', de).order('day')
  if (error) return []
  return data.map((a) => ({ usuarioId: a.user_id, dia: a.day, minutos: a.active_minutes, inicio: a.first_at, fim: a.last_at }))
}

export async function registrarPresenca(sb: Supabase, ativo: boolean): Promise<void> {
  const { error } = await sb.rpc('registrar_presenca', { p_ativo: ativo })
  if (error) throw error
}

export async function definirStatus(sb: Supabase, status: StatusTime, texto: string, ate: string | null): Promise<void> {
  const { error } = await sb.rpc('definir_status', { p_status: status, p_texto: texto.trim().slice(0, 80), p_ate: ate })
  if (error) throw error
}
