'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/servicos/acao'
import { clientePorLink, responderPost } from '@/servicos/portal-conteudo'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Resposta do cliente pelo link (sem login): o servidor resolve o cliente pelo link e confere que o post é dele. */
export async function responderPostAcao(slug: string, tarefaId: string, decisao: 'aprovado' | 'ajuste', comentario: string, nome: string): Promise<Resultado> {
  if (!UUID.test(tarefaId) || (decisao !== 'aprovado' && decisao !== 'ajuste')) return { erro: 'Post inválido.' }
  const quem = nome.trim().slice(0, 80)
  if (!quem) return { erro: 'Informe o seu nome.' }
  const texto = comentario.trim().slice(0, 2000)
  if (decisao === 'ajuste' && !texto) return { erro: 'Conte o que você quer ajustar.' }
  const cliente = await clientePorLink(slug)
  if (!cliente) return { erro: 'Link inválido.' }
  try {
    const r = await responderPost(cliente.id, quem, tarefaId, decisao, texto)
    revalidatePath(`/cliente/${cliente.slug}`, 'layout')
    return { ok: decisao === 'ajuste' ? 'Pedido de ajuste enviado para a equipe.' : r.publicado ? 'Aprovado e publicado!' : 'Aprovado! O post sai no dia e hora marcados.' }
  } catch (e) {
    console.error(e)
    return { erro: e instanceof Error && e.message ? e.message : 'Não foi possível enviar a resposta.' }
  }
}
