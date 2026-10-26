import { NextResponse } from 'next/server'
import { formaDe } from '@/dominio/kommo'
import { usuarioAtual } from '@/infra/supabase/sessao'

export const maxDuration = 60

/**
 * Só admin: confere a conta do Kommo ligada pelas variáveis KOMMO_SUBDOMINIO e KOMMO_TOKEN (token de longa duração da
 * integração privada). Devolve o que cada parte da API entrega (status e FORMATO dos dados, sem nomes, telefones nem textos
 * de clientes) para decidir o que dá para ler: funil, campos, origem do lead, valor e mensagens.
 */
export async function GET() {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel !== 'admin') return NextResponse.json({ erro: 'Só o admin.' }, { status: 403 })
  const sub = process.env.KOMMO_SUBDOMINIO
  const token = process.env.KOMMO_TOKEN
  if (!sub || !token) return NextResponse.json({ erro: 'Faltam KOMMO_SUBDOMINIO e KOMMO_TOKEN.' }, { status: 503 })
  if (!/^[a-z0-9-]{2,60}$/i.test(sub)) return NextResponse.json({ erro: 'KOMMO_SUBDOMINIO inválido (só o que vem antes de .kommo.com).' }, { status: 400 })
  const base = `https://${sub}.kommo.com/api/v4`
  const chamar = async (rotulo: string, caminho: string) => {
    try {
      const r = await fetch(`${base}${caminho}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' })
      const texto = await r.text()
      let json: unknown = null
      try { json = texto ? JSON.parse(texto) : null } catch { /* sem corpo JSON */ }
      return { rotulo, caminho, status: r.status, json }
    } catch (e) {
      return { rotulo, caminho, status: 0, json: { erro: e instanceof Error ? e.message : 'falha' } as unknown }
    }
  }
  const conta = await chamar('conta', '/account')
  const funis = await chamar('funis', '/leads/pipelines')
  const campos = await chamar('campos dos negócios', '/leads/custom_fields?limit=250')
  const origens = await chamar('origens', '/sources')
  const perdas = await chamar('motivos de perda', '/leads/loss_reasons')
  const negocios = await chamar('negócios recentes', '/leads?limit=5&with=contacts,loss_reason,source_id&order[updated_at]=desc')
  const mensagens = await chamar('eventos de mensagem', '/events?limit=5&filter[type][]=incoming_chat_message&filter[type][]=outgoing_chat_message')
  const conversas = await chamar('conversas (talks)', '/talks?limit=5')
  const e = (v: unknown) => (v && typeof v === 'object' ? ((v as { _embedded?: Record<string, unknown[]> })._embedded ?? {}) : {})
  const pipelines = (e(funis.json).pipelines ?? []) as { id: number; name: string; _embedded?: { statuses?: { id: number; name: string; type: number }[] } }[]
  const camposLista = (e(campos.json).custom_fields ?? []) as { id: number; name: string; type: string; code?: string }[]
  return NextResponse.json({
    conta: { status: conta.status, nome: (conta.json as { name?: string } | null)?.name ?? null, subdominio: (conta.json as { subdomain?: string } | null)?.subdomain ?? null, pais: (conta.json as { country?: string } | null)?.country ?? null },
    funis: pipelines.map((p) => ({ id: p.id, nome: p.name, etapas: (p._embedded?.statuses ?? []).map((s) => ({ id: s.id, nome: s.name, tipo: s.type === 142 ? 'ganho' : s.type === 143 ? 'perdido' : 'andamento' })) })),
    camposDosNegocios: camposLista.map((c) => ({ id: c.id, nome: c.name, tipo: c.type, codigo: c.code ?? null })),
    camposQueInteressam: camposLista.filter((c) => /ctwa|click|clique|origem|source|utm|an[uú]ncio|valor|campanha/i.test(c.name)).map((c) => c.name),
    origens: { status: origens.status, itens: ((e(origens.json).sources ?? []) as { id: number; name: string; origin_code?: string }[]).map((s) => ({ id: s.id, nome: s.name, codigo: s.origin_code ?? null })) },
    motivosDePerda: { status: perdas.status, itens: ((e(perdas.json).loss_reasons ?? []) as { name: string }[]).map((m) => m.name) },
    amostras: {
      negocios: { status: negocios.status, forma: formaDe(e(negocios.json).leads?.[0]) },
      eventosDeMensagem: { status: mensagens.status, quantidade: ((e(mensagens.json).events ?? []) as unknown[]).length, forma: formaDe(e(mensagens.json).events?.[0]) },
      conversas: { status: conversas.status, forma: formaDe(e(conversas.json).talks?.[0] ?? conversas.json) },
    },
  })
}
