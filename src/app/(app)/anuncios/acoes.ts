'use server'

import { revalidatePath } from 'next/cache'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { tentar, type Resultado } from '@/servicos/acao'
import { desconectarAgencia } from '@/servicos/google-agencia'

export async function desconectarGoogleAgenciaAcao(): Promise<Resultado> {
  await exigirAdmin()
  const r = await tentar(desconectarAgencia, 'Google da agência desconectado.')
  revalidatePath('/anuncios')
  return r
}
