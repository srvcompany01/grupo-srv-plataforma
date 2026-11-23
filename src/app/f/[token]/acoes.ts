'use server'

import { perguntasVisiveis, validarResposta, type RespostasFormulario } from '@/dominio/formularios'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Json } from '@/infra/supabase/tipos'
import { buscarFormularioPublico, enviarFormulario } from '@/servicos/formularios'

export type RespostaPublica = { ok: true } | { erro: string }
export async function enviarFormularioAcao(token: string, form: FormData): Promise<RespostaPublica> {
  if (String(form.get('website') ?? '').trim()) return { ok: true }
  const sb = criarClienteAdmin()
  const formulario = await buscarFormularioPublico(sb, token)
  if (!formulario) return { erro: 'Este formulário não está mais disponível.' }
  const brutas: RespostasFormulario = {}
  for (const c of formulario.campos) {
    const valores = form.getAll(c.key).filter((v): v is string => typeof v === 'string').map((v) => v.trim())
    if (!valores.length) continue
    const valor = valores[0]
    brutas[c.key] = c.tipo === 'checkbox' || c.tipo === 'terms' ? valor === 'on' : c.multipla ? valores.filter(Boolean) : ['number', 'money', 'rating'].includes(c.tipo) && valor !== '' ? Number(valor.replace(',', '.')) : valor
  }
  const respostas: Record<string, Json> = {}
  for (const c of perguntasVisiveis(formulario.campos, brutas)) {
    const erro = validarResposta(c, brutas[c.key])
    if (erro) return { erro }
    if (c.tipo !== 'statement' && brutas[c.key] !== undefined && brutas[c.key] !== '') respostas[c.key] = brutas[c.key]
  }
  if (formulario.configuracao?.capturarUtm) {
    const utm: Record<string, string> = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']) {
      const v = form.get(`__${k}`); if (typeof v === 'string' && v.trim()) utm[k] = v.slice(0, 500)
    }
    respostas.__utm = utm
  }
  try { await enviarFormulario(sb, token, respostas); return { ok: true } }
  catch (e) {
    const erro = e as { code?: string; message?: string }
    if (erro.code === 'P0001' && erro.message) return { erro: erro.message }
    console.error(e); return { erro: 'Não foi possível enviar agora. Tente de novo.' }
  }
}
