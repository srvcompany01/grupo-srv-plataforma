import { redirect } from 'next/navigation'
import { destinoPorPapel } from '@/dominio/acesso'
import { usuarioAtual } from '@/infra/supabase/sessao'

export default async function Raiz() {
  const eu = await usuarioAtual()
  redirect(destinoPorPapel('/', eu?.papel ?? null, eu?.ativo ?? false) ?? '/inicio')
}
