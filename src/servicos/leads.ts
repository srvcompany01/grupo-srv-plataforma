import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Json } from '@/infra/supabase/tipos'
import type { PayloadLead } from '@/dominio/leads'
import { montarRespostas, respostasBasicas } from '@/dominio/leads-campos'
import { buscarFormularioPublico, enviarFormulario } from './formularios'

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
      // Os campos do formulário (CRM & Vendas) recebem os dados do lead pelo nome. Se o banco recusar algum valor, tenta de novo
      // só com título e descrição (o resumo completo): o lead não se perde por causa de um campo.
      const formulario = await buscarFormularioPublico(sb, token)
      const completas = formulario ? montarRespostas(payload, formulario.campos) : null
      const minimas = respostasBasicas(payload, formulario?.campos ?? [])
      let tarefaId: string
      try {
        tarefaId = await enviarFormulario(sb, token, completas ?? minimas)
      } catch (e) {
        if (!completas) throw e
        console.error('Lead: campos recusados, enviando só o resumo', e)
        tarefaId = await enviarFormulario(sb, token, minimas)
      }
      guardado = true
      if (!error) await sb.from('landing_leads').update({ task_id: tarefaId }).eq('id', payload.id)
    } catch (e) {
      console.error('Lead: não foi possível criar a tarefa', e)
    }
  }
  if (!guardado) throw new Error('lead_nao_guardado')
  return { duplicado: false }
}
