'use server'

import { ehMetodo, normalizar } from '@/dominio/estrategia'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { salvarEstrategia } from '@/servicos/estrategia'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Grava o documento do método (chamado sozinho enquanto a pessoa edita). */
export async function salvarEstrategiaAcao(clienteId: string, metodo: string, dados: unknown): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(clienteId) || !ehMetodo(metodo)) return { erro: 'Cliente ou seção inválida.' }
  return tentar(async () => salvarEstrategia(await criarClienteServidor(), clienteId, metodo, normalizar(dados)))
}
