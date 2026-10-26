import 'server-only'
import { lerEventoKommo, negocioDaApi, planejarEvento, type NegocioGuardado, type NegocioKommo } from '@/dominio/kommo'
import { criarClienteAdmin } from '@/infra/supabase/admin'

/** Negócio pela API do Kommo (token de longa duração das variáveis KOMMO_SUBDOMINIO e KOMMO_TOKEN); null se não achar. */
async function negocioNaApi(id: number): Promise<NegocioKommo | null> {
  const sub = process.env.KOMMO_SUBDOMINIO
  const token = process.env.KOMMO_TOKEN
  if (!sub || !token || !/^[a-z0-9-]{2,60}$/i.test(sub)) return null
  try {
    const r = await fetch(`https://${sub}.kommo.com/api/v4/leads/${id}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' })
    return r.ok ? negocioDaApi(await r.json()) : null
  } catch {
    return null
  }
}

const idsDoEvento = (e: ReturnType<typeof lerEventoKommo>) => [...new Set([...e.negocios.map((n) => n.id), ...e.conversas.map((c) => c.leadId), ...e.mensagens.map((m) => m.leadId)].filter((x): x is number => x !== null))]

/**
 * Interpreta um evento do webhook do Kommo e grava o que vale: negócios (venda = etapa 142), conversas e mensagens
 * (texto mascarado) dos funis ligados a um cliente em kommo_funis. O resto é ignorado.
 */
export async function processarEventoKommo(corpo: unknown): Promise<{ negocios: number; conversas: number; mensagens: number; ignorados: number }> {
  const e = lerEventoKommo(corpo)
  const vazio = { negocios: 0, conversas: 0, mensagens: 0, ignorados: 0 }
  const sub = process.env.KOMMO_SUBDOMINIO
  if ((sub && e.conta && e.conta !== sub) || (!e.negocios.length && !e.conversas.length && !e.mensagens.length)) return vazio
  const sb = criarClienteAdmin()
  const { data: linhasFunis } = await sb.from('kommo_funis').select('pipeline_id, client_id')
  const funis = new Map((linhasFunis ?? []).map((f) => [Number(f.pipeline_id), f.client_id]))
  if (!funis.size) return { ...vazio, ignorados: e.negocios.length + e.conversas.length + e.mensagens.length }
  const ids = idsDoEvento(e)
  const { data: salvos } = ids.length ? await sb.from('kommo_negocios').select('*').in('id', ids) : { data: [] }
  const guardados = new Map<number, NegocioGuardado>((salvos ?? []).map((n) => [Number(n.id), { ...n, id: Number(n.id), pipeline_id: Number(n.pipeline_id), status_id: n.status_id === null ? null : Number(n.status_id), responsavel_id: n.responsavel_id === null ? null : Number(n.responsavel_id) }]))
  const agora = Date.now()
  let plano = planejarEvento(e, funis, guardados, agora)
  // Mensagem ou conversa de um negócio que ainda não conhecemos: pergunta ao Kommo em que funil ele está (no máximo 5 por evento).
  if (plano.desconhecidos.length) {
    const achados = (await Promise.all(plano.desconhecidos.slice(0, 5).map(negocioNaApi))).filter((n): n is NegocioKommo => n !== null)
    const extra = planejarEvento({ conta: e.conta, mensagens: [], conversas: [], negocios: achados }, funis, guardados, agora)
    for (const n of extra.negocios) guardados.set(n.id, n)
    plano = planejarEvento(e, funis, guardados, agora)
    plano.negocios.push(...extra.negocios.filter((x) => !plano.negocios.some((y) => y.id === x.id)))
  }
  if (plano.negocios.length) await sb.from('kommo_negocios').upsert(plano.negocios, { onConflict: 'id' })
  for (const x of plano.excluidos) await sb.from('kommo_negocios').update({ excluido_em: x.excluido_em, atualizado_em: x.excluido_em }).eq('id', x.id)
  if (plano.conversas.length) await sb.from('wa_conversas').upsert(plano.conversas, { onConflict: 'talk_id', ignoreDuplicates: true })
  if (plano.mensagens.length) await sb.from('wa_mensagens').upsert(plano.mensagens, { onConflict: 'id', ignoreDuplicates: true })
  return { negocios: plano.negocios.length + plano.excluidos.length, conversas: plano.conversas.length, mensagens: plano.mensagens.length, ignorados: plano.ignorados }
}
