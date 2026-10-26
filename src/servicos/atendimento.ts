import 'server-only'
import { analisarAtendimento, HORARIO_PADRAO, metricasDeAtendimento, segundosUteis, type Horario, type MetricasAtendimento, type NegociosDoPeriodo, type PapelMensagem } from '@/dominio/atendimento'
import type { Analise } from '@/dominio/insights'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Supabase } from '@/infra/supabase/servidor'

export type ResumoAtendimento = {
  ligado: boolean
  horario: Horario
  periodo: { de: string; ate: string }
  metricas: MetricasAtendimento
  mensagens: { total: number; cliente: number; atendente: number; robo: number }
  negocios: NegociosDoPeriodo & { ticket: number | null; taxaDeVenda: number | null }
  porEtiqueta: { etiqueta: string; leads: number; vendas: number; receita: number }[]
  porDia: { dia: string; conversas: number; vendas: number }[]
  ultimasVendas: { quando: string; valor: number; etiquetas: string[] }[]
  analise: Analise
}

/** Expediente do cliente (padrão: seg a sex, 8h às 18h). */
export async function horarioDoCliente(sb: Supabase, clienteId: string): Promise<Horario> {
  const { data } = await sb.from('clients').select('atend_abre, atend_fecha, atend_dias').eq('id', clienteId).maybeSingle()
  return data ? { abre: data.atend_abre, fecha: data.atend_fecha, dias: data.atend_dias } : HORARIO_PADRAO
}

export async function salvarHorario(sb: Supabase, clienteId: string, h: Horario): Promise<void> {
  if (!Number.isInteger(h.abre) || !Number.isInteger(h.fecha) || h.abre < 0 || h.fecha > 1440 || h.fecha <= h.abre) throw new Error('O fim do expediente precisa ser depois do início.')
  const dias = [...new Set(h.dias)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort()
  if (!dias.length) throw new Error('Escolha pelo menos um dia da semana.')
  const { error } = await sb.from('clients').update({ atend_abre: h.abre, atend_fecha: h.fecha, atend_dias: dias }).eq('id', clienteId)
  if (error) throw new Error('Não foi possível salvar o horário.')
}

const FUSO = -3 * 3_600_000 // Belém
const diaLocal = (ms: number) => new Date(ms + FUSO).toISOString().slice(0, 10)
const PAGINA = 1000

/** Lê todas as páginas de uma consulta (o Supabase devolve até 1.000 linhas por vez), com teto de 30 mil linhas. */
async function todas<T>(consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const r: T[] = []
  for (let i = 0; i < 30; i++) {
    const { data, error } = await consulta(i * PAGINA, (i + 1) * PAGINA - 1)
    if (error || !data) break
    r.push(...data)
    if (data.length < PAGINA) break
  }
  return r
}

/** Atendimento por WhatsApp (via Kommo) de um cliente no período: tempos, vendas, origem por etiqueta e insights. */
export async function atendimentoDoCliente(sb: Supabase, clienteId: string, de: string, ate: string, agora = Date.now()): Promise<ResumoAtendimento> {
  const inicio = `${de}T00:00:00-03:00`
  const fim = `${ate}T23:59:59.999-03:00`
  const horario = await horarioDoCliente(sb, clienteId)
  const { count } = await sb.from('kommo_funis').select('pipeline_id', { count: 'exact', head: true }).eq('client_id', clienteId)
  const [mensagens, novos, ganhos, perdidos] = await Promise.all([
    todas((a, b) => sb.from('wa_mensagens').select('talk_id, papel, criada_em').eq('client_id', clienteId).gte('criada_em', inicio).lte('criada_em', fim).order('criada_em').range(a, b)),
    todas((a, b) => sb.from('kommo_negocios').select('id, etiquetas, valor, ganho_em').eq('client_id', clienteId).is('excluido_em', null).gte('criado_em', inicio).lte('criado_em', fim).order('criado_em').range(a, b)),
    todas((a, b) => sb.from('kommo_negocios').select('id, etiquetas, valor, ganho_em').eq('client_id', clienteId).is('excluido_em', null).gte('ganho_em', inicio).lte('ganho_em', fim).order('ganho_em').range(a, b)),
    sb.from('kommo_negocios').select('id', { count: 'exact', head: true }).eq('client_id', clienteId).is('excluido_em', null).gte('perdido_em', inicio).lte('perdido_em', fim),
  ])
  const metricas = metricasDeAtendimento(mensagens.map((m) => ({ conversa: String(m.talk_id), papel: m.papel as PapelMensagem, em: Date.parse(m.criada_em) })), agora, 3600, horario)
  const receita = ganhos.reduce((s, g) => s + Number(g.valor), 0)
  const ganhosSemValor = ganhos.filter((g) => !(Number(g.valor) > 0)).length
  const negocios = { novos: novos.length, ganhos: ganhos.length, perdidos: perdidos.count ?? 0, receita, ganhosSemValor }
  const etiquetas = new Map<string, { leads: number; vendas: number; receita: number }>()
  const entra = (lista: { etiquetas: string[] }[], campo: 'leads' | 'vendas', valor?: (x: never) => number) => {
    for (const n of lista) for (const e of n.etiquetas.length ? n.etiquetas : ['sem etiqueta']) {
      const a = etiquetas.get(e) ?? { leads: 0, vendas: 0, receita: 0 }
      a[campo]++
      if (campo === 'vendas') a.receita += Number((n as unknown as { valor: number }).valor)
      etiquetas.set(e, a)
    }
    void valor
  }
  entra(novos, 'leads')
  entra(ganhos, 'vendas')
  const porEtiqueta = [...etiquetas].map(([etiqueta, v]) => ({ etiqueta, ...v })).sort((a, b) => b.leads + b.vendas - (a.leads + a.vendas))
  // Conversas por dia: a primeira mensagem do cliente de cada conversa; vendas por dia: a data do ganho.
  const primeira = new Map<number, number>()
  for (const m of mensagens) if (m.papel === 'cliente') primeira.set(m.talk_id, Math.min(primeira.get(m.talk_id) ?? Infinity, Date.parse(m.criada_em)))
  const dias = new Map<string, { conversas: number; vendas: number }>()
  const dia = (d: string) => dias.get(d) ?? dias.set(d, { conversas: 0, vendas: 0 }).get(d)!
  for (const ms of primeira.values()) dia(diaLocal(ms)).conversas++
  for (const g of ganhos) if (g.ganho_em) dia(diaLocal(Date.parse(g.ganho_em))).vendas++
  return {
    ligado: (count ?? 0) > 0,
    horario,
    periodo: { de, ate },
    metricas,
    mensagens: { total: mensagens.length, cliente: mensagens.filter((m) => m.papel === 'cliente').length, atendente: mensagens.filter((m) => m.papel === 'atendente').length, robo: mensagens.filter((m) => m.papel === 'robo').length },
    negocios: { ...negocios, ticket: ganhos.length - ganhosSemValor > 0 ? receita / (ganhos.length - ganhosSemValor) : null, taxaDeVenda: novos.length ? (ganhos.length / novos.length) * 100 : null },
    porEtiqueta,
    porDia: [...dias].map(([d, v]) => ({ dia: d, ...v })).sort((a, b) => a.dia.localeCompare(b.dia)),
    ultimasVendas: [...ganhos].reverse().slice(0, 10).map((g) => ({ quando: g.ganho_em ?? '', valor: Number(g.valor), etiquetas: g.etiquetas })),
    analise: analisarAtendimento(metricas, negocios, porEtiqueta),
  }
}

const JANELA_AVISO_MS = 48 * 3_600_000

/**
 * Avisa no sino (admin e gestor) quando o cliente do WhatsApp espera uma pessoa há mais de 1 hora de expediente
 * (a última mensagem dele ficou sem resposta de um atendente). Cada espera avisa uma vez só; só olha as últimas 48 h.
 */
export async function avisarSemResposta(clienteId: string, agora = Date.now()): Promise<number> {
  const admin = criarClienteAdmin()
  const { data: cliente } = await admin.from('clients').select('name, atend_abre, atend_fecha, atend_dias').eq('id', clienteId).maybeSingle()
  if (!cliente) return 0
  const horario = { abre: cliente.atend_abre, fecha: cliente.atend_fecha, dias: cliente.atend_dias }
  const desde = new Date(agora - JANELA_AVISO_MS).toISOString()
  const msgs = await todas((a, b) => admin.from('wa_mensagens').select('talk_id, papel, criada_em').eq('client_id', clienteId).gte('criada_em', desde).order('criada_em').range(a, b))
  const esperando = new Map<number, string>() // talk → primeira mensagem do cliente depois da última resposta de uma pessoa
  for (const m of msgs) {
    if (m.papel === 'atendente') esperando.delete(m.talk_id)
    else if (m.papel === 'cliente' && !esperando.has(m.talk_id)) esperando.set(m.talk_id, m.criada_em)
  }
  const vencidas = [...esperando].filter(([, em]) => segundosUteis(Date.parse(em), agora, horario) > 3600)
  if (!vencidas.length) return 0
  const { data: jaAvisadas } = await admin.from('wa_alertas').select('talk_id, mensagem_em').eq('client_id', clienteId).gte('mensagem_em', desde)
  const feitas = new Set((jaAvisadas ?? []).map((a) => `${a.talk_id}|${Date.parse(a.mensagem_em)}`))
  const novas = vencidas.filter(([talk, em]) => !feitas.has(`${talk}|${Date.parse(em)}`))
  if (!novas.length) return 0
  await admin.from('wa_alertas').upsert(novas.map(([talk, em]) => ({ talk_id: talk, mensagem_em: em, client_id: clienteId })), { onConflict: 'talk_id,mensagem_em', ignoreDuplicates: true })
  const { data: gestores } = await admin.from('profiles').select('id').in('role', ['admin', 'gestor']).eq('active', true)
  const message = `${cliente.name}: ${novas.length === 1 ? '1 conversa espera' : `${novas.length} conversas esperam`} resposta no WhatsApp há mais de 1 hora de expediente.`
  if (gestores?.length) await admin.from('notifications').insert(gestores.map((g) => ({ user_id: g.id, kind: 'alerta', message: message.slice(0, 300), link: `/atendimento?cliente=${clienteId}` })))
  return novas.length
}
