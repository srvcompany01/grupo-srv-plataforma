'use server'

import { respostasDoForm } from '@/dominio/formularios'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { buscarFormularioPublico, enviarFormulario } from '@/servicos/formularios'

export type RespostaPublica = { ok: true } | { erro: string }

/** Link público: sem login. A validação de verdade (obrigatórios, tipos) é a do banco. */
export async function enviarFormularioAcao(token: string, form: FormData): Promise<RespostaPublica> {
  // Campo escondido que só robô preenche: finge sucesso e descarta.
  if (String(form.get('website') ?? '').trim()) return { ok: true }
  const sb = criarClienteAdmin()
  const formulario = await buscarFormularioPublico(sb, token)
  if (!formulario) return { erro: 'Este formulário não está mais disponível.' }
  const tipos = Object.fromEntries(formulario.campos.map((c) => [c.key, c.tipo ?? undefined]))
  const respostas = respostasDoForm(formulario.campos, tipos, (k) => {
    const v = form.get(k)
    return typeof v === 'string' ? v : null
  })
  try {
    await enviarFormulario(sb, token, respostas)
    return { ok: true }
  } catch (e) {
    const erro = e as { code?: string; message?: string }
    // P0001 = `raise exception` das regras do banco, já escritas para o usuário final.
    if (erro.code === 'P0001' && erro.message) return { erro: erro.message }
    console.error(e)
    return { erro: 'Não foi possível enviar agora. Tente de novo.' }
  }
}
