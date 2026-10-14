'use server'

import { normalizarVisao } from '@/dominio/visao-salva'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { removerVisao, salvarVisao } from '@/servicos/visoes'

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
