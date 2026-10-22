'use server'

import { revalidatePath } from 'next/cache'
import { normalizarMime, validarAnexo } from '@/dominio/anexos'
import { NOME_CANAL, nomeDeCanal, validarAnexosChat } from '@/dominio/chat'
import { mensagemErro } from '@/dominio/erros-banco'
import { gerarChaveChat, urlUpload } from '@/infra/r2'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as chat from '@/servicos/chat'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const atualizar = () => revalidatePath('/chat', 'layout')

/** URL para o navegador mandar o anexo direto ao armazenamento (só para quem lê o canal). */
export async function prepararEnvioChatAcao(canalId: string, a: { nome: string; mime: string; tamanho: number }): Promise<{ chave: string; url: string } | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(canalId)) return { erro: 'Canal inválido.' }
  const mime = normalizarMime(a.mime)
  const invalido = validarAnexo({ mime, tamanho: a.tamanho })
  if (invalido) return { erro: invalido }
  try {
    const sb = await criarClienteServidor()
    const { data } = await sb.from('chat_channels').select('id').eq('id', canalId).maybeSingle()
    if (!data) return { erro: 'Você não tem permissão para isso.' }
    const chave = gerarChaveChat(canalId, mime)
    return { chave, url: await urlUpload(chave, mime, a.tamanho) }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível preparar o envio. Tente de novo.' }
  }
}

export async function enviarMensagemAcao(canalId: string, paiId: string | null, texto: string, mencoes: string[], anexos: chat.NovoAnexoChat[]): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(canalId) || (paiId && !UUID.test(paiId))) return { erro: 'Canal inválido.' }
  const corpo = texto.trim()
  if (!corpo && !anexos.length) return { erro: 'Escreva uma mensagem.' }
  if (corpo.length > 8000) return { erro: 'Mensagem longa demais (máximo de 8000 caracteres).' }
  const anexoInvalido = validarAnexosChat(canalId, anexos.map((a) => ({ ...a, mime: normalizarMime(a.mime) })))
  if (anexoInvalido) return { erro: anexoInvalido }
  const sb = await criarClienteServidor()
  const r = await tentar(() => chat.enviarMensagem(sb, { canalId, paiId, texto: corpo, mencoes: mencoes.filter((m) => UUID.test(m)).slice(0, 30), anexos: anexos.map((a) => ({ ...a, mime: normalizarMime(a.mime) })) }), '')
  atualizar()
  return r?.erro ? r : null
}

export async function editarMensagemAcao(id: string, texto: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Mensagem inválida.' }
  if (!texto.trim() || texto.length > 8000) return { erro: 'Escreva a mensagem (até 8000 caracteres).' }
  const sb = await criarClienteServidor()
  const r = await tentar(() => chat.editarMensagem(sb, id, texto.trim()), 'Mensagem editada.')
  atualizar()
  return r
}

export async function excluirMensagemAcao(id: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Mensagem inválida.' }
  const sb = await criarClienteServidor()
  const r = await tentar(() => chat.excluirMensagem(sb, id), 'Mensagem excluída.')
  atualizar()
  return r
}

export async function criarCanalAcao(e: { nome: string; descricao: string; privado: boolean; membros: string[] }): Promise<Resultado & { nome?: string }> {
  const eu = await exigirEquipe()
  const nome = nomeDeCanal(e.nome)
  if (!NOME_CANAL.test(nome)) return { erro: 'Dê um nome ao canal (letras, números e hífens).' }
  if (e.descricao.length > 300) return { erro: 'A descrição passa de 300 caracteres.' }
  const sb = await criarClienteServidor()
  try {
    await chat.criarCanal(sb, eu.id, { nome, descricao: e.descricao.trim(), privado: e.privado, membros: e.membros.filter((m) => UUID.test(m)) })
    atualizar()
    return { ok: `#${nome} criado.`, nome }
  } catch (err) {
    console.error(err)
    return { erro: (err as { code?: string }).code === '23505' ? 'Já existe um canal com esse nome.' : mensagemErro(err) }
  }
}

export async function definirMembrosAcao(canalId: string, membros: string[]): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (!UUID.test(canalId)) return { erro: 'Canal inválido.' }
  const sb = await criarClienteServidor()
  const r = await tentar(() => chat.definirMembros(sb, canalId, eu.id, membros.filter((m) => UUID.test(m))), 'Membros atualizados.')
  atualizar()
  return r
}

export async function arquivarCanalAcao(canalId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(canalId)) return { erro: 'Canal inválido.' }
  const sb = await criarClienteServidor()
  const r = await tentar(() => chat.arquivarCanal(sb, canalId), 'Canal arquivado.')
  atualizar()
  return r
}

/** Chamado pela tela quando a pessoa está vendo o canal (zera as não lidas). */
export async function marcarCanalLidoAcao(canalId: string): Promise<void> {
  await exigirEquipe()
  if (!UUID.test(canalId)) return
  const sb = await criarClienteServidor()
  await chat.marcarCanalLido(sb, canalId).catch((e) => console.error(e))
}
