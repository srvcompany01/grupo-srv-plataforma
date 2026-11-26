import { createHash } from 'node:crypto'
import type { CampoFormulario, ConfigFormulario, RespostasFormulario } from '@/dominio/formularios'

const hash = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex')
const VERSAO = 'v21.0'

export type ContextoConversao = { eventId: string; url: string; ip?: string | null; userAgent?: string | null; fbp?: string | null; fbc?: string | null }

/** Dados do usuário em hash, como a Meta exige. Só usa respostas de e-mail, telefone e nome. */
export function dadosDoUsuarioMeta(campos: CampoFormulario[], respostas: RespostasFormulario, ctx: ContextoConversao) {
  const dados: Record<string, string | string[]> = {}
  for (const c of campos) {
    const v = respostas[c.key]
    if (typeof v !== 'string' || !v.trim()) continue
    if (c.tipo === 'email' && !dados.em) dados.em = [hash(v)]
    if (c.tipo === 'phone' && !dados.ph) {
      let n = v.replace(/\D/g, '')
      if (n.length === 10 || n.length === 11) n = `55${n}`
      if (n.length >= 10) dados.ph = [hash(n)]
    }
    if (c.tipo === 'name' && !dados.fn) {
      const [primeiro, ...resto] = v.trim().split(/\s+/)
      dados.fn = [hash(primeiro)]
      if (resto.length) dados.ln = [hash(resto[resto.length - 1])]
    }
  }
  if (ctx.ip) dados.client_ip_address = ctx.ip
  if (ctx.userAgent) dados.client_user_agent = ctx.userAgent
  if (ctx.fbp) dados.fbp = ctx.fbp
  if (ctx.fbc) dados.fbc = ctx.fbc
  return dados
}

/** Envia o Lead pela API de Conversões. Falha não impede o envio do formulário. */
export async function enviarLeadMeta(config: ConfigFormulario, nome: string, campos: CampoFormulario[], respostas: RespostasFormulario, ctx: ContextoConversao): Promise<void> {
  if (!config.metaPixelId || !config.metaApiToken) return
  const corpo: Record<string, unknown> = {
    data: [{
      event_name: 'Lead', event_time: Math.floor(Date.now() / 1000), event_id: ctx.eventId, action_source: 'website', event_source_url: ctx.url,
      user_data: dadosDoUsuarioMeta(campos, respostas, ctx), custom_data: { content_name: nome },
    }],
  }
  if (config.metaCodigoTeste) corpo.test_event_code = config.metaCodigoTeste
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/${config.metaPixelId}/events?access_token=${encodeURIComponent(config.metaApiToken)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) console.error('API de Conversões da Meta recusou o evento', r.status, (await r.text()).slice(0, 500))
  } catch (e) { console.error('Falha ao enviar para a API de Conversões da Meta', e) }
}
