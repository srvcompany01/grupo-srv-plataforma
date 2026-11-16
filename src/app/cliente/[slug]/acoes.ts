'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/servicos/acao'
import { clientePorLink, responderPost } from '@/servicos/portal-conteudo'
import { headers } from 'next/headers'
import { ipDoPedido, limitesDoComentario } from '@/dominio/limite'
import { comentarComoCliente, dentroDosLimites } from '@/servicos/prova-visual-portal'
import { lerEntradaDoPortal } from '@/dominio/prova-visual'

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

/**
 * Prova visual: o cliente comenta num ponto, num instante ou em geral (ou responde à agência).
 * O servidor resolve o cliente pelo link e a versão pela tarefa; o banco recusa se a versão já foi respondida.
 */
export async function comentarProvaAcao(slug: string, tarefaId: string, bruto: unknown): Promise<Resultado> {
  if (typeof slug !== 'string' || typeof tarefaId !== 'string' || !UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  // Nada do navegador é confiável: forma, tipos e números finitos são conferidos aqui (e de novo no banco).
  const lido = lerEntradaDoPortal(bruto)
  if ('erro' in lido) return { erro: lido.erro }
  const entrada = lido.entrada
  const cliente = await clientePorLink(slug)
  if (!cliente) return { erro: 'Link inválido.' }
  // Limite compartilhado (no banco) por link+post e por IP: o link é público e qualquer portador poderia encher a prova visual.
  const ip = ipDoPedido((await headers()).get('x-forwarded-for'))
  if (!(await dentroDosLimites(limitesDoComentario(cliente.slug, tarefaId, ip)))) return { erro: 'Muitos comentários em pouco tempo. Aguarde alguns minutos e tente de novo.' }
  try {
    await comentarComoCliente(cliente.id, tarefaId, { ...entrada, nome: entrada.nome.trim().slice(0, 80) })
    revalidatePath(`/cliente/${cliente.slug}`, 'layout')
    return { ok: 'Comentário enviado' }
  } catch (e) {
    console.error(e)
    return { erro: e instanceof Error && e.message ? e.message : 'Não foi possível enviar. Verifique a conexão e tente de novo.' }
  }
}
