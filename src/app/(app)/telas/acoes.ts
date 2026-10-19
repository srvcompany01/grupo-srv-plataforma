'use server'

import { revalidatePath } from 'next/cache'
import { DadosFunil, FUNIL_MODELO, FUNIL_VAZIO } from '@/dominio/funil'
import { DadosQuadro, QUADRO_VAZIO } from '@/dominio/quadro'
import { mensagemErro } from '@/dominio/erros-banco'
import type { Json } from '@/infra/supabase/tipos'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as telas from '@/servicos/telas'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CAMINHO = { quadro: '/quadros', funil: '/funis' } as const
const ehTipo = (v: unknown): v is telas.TipoTela => v === 'quadro' || v === 'funil'

/** O modelo vale só para funil; quadro nasce em branco. */
export async function criarTelaAcao(tipo: telas.TipoTela, titulo: string, modelo = false): Promise<(NonNullable<Resultado> & { id?: string }) | null> {
  if (!ehTipo(tipo)) return { erro: 'Tipo inválido.' }
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const dados = tipo === 'funil' ? (modelo ? FUNIL_MODELO : FUNIL_VAZIO) : QUADRO_VAZIO
  try {
    const id = await telas.criarTela(sb, eu.id, tipo, titulo.slice(0, 120), dados as unknown as Json)
    revalidatePath(CAMINHO[tipo])
    return { ok: tipo === 'quadro' ? 'Quadro criado.' : 'Funil criado.', id }
  } catch (e) {
    console.error(e)
    return { erro: mensagemErro(e) }
  }
}

/** Autosave do editor: valida o formato antes de gravar (o JSON vem do navegador). */
export async function salvarTelaAcao(tipo: telas.TipoTela, id: string, dados: unknown): Promise<Resultado> {
  if (!ehTipo(tipo) || !UUID.test(id)) return { erro: 'Dados inválidos.' }
  const r = (tipo === 'quadro' ? DadosQuadro : DadosFunil).safeParse(dados)
  if (!r.success) return { erro: 'O conteúdo tem algo inválido e não foi salvo.' }
  await exigirEquipe()
  const sb = await criarClienteServidor()
  return tentar(() => telas.salvarDadosTela(sb, tipo, id, r.data as unknown as Json), 'Salvo.')
}

export async function renomearTelaAcao(tipo: telas.TipoTela, id: string, titulo: string): Promise<Resultado> {
  if (!ehTipo(tipo) || !UUID.test(id)) return { erro: 'Dados inválidos.' }
  if (!titulo.trim() || titulo.length > 120) return { erro: 'O nome precisa ter de 1 a 120 caracteres.' }
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(() => telas.renomearTela(sb, tipo, id, titulo), 'Renomeado.')
  revalidatePath(CAMINHO[tipo])
  return r
}

export async function excluirTelaAcao(tipo: telas.TipoTela, id: string): Promise<Resultado> {
  if (!ehTipo(tipo) || !UUID.test(id)) return { erro: 'Dados inválidos.' }
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(() => telas.excluirTela(sb, tipo, id), 'Excluído.')
  revalidatePath(CAMINHO[tipo])
  return r
}
