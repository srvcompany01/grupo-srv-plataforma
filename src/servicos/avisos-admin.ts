import { alertaDeErro, alertaDoTokenMeta } from '@/dominio/alertas'
import { somarDias } from '@/dominio/filtros'
import { resumoSemanal, type NumerosSemana } from '@/dominio/resumo-semanal'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Cliente } from './clientes-plataforma'
import { campanhasGoogle, situacaoGoogle } from './google-agencia'
import { resumoMetaPorTipo } from './meta-anuncios'

/** Aviso no sino dos admins ativos (ou admins e gestores). Não repete o mesmo `link` + trecho de mensagem dentro de `horas`. */
async function avisarAdmins(message: string, link: string, prefixo: string, horas: number, papeis: ('admin' | 'gestor')[] = ['admin']): Promise<boolean> {
  const admin = criarClienteAdmin()
  const { count } = await admin.from('notifications').select('id', { count: 'exact', head: true }).eq('kind', 'alerta').eq('link', link).like('message', `%${prefixo}%`).gte('created_at', new Date(Date.now() - horas * 3_600_000).toISOString())
  if (count) return false
  const { data: admins } = await admin.from('profiles').select('id').in('role', papeis).eq('active', true)
  if (!admins?.length) return false
  await admin.from('notifications').insert(admins.map((a) => ({ user_id: a.id, kind: 'alerta', message, link })))
  return true
}

/** Rotina diária: avisa quando o token da Meta está inválido ou a 10 dias de vencer (repete a cada 3 dias). */
export async function avisarTokenMeta(agora = Date.now()): Promise<boolean> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return false
  const versao = process.env.META_API_VERSION || 'v23.0'
  const r = await fetch(`https://graph.facebook.com/${versao}/debug_token?${new URLSearchParams({ input_token: token, access_token: token })}`, { cache: 'no-store' })
  const corpo = (await r.json().catch(() => null)) as { data?: { is_valid?: boolean; expires_at?: number } } | null
  const mensagem = alertaDoTokenMeta(corpo?.data ?? null, agora)
  return mensagem ? avisarAdmins(mensagem, '/config/integracoes', 'Token da Meta', 72) : false
}

/** Erro do servidor em produção: um aviso por endereço a cada 24 h e no máximo 20 linhas de aviso por dia, para o sino não encher. */
export async function avisarErro(mensagem: string, caminho: string, tipo: string, digest?: string): Promise<void> {
  const { count } = await criarClienteAdmin().from('notifications').select('id', { count: 'exact', head: true }).eq('kind', 'alerta').like('message', 'Erro na plataforma%').gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
  if ((count ?? 0) >= 20) return
  await avisarAdmins(alertaDeErro(mensagem, caminho, tipo, digest), caminho.split('?')[0] || '/', 'Erro na plataforma', 24)
}

/** Leads, cliques e gasto do cliente no período, somando Meta (captação) e Google. Fonte com erro conta zero. */
async function numerosDoPeriodo(c: Cliente, periodo: { de: string; ate: string }, google: boolean): Promise<NumerosSemana> {
  const [meta, g] = await Promise.all([
    c.metaContaId ? resumoMetaPorTipo(c.metaContaId, periodo) : null,
    google && c.googleAdsId ? campanhasGoogle(c.googleAdsId, periodo) : null,
  ])
  const n = { gasto: 0, cliques: 0, leads: 0 }
  if (meta && !('erro' in meta)) {
    n.gasto += meta.total.gasto
    n.cliques += meta.captacao.cliques
    n.leads += meta.captacao.leads
  }
  if (g && !('erro' in g)) for (const k of g.campanhas) {
    n.gasto += k.custo
    n.cliques += k.cliques
    n.leads += Math.round(k.conversoes)
  }
  return n
}

/** Toda segunda: um aviso por cliente com os 7 dias que terminaram ontem × os 7 anteriores, para admins e gestores. */
export async function avisarResumoSemanal(clientes: Cliente[], hoje: string): Promise<number> {
  const google = (await situacaoGoogle()).conectado
  const atual = { de: somarDias(hoje, -7), ate: somarDias(hoje, -1) }
  const anterior = { de: somarDias(hoje, -14), ate: somarDias(hoje, -8) }
  let avisos = 0
  for (const c of clientes.filter((x) => !x.interno && x.status !== 'encerrado' && (x.metaContaId || x.googleAdsId))) {
    const [a, b] = await Promise.all([numerosDoPeriodo(c, atual, google), numerosDoPeriodo(c, anterior, google)]).catch(() => [null, null])
    const mensagem = a && b ? resumoSemanal(c.nome, a, b) : null
    if (mensagem && (await avisarAdmins(mensagem, `/anuncios?cliente=${c.id}`, 'Resumo da semana', 120, ['admin', 'gestor']))) avisos++
  }
  return avisos
}
