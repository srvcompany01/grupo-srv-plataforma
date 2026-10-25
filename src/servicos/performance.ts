import 'server-only'
import { intervaloDoMes, mesDe } from '@/dominio/performance'
import { slugify } from '@/dominio/blog'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Cliente } from './clientes-plataforma'
import { googlePorMes } from './google-agencia'
import { cliquesNoPerfilPorMes } from './insights-instagram'
import { metaPorMes } from './meta-anuncios'
import { dados } from './resultado'

/**
 * Performance dos clientes, mês a mês: investimento e leads pagos (Meta e Google), interesse orgânico (cliques nos
 * links do perfil do Instagram e no link da bio da plataforma), leads confirmados da bio, faturamento e vendas.
 */

export type MesPerformance = {
  mes: string
  investidoMeta: number
  investidoGoogle: number
  formularios: number
  /** Dos formulários: leads dentro da Meta (formulário instantâneo, mensagem) e evento Lead do pixel do site. */
  leadsNaMeta: number
  leadsSite: number
  conversas: number
  conversoesGoogle: number
  cliquesPerfilInstagram: number | null
  cliquesLinkBio: number
  leadsConfirmados: number
  faturamento: number | null
  vendas: number | null
  notas: string
}

export const investido = (m: MesPerformance) => m.investidoMeta + m.investidoGoogle
export const leadsPagos = (m: MesPerformance) => m.formularios + m.conversas + m.leadsSite + Math.round(m.conversoesGoogle)

/** Os meses pedidos de um cliente (busca o período inteiro de uma vez em cada fonte). */
export async function historicoDoCliente(sb: Supabase, c: Cliente, meses: string[], hoje: string, googleConectado: boolean): Promise<{ meses: MesPerformance[]; erros: string[] }> {
  const intervalos = meses.map((mes) => ({ mes, ...intervaloDoMes(mes, hoje) }))
  const de = intervalos[0].de
  const ate = intervalos[intervalos.length - 1].ate
  const [meta, goog, ig, cliques, confirmados, resultados] = await Promise.all([
    c.metaContaId ? metaPorMes(c.metaContaId, de, ate) : null,
    c.googleAdsId && googleConectado ? googlePorMes(c.googleAdsId, de, ate) : null,
    c.metaPaginaId ? cliquesNoPerfilPorMes(c.metaPaginaId, intervalos) : null,
    sb.from('bio_clicks').select('day, clicks').eq('client_id', c.id).gte('day', de).lte('day', ate),
    sb.from('lead_confirmations').select('day').eq('client_id', c.id).gte('day', de).lte('day', ate),
    sb.from('client_monthly_results').select('month, revenue, sales, notes').eq('client_id', c.id).gte('month', de).lte('month', ate),
  ])
  const erros: string[] = []
  const ok = <T,>(x: T | { erro: string } | null, fonte: string): T | null => {
    if (x && typeof x === 'object' && 'erro' in x) {
      erros.push(`${fonte}: ${(x as { erro: string }).erro}`)
      return null
    }
    return x as T | null
  }
  const m = ok(meta, 'Meta')
  const g = ok(goog, 'Google Ads')
  const i = ok(ig, 'Instagram')
  if (cliques.error || confirmados.error || resultados.error) erros.push('Falta a migração de Performance (20261024000056_performance.sql).')
  const somaPorMes = <L extends { day: string }>(linhas: L[] | null, valor: (l: L) => number) => {
    const r = new Map<string, number>()
    for (const l of linhas ?? []) r.set(mesDe(l.day), (r.get(mesDe(l.day)) ?? 0) + valor(l))
    return r
  }
  const cliquesMes = somaPorMes(cliques.data, (l) => l.clicks)
  const confirmadosMes = somaPorMes(confirmados.data, () => 1)
  const resultadoMes = new Map((resultados.data ?? []).map((r) => [String(r.month).slice(0, 7), r]))
  return {
    erros,
    meses: meses.map((mes) => {
      const r = resultadoMes.get(mes)
      return {
        mes,
        investidoMeta: m?.get(mes)?.gasto ?? 0,
        investidoGoogle: g?.get(mes)?.custo ?? 0,
        formularios: m?.get(mes)?.formularios ?? 0,
        leadsNaMeta: m?.get(mes)?.formularios ?? 0,
        leadsSite: m?.get(mes)?.site ?? 0,
        conversas: m?.get(mes)?.conversas ?? 0,
        conversoesGoogle: g?.get(mes)?.conversoes ?? 0,
        cliquesPerfilInstagram: i ? (i.get(mes) ?? null) : null,
        cliquesLinkBio: cliquesMes.get(mes) ?? 0,
        leadsConfirmados: confirmadosMes.get(mes) ?? 0,
        faturamento: r?.revenue === null || r?.revenue === undefined ? null : Number(r.revenue),
        vendas: r?.sales ?? null,
        notas: r?.notes ?? '',
      }
    }),
  }
}

/** Lança (ou corrige) o faturamento e as vendas do mês. Vazio = não informado. */
export async function salvarResultadoMes(sb: Supabase, clienteId: string, mes: string, r: { faturamento: number | null; vendas: number | null; notas: string }): Promise<void> {
  dados(await sb.from('client_monthly_results').upsert({ client_id: clienteId, month: `${mes}-01`, revenue: r.faturamento, sales: r.vendas, notes: r.notas.slice(0, 500), updated_at: new Date().toISOString() }).select('client_id'))
}

export type LeadConfirmado = { id: string; dia: string; observacao: string; por: string }

export async function leadsConfirmadosDoMes(sb: Supabase, clienteId: string, mes: string, hoje: string): Promise<LeadConfirmado[]> {
  const { de, ate } = intervaloDoMes(mes, hoje)
  const { data, error } = await sb.from('lead_confirmations').select('id, day, observacao, profiles!lead_confirmations_created_by_fkey(full_name)').eq('client_id', clienteId).gte('day', de).lte('day', ate).order('created_at', { ascending: false })
  if (error) return []
  return (data as unknown as { id: string; day: string; observacao: string; profiles: { full_name: string } | null }[]).map((l) => ({ id: l.id, dia: l.day, observacao: l.observacao, por: l.profiles?.full_name ?? '' }))
}

export async function confirmarLead(sb: Supabase, clienteId: string, dia: string, observacao: string): Promise<void> {
  dados(await sb.from('lead_confirmations').insert({ client_id: clienteId, day: dia, observacao: observacao.trim().slice(0, 200), origem: 'instagram_bio' }).select('id'))
}

export async function removerLeadConfirmado(sb: Supabase, id: string): Promise<void> {
  dados(await sb.from('lead_confirmations').delete().eq('id', id).select('id'))
}

/** Link da bio do cliente: cria o endereço (/l/<nome>) se ainda não existir; guarda a mensagem. */
export async function configurarLinkBio(sb: Supabase, c: { id: string; nome: string }, mensagem: string): Promise<string> {
  const { data, error } = await sb.from('clients').select('bio_slug').eq('id', c.id).single()
  if (error) throw error
  let slug = data.bio_slug
  if (!slug) {
    const base = slugify(c.nome, 40) || 'cliente'
    for (const tentativa of [base, `${base}-${Math.random().toString(36).slice(2, 6)}`]) {
      const r = await sb.from('clients').update({ bio_slug: tentativa }).eq('id', c.id).select('bio_slug')
      if (!r.error) {
        slug = tentativa
        break
      }
    }
    if (!slug) throw { code: 'P0001', message: 'Não consegui criar o link agora. Tente de novo.' }
  }
  dados(await sb.from('clients').update({ bio_mensagem: mensagem.trim().slice(0, 300) || 'Olá! Vim pelo Instagram 😊' }).eq('id', c.id).select('id'))
  return slug
}

export async function linkBioDoCliente(sb: Supabase, clienteId: string): Promise<{ slug: string | null; mensagem: string; whatsapp: string | null } | null> {
  const { data, error } = await sb.from('clients').select('bio_slug, bio_mensagem, whatsapp').eq('id', clienteId).maybeSingle()
  if (error || !data) return null
  return { slug: data.bio_slug, mensagem: data.bio_mensagem, whatsapp: data.whatsapp }
}
