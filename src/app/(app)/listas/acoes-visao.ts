'use server'

import { filtrosEmTexto, lerFiltros } from '@/dominio/filtros'
import { normalizarVisao } from '@/dominio/visao-salva'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { revalidatePath } from 'next/cache'
import { definirFavorita, removerFiltroSalvo, removerVisao, salvarFiltro, salvarVisao } from '@/servicos/visoes'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Guarda como a PESSOA quer ver esta lista. Só vale para ela. O texto é normalizado no servidor (lixo da URL não entra). */
export async function salvarVisaoAcao(listaId: string, params: string): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (!UUID.test(listaId)) return { erro: 'Lista inválida.' }
  const normalizado = normalizarVisao(params.slice(0, 4000))
  const sb = await criarClienteServidor()
  return tentar(() => salvarVisao(sb, eu.id, listaId, normalizado), normalizado ? 'Visualização salva. Esta lista vai abrir assim para você.' : 'Visualização original restaurada.')
}

/** Volta ao original: apaga a visualização salva. */
export async function restaurarVisaoAcao(listaId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(listaId)) return { erro: 'Lista inválida.' }
  const sb = await criarClienteServidor()
  return tentar(() => removerVisao(sb, listaId), 'Visualização original restaurada.')
}

/** Guarda a combinação de filtros atual com um nome. Só vale para a pessoa; só os campos de filtro são gravados. */
export async function salvarFiltroAcao(listaId: string, nome: string, params: string): Promise<Resultado> {
  const eu = await exigirEquipe()
  const limpo = nome.trim().slice(0, 60)
  if (!UUID.test(listaId) || !limpo) return { erro: 'Dê um nome ao filtro.' }
  const texto = filtrosEmTexto(lerFiltros(Object.fromEntries(new URLSearchParams(params.slice(0, 4000)))))
  if (!texto) return { erro: 'Marque algum filtro antes de salvar.' }
  const sb = await criarClienteServidor()
  return tentar(() => salvarFiltro(sb, eu.id, listaId, limpo, texto), 'Filtro salvo.')
}

export async function removerFiltroSalvoAcao(id: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Filtro inválido.' }
  const sb = await criarClienteServidor()
  return tentar(() => removerFiltroSalvo(sb, id), 'Filtro removido.')
}

/** Estrela da lista: marca ou desmarca como favorita da pessoa. */
export async function favoritarListaAcao(listaId: string, favorita: boolean): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (!UUID.test(listaId)) return { erro: 'Lista inválida.' }
  const sb = await criarClienteServidor()
  const resultado = await tentar(() => definirFavorita(sb, eu.id, listaId, favorita), favorita ? 'Lista adicionada aos favoritos.' : 'Lista removida dos favoritos.')
  revalidatePath('/', 'layout')
  return resultado
}

// ---------- Abas (visualizações) da lista ----------
import { ehTipoDeVisao } from '@/dominio/visoes-lista'
import * as abas from '@/servicos/visoes-lista'

const atualizarLista = () => revalidatePath('/', 'layout')

/** Cria uma aba nova do tipo escolhido (pode haver várias do mesmo tipo). Devolve o id para abrir. */
export async function criarVisaoAcao(d: { listaId: string; tipo: string; privada: boolean; fixada: boolean }): Promise<Resultado & { id?: string }> {
  const eu = await exigirEquipe()
  if (!UUID.test(d.listaId) || !ehTipoDeVisao(d.tipo)) return { erro: 'Visualização inválida.' }
  const sb = await criarClienteServidor()
  try {
    const id = await abas.criarVisao(sb, eu.id, { listaId: d.listaId, tipo: d.tipo, privada: d.privada, fixada: d.fixada })
    atualizarLista()
    return { id }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível criar a visualização.' }
  }
}

export async function renomearVisaoAcao(id: string, nome: string): Promise<Resultado> {
  await exigirEquipe()
  const limpo = nome.trim().slice(0, 60)
  if (!UUID.test(id) || !limpo) return { erro: 'Dê um nome à visualização.' }
  const sb = await criarClienteServidor()
  const r = await tentar(() => abas.renomearVisao(sb, id, limpo), 'Visualização renomeada.')
  atualizarLista()
  return r
}

/** Exclui a aba. A lista sempre fica com pelo menos uma. */
export async function excluirVisaoAcao(id: string, listaId: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id) || !UUID.test(listaId)) return { erro: 'Visualização inválida.' }
  const sb = await criarClienteServidor()
  const todas = (await abas.listarVisoes(sb, listaId)) ?? []
  if (todas.length <= 1) return { erro: 'A lista precisa ter pelo menos uma visualização.' }
  const r = await tentar(() => abas.excluirVisao(sb, id), 'Visualização excluída.')
  atualizarLista()
  return r
}

export async function duplicarVisaoAcao(id: string): Promise<Resultado & { id?: string }> {
  const eu = await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Visualização inválida.' }
  const sb = await criarClienteServidor()
  try {
    const novo = await abas.duplicarVisao(sb, eu.id, id)
    atualizarLista()
    return { ok: 'Visualização duplicada.', id: novo }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível duplicar.' }
  }
}

export async function fixarVisaoAcao(id: string, fixada: boolean): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Visualização inválida.' }
  const sb = await criarClienteServidor()
  const r = await tentar(() => abas.definirFixada(sb, id, fixada), fixada ? 'Visualização fixada.' : 'Visualização desafixada.')
  atualizarLista()
  return r
}

/** "Salvar visualização" quando a lista usa abas: grava os filtros/agrupamento/colunas atuais na própria aba. */
export async function salvarParamsDaVisaoAcao(id: string, params: string): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Visualização inválida.' }
  const normalizado = normalizarVisao(params.slice(0, 4000))
  const sb = await criarClienteServidor()
  const r = await tentar(() => abas.salvarParamsDaVisao(sb, id, normalizado), 'Visualização salva. Esta aba vai abrir assim.')
  atualizarLista()
  return r
}
