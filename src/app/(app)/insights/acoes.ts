'use server'

import { revalidatePath } from 'next/cache'
import { mensagemErro } from '@/dominio/erros-banco'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as com from '@/servicos/comentarios-redes'
import { ErroMeta } from '@/servicos/publicacao-meta'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PLAT = (p: string): p is 'instagram' | 'facebook' => p === 'instagram' || p === 'facebook'
const erroMeta = (e: unknown) => (e instanceof ErroMeta ? e.message : mensagemErro(e))

/** Busca agora os comentários novos (de um cliente ou de todos). */
export async function atualizarComentariosAcao(clienteId: string | null): Promise<Resultado> {
  await exigirEquipe()
  if (clienteId && !UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  try {
    const r = await com.sincronizarComentarios(clienteId ? [clienteId] : undefined)
    revalidatePath('/insights')
    if (r.erros.length && !r.novos) return { erro: r.erros.join(' · ') }
    return { ok: `${r.novos} comentário(s) novo(s)${r.alertas ? `, ${r.alertas} para atenção` : ''}.${r.erros.length ? ` Não consegui ler: ${r.erros.join(' · ')}` : ''}` }
  } catch (e) {
    console.error(e)
    return { erro: erroMeta(e) }
  }
}

export async function responderComentarioAcao(plataforma: string, id: string, texto: string): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (!PLAT(plataforma) || !/^[0-9_]{1,120}$/.test(id)) return { erro: 'Comentário inválido.' }
  const msg = String(texto ?? '').trim()
  if (!msg) return { erro: 'Escreva a resposta.' }
  if (msg.length > 2000) return { erro: 'Resposta longa demais.' }
  try {
    await com.responderComentario(await criarClienteServidor(), eu.id, plataforma, id, msg)
    revalidatePath('/insights')
    return { ok: 'Resposta publicada.' }
  } catch (e) {
    console.error(e)
    return { erro: erroMeta(e) }
  }
}

export async function ocultarComentarioAcao(plataforma: string, id: string, ocultar: boolean): Promise<Resultado> {
  await exigirEquipe()
  if (!PLAT(plataforma) || !/^[0-9_]{1,120}$/.test(id)) return { erro: 'Comentário inválido.' }
  try {
    await com.ocultarComentario(await criarClienteServidor(), plataforma, id, ocultar)
    revalidatePath('/insights')
    return { ok: ocultar ? 'Comentário ocultado (só quem escreveu e os amigos dele ainda veem).' : 'Comentário visível de novo.' }
  } catch (e) {
    console.error(e)
    return { erro: erroMeta(e) }
  }
}

export async function resolverComentarioAcao(plataforma: string, id: string): Promise<Resultado> {
  await exigirEquipe()
  if (!PLAT(plataforma) || !/^[0-9_]{1,120}$/.test(id)) return { erro: 'Comentário inválido.' }
  const r = await tentar(async () => com.resolverComentario(await criarClienteServidor(), plataforma, id), 'Marcado como resolvido.')
  revalidatePath('/insights')
  return r
}
