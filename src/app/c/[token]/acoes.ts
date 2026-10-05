'use server'

import { revalidatePath } from 'next/cache'
import { getDb } from '@/db/conexao'
import type { Decisao } from '@/dominio/tipos'
import { mensagemErro, type Resultado } from '@/lib/erros'
import { buscarClientePorToken } from '@/servicos/clientes'
import { responder } from '@/servicos/respostas'

// O token é a única credencial do cliente: revalidado a cada chamada.
export async function acaoResponder(
  token: string,
  postId: string,
  versaoNumero: number,
  decisao: Decisao,
  comentario: string,
  nome: string,
): Promise<Resultado> {
  try {
    const db = await getDb()
    const cliente = await buscarClientePorToken(db, token)
    if (!cliente) return { erro: 'Link indisponível. Fale com a agência.' }
    if (decisao !== 'aprovado' && decisao !== 'ajuste') return { erro: 'Resposta inválida.' }
    await responder(db, { clienteId: cliente.id, postId, versaoNumero, decisao, comentario, nome })
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
  revalidatePath(`/c/${token}`, 'layout')
  return { ok: true }
}
