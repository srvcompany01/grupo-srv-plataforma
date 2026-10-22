'use server'

import { revalidatePath } from 'next/cache'
import { exigirCliente } from '@/infra/supabase/sessao'
import type { Resultado } from '@/servicos/acao'
import { clienteDoUsuario, responderPost } from '@/servicos/portal-conteudo'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** O cliente aprova ou pede ajuste na versão atual do post (o servidor confere que o post é dele). */
export async function responderPostAcao(tarefaId: string, decisao: 'aprovado' | 'ajuste', comentario: string): Promise<Resultado> {
  const eu = await exigirCliente()
  if (!UUID.test(tarefaId) || (decisao !== 'aprovado' && decisao !== 'ajuste')) return { erro: 'Post inválido.' }
  const texto = comentario.trim().slice(0, 2000)
  if (decisao === 'ajuste' && !texto) return { erro: 'Conte o que você quer ajustar.' }
  const cliente = await clienteDoUsuario(eu.id)
  if (!cliente) return { erro: 'Seu acesso não está ligado a um cliente.' }
  try {
    const r = await responderPost(cliente.id, { id: eu.id, nome: eu.nome }, tarefaId, decisao, texto)
    revalidatePath('/portal')
    return { ok: decisao === 'ajuste' ? 'Pedido de ajuste enviado para a equipe.' : r.publicado ? 'Aprovado e publicado!' : 'Aprovado! O post sai no dia e hora marcados.' }
  } catch (e) {
    console.error(e)
    return { erro: e instanceof Error && e.message ? e.message : 'Não foi possível enviar a resposta.' }
  }
}
