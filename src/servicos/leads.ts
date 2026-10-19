import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Json } from '@/infra/supabase/tipos'
import { resumirLead, type PayloadLead } from '@/dominio/leads'
import { enviarFormulario } from './formularios'

/**
 * Guarda o lead (tabela landing_leads) e, se houver um formulário público configurado (LEADS_FORM_TOKEN), cria também a tarefa
 * na lista desse formulário. Uma falha na tarefa não perde o lead; só falha o pedido se nada foi guardado.
 * Reenviar o mesmo id (duplo clique) não duplica.
 */
export async function registrarLead(payload: PayloadLead): Promise<{ duplicado: boolean }> {
  const sb = criarClienteAdmin()
  let guardado = false
  const { error } = await sb.from('landing_leads').insert({ id: payload.id, landing: payload.source, payload: payload as unknown as Json })
  if (!error) guardado = true
  else if (error.code === '23505') return { duplicado: true }
  else console.error('Lead: não foi possível guardar na tabela', error)

  const token = process.env.LEADS_FORM_TOKEN
  if (token) {
    try {
      const { titulo, descricao } = resumirLead(payload)
      await enviarFormulario(sb, token, { title: titulo, description: descricao })
      guardado = true
    } catch (e) {
      console.error('Lead: não foi possível criar a tarefa', e)
    }
  }
  if (!guardado) throw new Error('lead_nao_guardado')
  return { duplicado: false }
}
