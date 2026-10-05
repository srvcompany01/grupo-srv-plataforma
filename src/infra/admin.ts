import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDb, type Db } from '@/db/conexao'
import { COOKIE_SESSAO, sessaoValida } from './sessao'

/** Chamar no início de toda Server Action do admin. */
export async function exigirAdmin(): Promise<void> {
  const valor = (await cookies()).get(COOKIE_SESSAO)?.value
  if (!sessaoValida(valor, process.env.SESSAO_SEGREDO ?? '', Date.now())) redirect('/admin/login')
}

/**
 * Único jeito de uma página do admin obter o banco. O layout NÃO protege as
 * páginas: no Next 16 a página renderiza em paralelo e entra no payload RSC
 * mesmo quando o layout redireciona.
 */
export async function dbAdmin(): Promise<Db> {
  await exigirAdmin()
  return getDb()
}
