'use server'

import { revalidatePath } from 'next/cache'
import { validarTema, type Tema } from '@/dominio/tema'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'

/** Salva as cores da interface para a equipe toda. O servidor revalida contraste e formato. */
export async function salvarTemaAcao(entrada: Tema): Promise<Resultado> {
  const eu = await exigirAdmin()
  const r = validarTema(entrada as unknown as Record<string, unknown>)
  if ('erros' in r) return { erro: r.erros[0] }
  const sb = await criarClienteServidor()
  const resultado = await tentar(async () => {
    const { error } = await sb.from('app_settings').upsert({ key: 'tema', value: r.tema, updated_at: new Date().toISOString(), updated_by: eu.id })
    if (error) throw error
  }, 'Cores salvas para toda a equipe.')
  revalidatePath('/', 'layout')
  return resultado
}
