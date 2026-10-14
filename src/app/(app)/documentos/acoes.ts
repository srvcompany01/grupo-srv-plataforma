'use server'

import { revalidatePath } from 'next/cache'
import { VISIBILIDADES, type Visibilidade } from '@/dominio/documentos'
import type { Json } from '@/infra/supabase/tipos'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as docs from '@/servicos/documentos'
import { mensagemErro } from '@/dominio/erros-banco'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ehId = (v: unknown): v is string => typeof v === 'string' && UUID.test(v)

export type ResultadoId = (NonNullable<Resultado> & { id?: string }) | null

// Todas as ações usam o cliente do usuário: a RLS decide quem vê, edita e gerencia.
async function executar(fn: (sb: Awaited<ReturnType<typeof criarClienteServidor>>, euId: string) => Promise<unknown>, ok?: string, caminho = true): Promise<Resultado> {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(() => fn(sb, eu.id), ok)
  if (caminho) revalidatePath('/', 'layout')
  return r
}

export async function criarDocumentoAcao(d: {
  titulo?: string
  modelo?: string
  listaId?: string
  clienteId?: string | null
  clienteVisivel?: boolean
  visibilidade?: Visibilidade
}): Promise<ResultadoId> {
  const eu = await exigirEquipe()
  if (d.listaId && !ehId(d.listaId)) return { erro: 'Lista inválida.' }
  if (d.clienteId && !ehId(d.clienteId)) return { erro: 'Cliente inválido.' }
  if (d.visibilidade && !VISIBILIDADES.includes(d.visibilidade)) return { erro: 'Visibilidade inválida.' }
  const sb = await criarClienteServidor()
  try {
    const id = await docs.criarDocumento(sb, eu.id, d)
    revalidatePath('/', 'layout')
    return { ok: 'Documento criado.', id }
  } catch (e) {
    console.error(e)
    return { erro: mensagemErro(e) }
  }
}

export async function atualizarDocumentoAcao(id: string, c: docs.CamposDocumento): Promise<Resultado> {
  if (!ehId(id)) return { erro: 'Documento inválido.' }
  if (c.titulo !== undefined && !c.titulo.trim()) return { erro: 'O título não pode ficar vazio.' }
  return executar((sb) => docs.atualizarDocumento(sb, id, c))
}

/** Quem pode ver: visibilidade, pessoas (só vale em "pessoas escolhidas"), cliente e se o cliente enxerga. */
export async function definirAcessoAcao(
  id: string,
  a: { visibilidade: Visibilidade; pessoas: { id: string; podeEditar: boolean }[]; clienteId: string | null; clienteVisivel: boolean },
): Promise<Resultado> {
  if (!ehId(id) || !VISIBILIDADES.includes(a.visibilidade)) return { erro: 'Dados inválidos.' }
  if (a.clienteId && !ehId(a.clienteId)) return { erro: 'Cliente inválido.' }
  if (a.clienteVisivel && !a.clienteId) return { erro: 'Escolha o cliente que poderá ver o documento.' }
  if (a.pessoas.some((p) => !ehId(p.id))) return { erro: 'Pessoa inválida.' }
  return executar(async (sb, euId) => {
    await docs.atualizarDocumento(sb, id, { visibilidade: a.visibilidade, clienteId: a.clienteId, clienteVisivel: a.clienteVisivel })
    // O dono sempre vê; só "pessoas escolhidas" usa a lista.
    await docs.definirPessoas(sb, id, a.visibilidade === 'people' ? a.pessoas.filter((p) => p.id !== euId) : [])
  }, 'Acesso atualizado.')
}

export async function excluirDocumentoAcao(id: string): Promise<Resultado> {
  if (!ehId(id)) return { erro: 'Documento inválido.' }
  return executar((sb) => docs.excluirDocumento(sb, id), 'Documento excluído.')
}

export async function vincularListaAcao(documentoId: string, listaId: string): Promise<Resultado> {
  if (!ehId(documentoId) || !ehId(listaId)) return { erro: 'Dados inválidos.' }
  return executar((sb) => docs.vincularLista(sb, documentoId, listaId), 'Documento vinculado à lista.')
}

export async function desvincularListaAcao(documentoId: string, listaId: string): Promise<Resultado> {
  if (!ehId(documentoId) || !ehId(listaId)) return { erro: 'Dados inválidos.' }
  return executar((sb) => docs.desvincularLista(sb, documentoId, listaId), 'Documento desvinculado. Ele continua na aba Documentos.')
}

export async function favoritarAcao(documentoId: string, favorito: boolean): Promise<Resultado> {
  if (!ehId(documentoId)) return { erro: 'Documento inválido.' }
  return executar((sb, euId) => docs.alternarFavorito(sb, euId, documentoId, favorito), undefined)
}

export async function registrarVisualizacaoAcao(documentoId: string): Promise<void> {
  if (!ehId(documentoId)) return
  const eu = await exigirEquipe()
  await docs.registrarVisualizacao(await criarClienteServidor(), eu.id, documentoId)
}

export async function criarPaginaAcao(documentoId: string, paiId: string | null): Promise<ResultadoId> {
  const eu = await exigirEquipe()
  void eu
  if (!ehId(documentoId) || (paiId && !ehId(paiId))) return { erro: 'Dados inválidos.' }
  try {
    const id = await docs.criarPagina(await criarClienteServidor(), documentoId, paiId)
    revalidatePath('/', 'layout')
    return { ok: 'Página criada.', id }
  } catch (e) {
    console.error(e)
    return { erro: mensagemErro(e) }
  }
}

export async function atualizarPaginaAcao(id: string, c: { titulo?: string; icone?: string | null; paiId?: string | null }): Promise<Resultado> {
  if (!ehId(id) || (c.paiId && !ehId(c.paiId))) return { erro: 'Dados inválidos.' }
  return executar((sb) => docs.atualizarPagina(sb, id, c))
}

export async function excluirPaginaAcao(id: string): Promise<Resultado> {
  if (!ehId(id)) return { erro: 'Página inválida.' }
  return executar((sb) => docs.excluirPagina(sb, id), 'Página excluída.')
}

/** Compacta: grava o estado do editor e descarta as alterações já incorporadas. Chamada com calma (pausa na digitação). */
export async function gravarEstadoAcao(paginaId: string, estado: { ydoc: string; conteudo: Json | null; ate: number; titulo: string }): Promise<Resultado> {
  if (!ehId(paginaId) || typeof estado.ydoc !== 'string' || estado.ydoc.length > 4_000_000 || !Number.isFinite(estado.ate)) return { erro: 'Dados inválidos.' }
  return executar((sb, euId) => docs.gravarEstado(sb, euId, paginaId, estado), undefined, false)
}

export async function listarVersoesAcao(paginaId: string) {
  await exigirEquipe()
  if (!ehId(paginaId)) return []
  return docs.listarVersoes(await criarClienteServidor(), paginaId)
}

export async function salvarVersaoAcao(paginaId: string, conteudo: Json | null, ydoc: string | null, titulo: string): Promise<Resultado> {
  if (!ehId(paginaId)) return { erro: 'Página inválida.' }
  return executar((sb, euId) => docs.salvarVersao(sb, euId, paginaId, conteudo, ydoc, titulo), 'Versão salva.', false)
}

export async function listarComentariosAcao(paginaId: string) {
  await exigirEquipe()
  if (!ehId(paginaId)) return []
  return docs.listarComentarios(await criarClienteServidor(), paginaId)
}

export async function comentarAcao(paginaId: string, texto: string, trecho?: string | null): Promise<Resultado> {
  if (!ehId(paginaId)) return { erro: 'Página inválida.' }
  if (!texto.trim()) return { erro: 'Escreva o comentário.' }
  return executar((sb, euId) => docs.criarComentario(sb, euId, paginaId, texto, trecho), undefined, false)
}

export async function resolverComentarioAcao(id: string, resolvido: boolean): Promise<Resultado> {
  if (!ehId(id)) return { erro: 'Comentário inválido.' }
  return executar((sb) => docs.resolverComentario(sb, id, resolvido), undefined, false)
}

export async function excluirComentarioAcao(id: string): Promise<Resultado> {
  if (!ehId(id)) return { erro: 'Comentário inválido.' }
  return executar((sb) => docs.excluirComentario(sb, id), undefined, false)
}
