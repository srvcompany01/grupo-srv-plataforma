import 'server-only'
import { configIA, gerarJsonProvedor } from '@/ia/modelo'
import type { PapelMensagem } from '@/dominio/atendimento'
import { lerAnaliseDaIA, montarTranscricao, promptDeAnalise, resumirQualidade, type LinhaAnalise, type Resultado, type ResumoQualidade } from '@/dominio/qualidade-atendimento'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Supabase } from '@/infra/supabase/servidor'

const JANELA_DIAS = 7
const CALMA_MS = 30 * 60_000 // só analisa a conversa que ficou parada ao menos 30 min (já "terminou")

export const iaDoAtendimentoConfigurada = () => !!configIA()

/**
 * Analisa conversas recentes de um cliente que ainda não foram analisadas (a mais nova primeiro): a IA lê o texto já
 * mascarado e devolve nota, resultado, objeções, pontos fortes e melhorias. Ao menos uma fala do cliente e uma de pessoa/robô.
 */
export async function analisarConversas(clienteId: string, max = 8, agora = Date.now()): Promise<{ analisadas: number; pendentes: number; erro?: string }> {
  const cfg = configIA()
  if (!cfg) return { analisadas: 0, pendentes: 0, erro: 'A IA não está configurada (IA_API_KEY na Vercel).' }
  const admin = criarClienteAdmin()
  const desde = new Date(agora - JANELA_DIAS * 86_400_000).toISOString()
  const [{ data: leves }, { data: feitas }] = await Promise.all([
    admin.from('wa_mensagens').select('talk_id, papel, criada_em').eq('client_id', clienteId).gte('criada_em', desde).order('criada_em').limit(20_000),
    admin.from('wa_analises').select('talk_id').eq('client_id', clienteId).gte('conversa_em', desde),
  ])
  const jaFeitas = new Set((feitas ?? []).map((f) => Number(f.talk_id)))
  const conversas = new Map<number, { papeis: Set<string>; primeira: number; ultima: number; total: number }>()
  for (const m of leves ?? []) {
    const em = Date.parse(m.criada_em)
    const c = conversas.get(Number(m.talk_id)) ?? { papeis: new Set(), primeira: em, ultima: em, total: 0 }
    c.papeis.add(m.papel)
    c.ultima = Math.max(c.ultima, em)
    c.total++
    conversas.set(Number(m.talk_id), c)
  }
  const candidatas = [...conversas]
    .filter(([talk, c]) => !jaFeitas.has(talk) && c.papeis.has('cliente') && c.papeis.size > 1 && c.total >= 3 && agora - c.ultima >= CALMA_MS)
    .sort((a, b) => b[1].ultima - a[1].ultima)
  let analisadas = 0
  for (const [talk, c] of candidatas.slice(0, max)) {
    const [{ data: msgs }, { data: conv }] = await Promise.all([
      admin.from('wa_mensagens').select('papel, texto, criada_em').eq('client_id', clienteId).eq('talk_id', talk).order('criada_em').limit(400),
      admin.from('wa_conversas').select('lead_id').eq('talk_id', talk).maybeSingle(),
    ])
    const { data: negocio } = conv?.lead_id ? await admin.from('kommo_negocios').select('ganho_em, perdido_em').eq('id', conv.lead_id).maybeSingle() : { data: null }
    const situacao = negocio?.ganho_em ? 'venda fechada (etapa ganha)' : negocio?.perdido_em ? 'negócio perdido' : 'negócio em aberto'
    const transcricao = montarTranscricao((msgs ?? []).map((m) => ({ papel: m.papel as PapelMensagem, texto: m.texto, em: Date.parse(m.criada_em) })))
    if (!transcricao) continue
    try {
      const a = await gerarJsonProvedor(cfg, promptDeAnalise(transcricao, situacao), lerAnaliseDaIA)
      // O CRM manda no resultado quando já fechou: a IA pode não ver a venda no texto.
      const resultado: Resultado = negocio?.ganho_em ? 'venda' : negocio?.perdido_em ? 'perdido' : a.resultado
      const { error } = await admin.from('wa_analises').upsert({ talk_id: talk, client_id: clienteId, conversa_em: new Date(c.primeira).toISOString(), mensagens: c.total, nota: a.nota, resultado, resumo: a.resumo, motivo_perda: a.motivoPerda, objecoes: a.objecoes, pontos_fortes: a.pontosFortes, melhorias: a.melhorias }, { onConflict: 'talk_id' })
      if (error) throw new Error(error.message)
      analisadas++
    } catch (e) {
      console.error('análise de conversa', talk, e)
      return { analisadas, pendentes: candidatas.length - analisadas, erro: e instanceof Error ? e.message : 'Falha ao analisar.' }
    }
  }
  return { analisadas, pendentes: Math.max(0, candidatas.length - analisadas) }
}

export type QualidadeDoCliente = { resumo: ResumoQualidade; conversas: LinhaAnalise[] }

/** Análises das conversas do período (data da conversa, fuso de Belém), as mais recentes primeiro. */
export async function qualidadeDoCliente(sb: Supabase, clienteId: string, de: string, ate: string): Promise<QualidadeDoCliente> {
  const { data } = await sb.from('wa_analises').select('*').eq('client_id', clienteId).gte('conversa_em', `${de}T00:00:00-03:00`).lte('conversa_em', `${ate}T23:59:59.999-03:00`).order('conversa_em', { ascending: false }).limit(500)
  const conversas: LinhaAnalise[] = (data ?? []).map((a) => ({ talkId: Number(a.talk_id), conversaEm: a.conversa_em, mensagens: a.mensagens, nota: a.nota, resultado: a.resultado as Resultado, resumo: a.resumo, motivoPerda: a.motivo_perda, objecoes: a.objecoes, pontosFortes: a.pontos_fortes, melhorias: a.melhorias }))
  return { resumo: resumirQualidade(conversas), conversas }
}
