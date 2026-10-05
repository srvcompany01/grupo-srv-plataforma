import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_SESSAO, sessaoValida } from './sessao'

/** Chamar no layout protegido E no início de toda Server Action do admin. */
export async function exigirAdmin(): Promise<void> {
  const valor = (await cookies()).get(COOKIE_SESSAO)?.value
  if (!sessaoValida(valor, process.env.SESSAO_SEGREDO ?? '', Date.now())) redirect('/admin/login')
}
