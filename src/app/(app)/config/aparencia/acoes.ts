'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { COOKIE_LATERAL, normalizarHex } from '@/dominio/tema-lateral'
import { exigirAdmin } from '@/infra/supabase/sessao'
import type { Resultado } from '@/servicos/acao'

/** Preferência por navegador (cookie); fica em produção sem depender de migration. */
export async function salvarCorLateralAcao(entrada: string | null): Promise<Resultado> {
  await exigirAdmin()
  const jar = await cookies()
  if (entrada === null) {
    jar.delete(COOKIE_LATERAL)
  } else {
    const hex = normalizarHex(entrada)
    if (!hex) return { erro: 'Cor inválida. Use o formato #RRGGBB.' }
    jar.set(COOKIE_LATERAL, hex, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  }
  revalidatePath('/', 'layout')
  return { ok: entrada === null ? 'Cor padrão restaurada.' : 'Cor da barra lateral salva.' }
}
