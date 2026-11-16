'use server'

import { escreverFiltrosTempo, lerFiltrosTempo, type FiltrosTempo } from '@/dominio/tempo-faturavel'
import { dataDeHoje } from '@/dominio/filtros'
import { exigirGestorOuAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { registrosDoPeriodo, type RegistroDoPeriodo } from '@/servicos/tempo'

/** Registros do período com os filtros da tela (para o painel "Ver registros"). Revalida os filtros e o papel no servidor. */
export async function registrosDoPeriodoAcao(pedido: FiltrosTempo): Promise<{ registros: RegistroDoPeriodo[] } | { erro: string }> {
  await exigirGestorOuAdmin()
  const filtros = lerFiltrosTempo(Object.fromEntries(escreverFiltrosTempo(pedido)), dataDeHoje(new Date()))
  try {
    return { registros: await registrosDoPeriodo(await criarClienteServidor(), filtros) }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível carregar os registros.' }
  }
}
