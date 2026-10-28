'use server'

import { filtrosEmTexto, lerFiltros } from '@/dominio/filtros'
import { normalizarVisao } from '@/dominio/visao-salva'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { removerFiltroSalvo, removerVisao, salvarFiltro, salvarVisao } from '@/servicos/visoes'

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
